import fs from 'node:fs/promises'
import { fileURLToPath, URL } from 'node:url'
import { Buffer } from 'node:buffer'
import console from 'node:console'
import sharp from 'sharp'

// Bake the foil grain once. No SVG filters or per-card noise generation at runtime.
const width = 326, height = 540
let seed = 0x51f01a
const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32 }
const grain = Array.from({ length: 2400 }, () => {
  const x = (random() * width).toFixed(2), y = (random() * height).toFixed(2)
  const radius = (.3 + random() * .75).toFixed(2), opacity = (.12 + random() * .5).toFixed(2)
  return `<circle cx="${x}" cy="${y}" r="${radius}" fill="${random() > .18 ? '#fff' : '#939dbb'}" opacity="${opacity}"/>`
}).join('')
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs><linearGradient id="foil" x1="0" y1="0" x2="1" y2="1">
    <stop stop-color="#40ceff" stop-opacity=".22"/><stop offset=".18" stop-color="#d245ff" stop-opacity=".2"/>
    <stop offset=".36" stop-color="#f7db32" stop-opacity=".22"/><stop offset=".52" stop-color="#32e8be" stop-opacity=".18"/>
    <stop offset=".7" stop-color="#5e82ff" stop-opacity=".22"/><stop offset=".86" stop-color="#f05cd3" stop-opacity=".18"/>
    <stop offset="1" stop-color="#ffe878" stop-opacity=".22"/>
  </linearGradient></defs>
  <path fill="url(#foil)" d="M0 0h${width}v${height}H0z"/>
  <path d="M-80 0H-20L406 540H346Z M60 0H84L510 540H486Z" fill="#fff" opacity=".05"/>
  ${grain}
</svg>`
const output = await sharp(Buffer.from(svg)).toColourspace('srgb').webp({ quality: 92, alphaQuality: 100, effort: 6 }).toBuffer()
const directory = fileURLToPath(new URL('../src/assets/', import.meta.url))
const destination = fileURLToPath(new URL('../src/assets/holo-preview.webp', import.meta.url))
await fs.mkdir(directory, { recursive: true })
const existing = await fs.readFile(destination).catch(error => { if (error.code !== 'ENOENT') throw error })
if (!existing?.equals(output)) await fs.writeFile(destination, output)
console.log(`Texture holo partagée : ${width} × ${height}, ${output.length} octets. Vite versionne son URL au build.`)
