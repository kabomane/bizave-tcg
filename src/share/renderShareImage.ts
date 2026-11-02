import type { Card, CardDefinition } from '../game/types'
import type { ShareFormat } from '../settings/preferences'
import holoPreviewTexture from '../assets/holo-preview.webp'
import { drawCard, drawSpaced, fillRR, textWidth } from './cardCanvas'

import { drawStoryBackdrop } from './storyBackdrop'

const images = new Map<string, Promise<HTMLImageElement>>()
function loadImage(src: string) {
  let pending = images.get(src)
  if (!pending) {
    pending = new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image()
      const fail = () => { if (images.get(src) === pending) images.delete(src); reject(new Error('Illustration de partage illisible.')) }
      // On Safari, load can precede the image becoming drawable on Canvas.
      // Never cache or offer an export until its actual image is decoded.
      image.onload = () => {
        void image.decode().then(() => {
          if (image.naturalWidth > 0 && image.naturalHeight > 0) resolve(image)
          else fail()
        }, fail)
      }
      image.onerror = fail
      image.src = src
    })
    if (images.size >= 8) images.delete(images.keys().next().value!)
  }
  images.delete(src); images.set(src, pending)
  return pending
}

export async function renderShareImage(card: Card, definition: CardDefinition, format: ShareFormat, theme: 'light' | 'dark' = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'): Promise<File> {
  const [art, holo] = await Promise.all([
    loadImage(definition.artwork[card.artVariant]), loadImage(holoPreviewTexture),
    document.fonts.load('700 15px Fraunces'), document.fonts.load('italic 500 13px Fraunces'),
    document.fonts.load('500 9px "Barlow Condensed"'),
  ])
  const canvas = document.createElement('canvas')
  canvas.width = format === 'card' ? 978 : 1080
  canvas.height = format === 'card' ? 1620 : 1920
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Le dessin de l’image est indisponible.')
  const scale = format === 'card' ? 3 : 740 / 326
  if (format === 'story') {
    drawStoryBackdrop(ctx, definition.rarity, theme)
    ctx.save(); ctx.shadowColor = '#0009'; ctx.shadowBlur = 90; ctx.shadowOffsetY = 50
    fillRR(ctx, 170, 250, 740, 540 * scale, 20 * scale, '#000'); ctx.restore()
    ctx.font = '500 30px "Barlow Condensed"'; ctx.fillStyle = theme === 'dark' ? '#ffffff80' : '#24252380'; ctx.textBaseline = 'middle'
    drawSpaced(ctx, 'BIZAVE TCG', 540 - textWidth(ctx, 'BIZAVE TCG', 9) / 2, 1750, 9)
    ctx.translate(170, 250)
  }
  ctx.scale(scale, scale)
  drawCard(ctx, scale, { ...definition, pos: definition.artworkPosition?.[card.artVariant] ?? (card.artVariant === 'fullArt' ? 'center 30%' : 'center 38%') }, card.finish, card.artVariant, { art, holo })
  const type = 'image/png'
  const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Impossible de créer l’image.')), type, .92))
  return new File([blob], `bizave-${definition.id}-${card.finish}-${card.artVariant}-${format}.png`, { type })
}
