import { randomBytes } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import { parseArgs } from 'node:util'
import process from 'node:process'
import { GIFT_CODE_ALPHABET, hashGiftCode } from '../src/gifts/format.ts'

const root = new URL('../', import.meta.url)
const { values } = parseArgs({ options: { booster: { type: 'string' }, quantity: { type: 'string' }, fragments: { type: 'string' }, count: { type: 'string' } } })
function positive(value, label) {
  if (!value || !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) throw new Error(`${label} doit être un entier positif.`)
  return Number(value)
}
const count = positive(values.count, 'Le nombre de codes')
if (count > 10_000) throw new Error('Un lot est limité à 10 000 codes.')
let reward
if (values.booster && /^[a-z0-9][a-z0-9-]{0,79}$/.test(values.booster)) reward = { type: 'booster', boosterId: values.booster, quantity: positive(values.quantity, 'La quantité de boosters'), ...(values.fragments ? { fragments: positive(values.fragments, 'Le nombre de fragments') } : {}) }
else if (values.fragments && !values.booster && !values.quantity) reward = { type: 'fragments', amount: positive(values.fragments, 'Le nombre de fragments') }
else throw new Error('Utilisez --booster <id> --quantity <nombre> [--fragments <nombre>] --count <nombre>, ou --fragments <nombre> --count <nombre>.')

const cataloguePath = new URL('src/data/gift-codes.json', root)
const catalogue = JSON.parse(await readFile(cataloguePath, 'utf8'))
if (!Array.isArray(catalogue)) throw new Error('Catalogue de cadeaux invalide.')
const hashes = new Set(catalogue.map(gift => gift.codeHash))
const entries = []
while (entries.length < count) {
  // Sixteen independent uniform 5-bit symbols: 80 bits of entropy.
  const raw = Array.from(randomBytes(16), byte => GIFT_CODE_ALPHABET[byte & 31]).join('')
  const codeHash = await hashGiftCode(raw)
  if (hashes.has(codeHash)) continue
  hashes.add(codeHash)
  entries.push({ code: raw.match(/.{4}/g).join('-'), codeHash, reward })
}

const directory = new URL('.local/gift-codes/', root)
await mkdir(directory, { recursive: true })
const batchId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomBytes(4).toString('hex')}`
const privatePath = new URL(`${batchId}.json`, directory)
// Persist the only cleartext copy before making any of its hashes redeemable.
await writeFile(privatePath, JSON.stringify({ batchId, createdAt: new Date().toISOString(), expiresAt: null, codes: entries }, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
const temporary = new URL(`src/data/.gift-codes-${batchId}.tmp`, root)
await writeFile(temporary, JSON.stringify([...catalogue, ...entries.map(({ codeHash, reward }) => ({ codeHash, reward }))], null, 2) + '\n', { flag: 'wx' })
await rename(temporary, cataloguePath)
process.stdout.write(`${count} codes créés. Liste privée : ${fileURLToPath(privatePath)}\n`)
