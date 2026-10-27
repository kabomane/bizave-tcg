import fs from 'node:fs/promises'
import path from 'node:path'
import { createHash } from 'node:crypto'
import process from 'node:process'
import console from 'node:console'
import sharp from 'sharp'

const root = process.cwd(), cataloguePath = path.join(root, 'src/data/catalogue.json')
const originals = path.join(root, 'illustrations/originals'), published = path.join(root, 'public/assets/cards')
const args = process.argv.slice(2)
if (args.length && (args.length !== 2 || args[0] !== '--only' || !args[1])) throw new Error('Usage : npm run illustrations [-- --only <id>]')
const only = args[1], catalogue = JSON.parse(await fs.readFile(cataloguePath, 'utf8'))
const byId = new Map(catalogue.map(card => [card.id, card]))
const entries = (await fs.readdir(originals, { withFileTypes: true }).catch(error => {
  if (error.code === 'ENOENT') throw new Error('Dossier illustrations/originals/ absent. Créez-le et déposez-y les originaux avant de lancer npm run illustrations.')
  throw error
})).filter(entry => entry.isFile() && /\.(png|jpe?g|webp)$/i.test(entry.name)).sort((a, b) => a.name.localeCompare(b.name))
const unknown = entries.filter(entry => !byId.has(path.parse(entry.name).name))
if (unknown.length) throw new Error('Originaux sans carte dans le catalogue : ' + unknown.map(entry => entry.name).join(', '))
const ids = entries.map(entry => path.parse(entry.name).name)
const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index)
if (duplicates.length) throw new Error('Plusieurs originaux pour une même carte : ' + [...new Set(duplicates)].join(', '))
if (only && (!byId.has(only) || !ids.includes(only))) throw new Error('Aucun original pour la carte : ' + only)

// Validate and encode the whole selection before changing any published resource.
const converted = []
for (const entry of entries.filter(entry => !only || path.parse(entry.name).name === only)) {
  const id = path.parse(entry.name).name, source = path.join(originals, entry.name)
  if (!/^[a-z0-9][a-z0-9-]*$/.test(id)) throw new Error('Identifiant de carte invalide : ' + id)
  const metadata = await sharp(source).metadata()
  const swapped = metadata.orientation >= 5 && metadata.orientation <= 8
  const width = swapped ? metadata.height : metadata.width, height = swapped ? metadata.width : metadata.height
  if (Math.abs(width / height / (3 / 4) - 1) > .01) console.warn(`Avertissement ${id} : ratio ${width} × ${height}, recadrage au centre.`)
  if (width < 900 || height < 1200) console.warn(`Avertissement ${id} : source ${width} × ${height}, agrandissement à 900 × 1200.`)
  const buffer = await sharp(source).rotate().resize(900, 1200, { fit: 'cover', position: 'centre' }).toColourspace('srgb').webp({ quality: 85, effort: 6 }).toBuffer()
  const hash = createHash('sha256').update(buffer).digest('hex').slice(0, 10)
  converted.push({ id, buffer, filename: `illustration.${hash}.webp`, sourceBytes: (await fs.stat(source)).size })
}
for (const item of converted) {
  const folder = path.join(published, item.id), destination = path.join(folder, item.filename)
  await fs.mkdir(folder, { recursive: true })
  try { await fs.writeFile(destination, item.buffer, { flag: 'wx' }) }
  catch (error) {
    if (error.code !== 'EEXIST') throw error
    if (!(await fs.readFile(destination)).equals(item.buffer)) throw new Error('Fichier existant incohérent : ' + destination, { cause: error })
  }
  const card = byId.get(item.id), url = `/assets/cards/${item.id}/${item.filename}`
  card.artwork.standard = url; card.artwork.fullArt = url
}
const contents = JSON.stringify(catalogue, null, 2) + '\n'
if (contents !== await fs.readFile(cataloguePath, 'utf8')) await fs.writeFile(cataloguePath, contents)
for (const item of converted) {
  const folder = path.join(published, item.id)
  for (const entry of await fs.readdir(folder, { withFileTypes: true })) {
    if (entry.isFile() && entry.name !== item.filename && (/^illustration\./.test(entry.name) || entry.name === 'standard.svg' || entry.name === 'full-art.svg')) await fs.unlink(path.join(folder, entry.name))
  }
  console.log(`${item.id} : ${item.sourceBytes} → ${item.buffer.length} octets (${item.filename})`)
}
const missing = []
for (const card of catalogue) for (const url of Object.values(card.artwork)) {
  const file = path.resolve(root, 'public', url.replace(/^\//, ''))
  if (!file.startsWith(path.resolve(root, 'public') + path.sep)) throw new Error('Chemin hors de public : ' + url)
  try { await fs.access(file) } catch { missing.push(url) }
}
if (missing.length) throw new Error('Assets manquants : ' + [...new Set(missing)].join(', '))
console.log(`Total : ${converted.length} illustration(s), ${converted.reduce((sum, item) => sum + item.sourceBytes, 0)} → ${converted.reduce((sum, item) => sum + item.buffer.length, 0)} octets.`)
