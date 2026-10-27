import { expect, it } from 'vitest'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import sharp from 'sharp'

const script = resolve('scripts/convert-illustrations.mjs')
const fingerprint = (data: Buffer) => createHash('sha256').update(data).digest('hex')
async function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'bizave-illustrations-'))
  for (const dir of ['src/data', 'illustrations/originals', 'public/assets/cards/test']) mkdirSync(join(root, dir), { recursive: true })
  const catalogue = [{ id: 'test', title: 'Test', rarity: 'common', collectionId: 'test', description: 'Texte conservé', artwork: { standard: '/assets/cards/test/standard.svg', fullArt: '/assets/cards/test/full-art.svg' }, artworkPosition: { standard: 'center top' } }]
  writeFileSync(join(root, 'src/data/catalogue.json'), JSON.stringify(catalogue, null, 2) + '\n')
  for (const file of ['standard.svg', 'full-art.svg']) writeFileSync(join(root, 'public/assets/cards/test', file), '<svg/>')
  await sharp({ create: { width: 12, height: 12, channels: 3, background: '#ca3388' } }).png().toFile(join(root, 'illustrations/originals/test.png'))
  return { root, catalogue }
}

it('refuse tous les originaux inconnus avant toute écriture, même avec --only', async () => {
  const { root } = await fixture(), original = readFileSync(join(root, 'src/data/catalogue.json'))
  writeFileSync(join(root, 'illustrations/originals/unknown.png'), 'not-an-image')
  const result = spawnSync(process.execPath, [script, '--only', 'test'], { cwd: root, encoding: 'utf8' })
  expect(result.status).not.toBe(0)
  expect(result.stderr).toContain('unknown.png')
  expect(readFileSync(join(root, 'src/data/catalogue.json'))).toEqual(original)
  expect(readdirSync(join(root, 'public/assets/cards/test')).sort()).toEqual(['full-art.svg', 'standard.svg'])
})

it('convertit, avertit, préserve les originaux et les autres champs, puis reste idempotent', async () => {
  const { root, catalogue } = await fixture(), original = readFileSync(join(root, 'illustrations/originals/test.png'))
  const result = spawnSync(process.execPath, [script, '--only', 'test'], { cwd: root, encoding: 'utf8' })
  expect(result.status, result.stderr).toBe(0)
  expect(result.stderr).toContain('recadrage au centre')
  expect(result.stderr).toContain('agrandissement')
  const updated = JSON.parse(readFileSync(join(root, 'src/data/catalogue.json'), 'utf8'))
  expect({ ...updated[0], artwork: catalogue[0].artwork }).toEqual(catalogue[0])
  expect(updated[0].artwork.standard).toBe(updated[0].artwork.fullArt)
  const file = join(root, 'public', updated[0].artwork.standard.slice(1)), bytes = readFileSync(file), metadata = await sharp(bytes).metadata()
  expect(file).toContain(`illustration.${fingerprint(bytes).slice(0, 10)}.webp`)
  expect(metadata).toMatchObject({ width: 900, height: 1200, format: 'webp', space: 'srgb' })
  expect(readFileSync(join(root, 'illustrations/originals/test.png'))).toEqual(original)
  expect(readdirSync(join(root, 'public/assets/cards/test'))).toHaveLength(1)
  const mtime = statSync(file).mtimeMs, json = readFileSync(join(root, 'src/data/catalogue.json'))
  execFileSync(process.execPath, [script], { cwd: root, stdio: 'pipe' })
  expect(statSync(file).mtimeMs).toBe(mtime)
  expect(readFileSync(join(root, 'src/data/catalogue.json'))).toEqual(json)
}, 15000)
