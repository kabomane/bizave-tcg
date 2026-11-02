import { expect, test } from '@playwright/test'
import { writeFileSync } from 'node:fs'

test('Titres exportés : centrés dans les trois finitions, sans trace sur l’illustration', async ({ page }) => {
  await page.goto('/collection')
  const results = await page.evaluate(async () => {
    const rendererPath = '/src/share/renderShareImage.ts', cardsPath = '/src/data/cards.ts'
    const { renderShareImage } = await import(rendererPath), { cardById } = await import(cardsPath)
    const definition = cardById.get('bb-eli')
    async function pixels(file: File) {
      const image = new Image(), url = URL.createObjectURL(file); image.src = url; await image.decode()
      const canvas = document.createElement('canvas'); canvas.width = image.width; canvas.height = image.height
      const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0); URL.revokeObjectURL(url)
      return { data: ctx.getImageData(0, 0, canvas.width, canvas.height).data, width: canvas.width, png: canvas.toDataURL().split(',')[1] }
    }
    const results = []
    for (const format of ['card', 'story']) for (const finish of ['normal', 'glossy', 'alternative']) {
      const card = { dropId: 'title', cardId: 'bb-eli', finish, artVariant: 'standard' }
      const actual = await pixels(await renderShareImage(card, definition, format, 'dark'))
      const empty = await pixels(await renderShareImage(card, { ...definition, title: ' ' }, format, 'dark'))
      const S = format === 'card' ? 3 : 740 / 326, dx = format === 'card' ? 0 : 170, dy = format === 'card' ? 0 : 250
      const difference = (x: number, y: number) => {
        const i = (y * actual.width + x) * 4
        return Math.abs(actual.data[i] - empty.data[i]) + Math.abs(actual.data[i + 1] - empty.data[i + 1]) + Math.abs(actual.data[i + 2] - empty.data[i + 2])
      }
      let top = Infinity, bottom = -Infinity, bleed = 0
      for (let y = Math.floor(dy + 15 * S); y < Math.ceil(dy + 49.5 * S); y++) for (let x = Math.ceil(dx + 20 * S); x < Math.floor(dx + 265 * S); x++) {
        if (difference(x, y) > 100) { top = Math.min(top, y); bottom = Math.max(bottom, y) }
      }
      for (let y = Math.ceil(dy + 55.5 * S); y < Math.floor(dy + 90 * S); y++) for (let x = Math.ceil(dx + 15 * S); x < Math.floor(dx + 311 * S); x++) if (difference(x, y) > 10) bleed++
      results.push({ format, finish, centerError: Math.abs((top + bottom) / 2 - (dy + 32.25 * S)) / S, bleed, png: actual.png })
    }
    return results
  })
  for (const result of results) {
    expect(result.centerError, `${result.format} ${result.finish}`).toBeLessThan(1.5)
    expect(result.bleed, `${result.format} ${result.finish}`).toBe(0)
    writeFileSync(`artifacts/titre-corrige-${result.format}-${result.finish}-${test.info().project.name}.png`, Buffer.from(result.png, 'base64'))
  }
})

test('Cartes affichées : un seul titre, bandeaux de même hauteur et centrés', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.goto('/collection')
  await expect(page.getByRole('heading', { name: 'Collection', exact: true })).toBeVisible()
  await page.evaluate(async () => {
    const path = '/src/storage/database.ts', { db } = await import(path)
    await db.drops.bulkAdd(['normal', 'glossy', 'alternative'].map((finish, i) => ({ cardId: 'bb-eli', finish, artVariant: 'standard', dropId: `title-${i}`, status: 'owned', acquiredAt: i + 1, updatedAt: i + 1 })))
  })
  await expect(page.locator('.collection-grid .card')).toHaveCount(3)
  await expect(page.locator('.card-info h2')).toHaveCount(0)
  for (const card of await page.locator('.collection-grid .card').all()) {
    await expect(card.locator('.nb-title')).toHaveCount(1)
    const geometry = await card.evaluate(el => {
      const bar = el.querySelector('.name-bar')!.getBoundingClientRect(), title = el.querySelector('.nb-title')!.getBoundingClientRect()
      return { height: getComputedStyle(el.querySelector('.name-bar')!).height, delta: Math.abs((bar.top + bar.bottom - title.top - title.bottom) / 2) }
    })
    expect(geometry.height).toBe('34.5px'); expect(geometry.delta).toBeLessThan(1)
    await card.click()
    await expect(page.locator('.viewer-slide.is-current .card-info h2')).toHaveCount(0)
    await expect(page.locator('.viewer-slide.is-current .nb-title')).toHaveCount(1)
    await page.getByRole('button', { name: 'Fermer', exact: true }).click()
  }
  await page.screenshot({ path: `artifacts/titres-classiques-${test.info().project.name}.png` })
})
