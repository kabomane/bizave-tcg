import { randomBytes } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import { parseArgs } from 'node:util'
import process from 'node:process'
import { GIFT_CODE_ALPHABET, hashGiftCode } from '../src/gifts/format.ts'

const root = new URL('../', import.meta.url)
const { values } = parseArgs({ options: { booster: { type: 'string' }, boosters: { type: 'string' }, 'card-variants': { type: 'string' }, 'weekly-bonus': { type: 'string' }, quantity: { type: 'string' }, fragments: { type: 'string' }, count: { type: 'string' }, 'expires-at': { type: 'string' } } })
const issuedAt = Date.now()
if (values['expires-at'] && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(values['expires-at'])) throw new Error('Utilisez --expires-at avec une date ISO et son fuseau, par exemple 2026-12-01T22:00:00+01:00.')
const expiresAt = values['expires-at'] ? Date.parse(values['expires-at']) : issuedAt + 24 * 60 * 60 * 1000
if (!Number.isSafeInteger(expiresAt) || expiresAt <= issuedAt) throw new Error('La date d’expiration doit être dans le futur.')
function positive(value, label) {
  if (!value || !/^\d+$/.test(value) || !Number.isSafeInteger(Number(value)) || Number(value) < 1) throw new Error(`${label} doit être un entier positif.`)
  return Number(value)
}
const count = positive(values.count, 'Le nombre de codes')
if (count > 10_000) throw new Error('Un lot est limité à 10 000 codes.')
let reward
if (values['weekly-bonus'] !== undefined) {
  if (values.booster !== undefined || values.boosters !== undefined || values.fragments !== undefined || values['card-variants'] !== undefined) throw new Error('Un bonus de la semaine ne peut pas être combiné avec une autre récompense.')
  const bonus = values['weekly-bonus']
  if (bonus !== 'reroll' && bonus !== 'fragments') throw new Error('Bonus inconnu. Utilisez reroll ou fragments.')
  const quantity = positive(values.quantity, 'La quantité de bonus')
  if (!Number.isSafeInteger(quantity + 1)) throw new Error('La quantité de bonus est trop élevée.')
  reward = { type: 'weekly-bonus', bonus, quantity }
}
else if (values['card-variants'] !== undefined) {
  if (values.booster !== undefined || values.boosters !== undefined || values.fragments !== undefined || values.quantity !== undefined) throw new Error('Un cadeau de variantes ne peut pas être combiné avec une autre récompense.')
  const cardId = values['card-variants']
  const cards = JSON.parse(await readFile(new URL('src/data/catalogue.json', root), 'utf8'))
  if (!cards.some(card => card.id === cardId && card.promoNumber)) throw new Error('Carte promo inconnue.')
  reward = { type: 'card-variants', cardId }
}
else if (values.boosters && !values.booster && !values.fragments) {
  const ids = values.boosters.split(',')
  if (!ids.length || new Set(ids).size !== ids.length || ids.some(id => !/^[a-z0-9][a-z0-9-]{0,79}$/.test(id))) throw new Error('Liste de boosters invalide.')
  reward = { type: 'boosters', boosters: ids.map(boosterId => ({ boosterId, quantity: positive(values.quantity, 'La quantité de chaque booster') })) }
}
else if (values.booster && !values.boosters && /^[a-z0-9][a-z0-9-]{0,79}$/.test(values.booster)) reward = { type: 'booster', boosterId: values.booster, quantity: positive(values.quantity, 'La quantité de boosters'), ...(values.fragments ? { fragments: positive(values.fragments, 'Le nombre de fragments') } : {}) }
else if (values.fragments && !values.booster && !values.boosters && !values.quantity) reward = { type: 'fragments', amount: positive(values.fragments, 'Le nombre de fragments') }
else throw new Error('Utilisez --booster <id> --quantity <nombre> [--fragments <nombre>], --boosters <id1,id2,...> --quantity <nombre>, --fragments <nombre>, --card-variants <id>, ou --weekly-bonus <reroll|fragments> --quantity <nombre>. Ajoutez --count <nombre>.')

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
  entries.push({ code: raw.match(/.{4}/g).join('-'), codeHash, reward, issuedAt, expiresAt })
}

const directory = new URL('.local/gift-codes/', root)
await mkdir(directory, { recursive: true })
const batchId = `${new Date().toISOString().replace(/[:.]/g, '-')}-${randomBytes(4).toString('hex')}`
const privatePath = new URL(`${batchId}.json`, directory)
// Persist the only cleartext copy before making any of its hashes redeemable.
await writeFile(privatePath, JSON.stringify({ batchId, createdAt: new Date(issuedAt).toISOString(), expiresAt: new Date(expiresAt).toISOString(), codes: entries }, null, 2) + '\n', { flag: 'wx', mode: 0o600 })
const temporary = new URL(`src/data/.gift-codes-${batchId}.tmp`, root)
await writeFile(temporary, JSON.stringify([...catalogue.filter(gift => Number.isSafeInteger(gift.expiresAt) && gift.expiresAt > issuedAt), ...entries.map(({ codeHash, reward, issuedAt, expiresAt }) => ({ codeHash, reward, issuedAt, expiresAt }))], null, 2) + '\n', { flag: 'wx' })
await rename(temporary, cataloguePath)
process.stdout.write(`${count} codes créés. Liste privée : ${fileURLToPath(privatePath)}\n`)
