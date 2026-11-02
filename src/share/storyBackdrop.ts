import { RARITY_COLORS } from '../game/config'
import type { Rarity } from '../game/types'

/** Portable Gaussian blur for the three CSS halos; no Canvas filter or illustration. */
function blur(source: Float32Array, width: number, height: number, sigma: number) {
  const radius = Math.ceil(sigma * 3), weights = Array.from({ length: radius * 2 + 1 }, (_, i) => Math.exp(-.5 * ((i - radius) / sigma) ** 2))
  const sum = weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < weights.length; i++) weights[i] /= sum
  const horizontal = new Float32Array(source.length), result = new Float32Array(source.length)
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    for (let k = -radius; k <= radius; k++) horizontal[y * width + x] += source[y * width + Math.max(0, Math.min(width - 1, x + k))] * weights[k + radius]
  }
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    for (let k = -radius; k <= radius; k++) result[y * width + x] += horizontal[Math.max(0, Math.min(height - 1, y + k)) * width + x] * weights[k + radius]
  }
  return result
}

const colors = (hex: string) => [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16))
export function drawStoryBackdrop(ctx: CanvasRenderingContext2D, rarity: Rarity, theme: 'light' | 'dark') {
  const width = 96, height = 171, first = new Float32Array(width * height), second = new Float32Array(width * height)
  const glow = (x: number, y: number, cx: number, cy: number, stop: number) => {
    // Pseudo-elements span -30%..130%, as in card-viewer.css.
    const farthest = Math.hypot(Math.max(cx, 1 - cx) * 1.6 * 1080, Math.max(cy, 1 - cy) * 1.6 * 1920)
    const distance = Math.hypot((x + .3 - cx * 1.6) * 1080, (y + .3 - cy * 1.6) * 1920)
    return Math.max(0, 1 - distance / (farthest * stop))
  }
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const a = glow(x / width, y / height, .08, .22, .48), b = glow(x / width, y / height, .92, .86, .44)
    first[y * width + x] = a + b * (1 - a)
    second[y * width + x] = glow(x / width, y / height, .72, -.08, .56)
  }
  const sigma = 90 / 390 * width, a = blur(first, width, height, sigma), b = blur(second, width, height, sigma)
  const base = colors(theme === 'dark' ? '#191a1c' : '#f3f1eb'), tint = colors(RARITY_COLORS[rarity])
  const layer = document.createElement('canvas'); layer.width = width; layer.height = height
  const low = layer.getContext('2d')!, pixels = low.createImageData(width, height)
  for (let i = 0; i < a.length; i++) {
    const alpha = a[i] * .16 + b[i] * .07 * (1 - a[i] * .16)
    for (let channel = 0; channel < 3; channel++) pixels.data[i * 4 + channel] = base[channel] * (1 - alpha) + tint[channel] * alpha
    pixels.data[i * 4 + 3] = 255
  }
  low.putImageData(pixels, 0, 0)
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(layer, 0, 0, 1080, 1920)
}
