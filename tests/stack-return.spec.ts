import { expandSettings } from './settings-helpers'
import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { mkdirSync, writeFileSync } from 'node:fs'

async function seed(page: Page, mode = 'four', duplicates = 'hide') {
  await page.goto('/collection')
  await expect(page.getByRole('heading', { name: 'Collection', exact: true })).toBeVisible()
  await page.evaluate(async ({ mode, duplicates }) => {
    const path = '/src/storage/database.ts', settingsPath = '/src/settings/useSettings.ts'
    const { db } = await import(path), { updateSettings } = await import(settingsPath)
    updateSettings({ actionBar: mode, collectionDisplay: { sort: 'rarity', direction: 'asc', groupBy: 'card', duplicates } })
    await db.drops.bulkAdd(['normal', 'glossy', 'alternative', 'normal'].map((finish, i) => ({
      cardId: 't-classique', finish, artVariant: i === 2 ? 'fullArt' : 'standard', dropId: `viewer-${i}`, status: 'owned', acquiredAt: 1000 + i, updatedAt: 1000 + i,
    })))
  }, { mode, duplicates })
  await page.reload()
}

for (const [width, height] of [[390, 844], [820, 1180], [1180, 820], [1440, 900]]) {
  for (const mode of ['four', 'two']) test(`D : vue directe et feuille alignée ${width}×${height}, ${mode}`, async ({ page }) => {
    await page.setViewportSize({ width, height }); await seed(page, mode)
    const tile = page.locator('.collection-pile .card'); await tile.click()
    const viewer = page.locator('.card-viewer')
    await expect(viewer.locator('.viewer-slide.is-current .card')).toBeVisible()
    await expect(viewer.locator('.viewer-dots button')).toHaveCount(3)
    await expect(viewer.locator('.viewer-meta')).toContainText('×2')
    await expect(page.locator('.stack-grid')).toHaveCount(0)
    const geometry = await viewer.evaluate(el => {
      const card = el.querySelector('.viewer-slide.is-current .card-scene')!.getBoundingClientRect()
      const arrow = el.querySelector('.viewer-next')!.getBoundingClientRect(), dock = el.querySelector('.viewer-dock')!.getBoundingClientRect()
      return { scroll: el.scrollHeight - el.clientHeight, cardBottom: card.bottom, dockTop: dock.top, arrowY: arrow.y + arrow.height / 2, cardY: card.y + card.height / 2 }
    })
    expect(geometry.scroll).toBe(0); expect(geometry.cardBottom).toBeLessThan(geometry.dockTop)
    expect(Math.abs(geometry.arrowY - geometry.cardY)).toBeLessThan(2)
    if (width >= 700) expect(await viewer.locator('.viewer-dock').evaluate(el => el.getBoundingClientRect().width)).toBe(mode === 'four' ? 440 : 400)
    await page.keyboard.press('ArrowRight')
    await expect(viewer.locator('.viewer-slide.is-current .card')).toHaveClass(/glossy/)
    await viewer.getByRole('button', { name: /^Recycler/ }).click()
    const sheet = page.getByRole('dialog', { name: 'Recycler cet exemplaire ?', exact: true })
    await expect(sheet).toBeVisible()
    const dock = await viewer.locator('.viewer-dock').boundingBox(), box = await sheet.boundingBox()
    expect(Math.abs(dock!.x - box!.x)).toBeLessThan(1); expect(Math.abs(dock!.width - box!.width)).toBeLessThan(1)
    expect(Math.abs(dock!.y + dock!.height - box!.y - box!.height)).toBeLessThan(1)
    await expect(sheet).toContainText('dernier exemplaire')
    await page.keyboard.press('Escape'); await expect(sheet).toHaveCount(0); await expect(viewer).toBeVisible()
    await page.screenshot({ path: `artifacts/viewer-D-${width}-${mode}-${test.info().project.name}.png` })
    await viewer.getByRole('button', { name: 'Fermer', exact: true }).click()
    await expect(viewer).toHaveCount(0); await expect(tile).toBeFocused()
  })
}

test('D : doublons séparés, favoris par variante et recyclage jusqu’à pile vide', async ({ page }) => {
  await seed(page, 'four', 'show'); await page.locator('.collection-pile .card').click()
  const viewer = page.locator('.card-viewer')
  await expect(viewer.locator('.viewer-dots button')).toHaveCount(4)
  await expect(viewer.locator('.viewer-meta b')).toHaveCount(0)
  await viewer.getByRole('button', { name: 'Ajouter aux favoris', exact: true }).click()
  await expect(viewer.getByRole('button', { name: 'Retirer des favoris', exact: true })).toBeVisible()
  await viewer.locator('.viewer-dots button').nth(1).click()
  await expect(viewer.locator('.viewer-dots button').nth(1)).toHaveAttribute('aria-current', 'true')
  await expect(viewer.getByRole('button', { name: 'Retirer des favoris', exact: true })).toBeVisible()
  for (let count = 4; count > 0; count--) {
    await viewer.getByRole('button', { name: 'Recycler', exact: true }).click()
    await page.getByRole('dialog', { name: 'Recycler cet exemplaire ?', exact: true }).getByRole('button', { name: /^Recycler ·/ }).click()
    if (count > 1) await expect(viewer.locator('.viewer-slide')).toHaveCount(count - 1)
  }
  await expect(viewer).toHaveCount(0); await expect(page.locator('.collection-grid .card')).toHaveCount(0)
})

test('D : partage synchrone du fichier préparé, téléchargement et format choisi', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => true })
    Object.defineProperty(navigator, 'share', { configurable: true, value: (data: ShareData) => {
      const file = data.files![0]
      sessionStorage.setItem('shared', JSON.stringify({ type: file.type, size: file.size, active: navigator.userActivation?.isActive }))
      return Promise.resolve()
    } })
  })
  await seed(page); await page.locator('.collection-pile .card').click()
  const share = page.getByRole('button', { name: 'Partager', exact: true })
  await expect(share).toBeEnabled(); await share.click()
  const result = await page.evaluate(() => JSON.parse(sessionStorage.getItem('shared')!))
  expect(result.type).toBe('image/png'); expect(result.size).toBeGreaterThan(10000); expect(result.active).toBe(true)
  await page.evaluate(() => Object.defineProperty(navigator, 'canShare', { value: () => false }))
  await share.click()
  const sheet = page.getByRole('dialog', { name: 'Image de partage' }), image = sheet.locator('img')
  await expect(sheet.getByText('Appui long pour l’enregistrer')).toBeVisible()
  await expect.poll(() => image.evaluate((el: HTMLImageElement) => [el.naturalWidth, el.naturalHeight])).toEqual([1080, 1920])
  const download = page.waitForEvent('download'); await sheet.getByRole('link', { name: 'Télécharger' }).click()
  expect((await download).suggestedFilename()).toMatch(/\.png$/)
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape')
  await page.goto('/parametres'); await expandSettings(page, 'collection')
  await page.getByRole('group', { name: 'Image de partage' }).getByRole('button', { name: 'Carte', exact: true }).click()
  await page.goto('/collection'); await page.locator('.collection-pile .card').click()
  await expect(share).toBeEnabled(); await share.click()
  expect((await page.evaluate(() => JSON.parse(sessionStorage.getItem('shared')!))).type).toBe('image/png')
  await page.evaluate(() => Object.defineProperty(navigator, 'canShare', { value: () => false })); await share.click()
  await expect.poll(() => image.evaluate((el: HTMLImageElement) => [el.naturalWidth, el.naturalHeight])).toEqual([978, 1620])
})

test('Canvas : six variantes exportables et coins transparents', async ({ page }) => {
  await page.goto('/collection')
  const results = await page.evaluate(async () => {
    const rendererPath = '/src/share/renderShareImage.ts', cardsPath = '/src/data/cards.ts'
    const { renderShareImage } = await import(rendererPath), { cardById } = await import(cardsPath)
    const results = []
    for (const finish of ['normal', 'glossy', 'alternative']) for (const artVariant of ['standard', 'fullArt']) {
      const file = await renderShareImage({ cardId: 'eli-veilleuse', dropId: 'test', finish, artVariant }, cardById.get('eli-veilleuse'), 'card')
      const url = URL.createObjectURL(file), img = new Image(); img.src = url; await img.decode()
      const canvas = document.createElement('canvas'); canvas.width = 978; canvas.height = 1620
      const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0)
      results.push({ finish, artVariant, png: canvas.toDataURL().split(',')[1], type: file.type, width: img.width, height: img.height, corner: ctx.getImageData(0, 0, 1, 1).data[3], center: ctx.getImageData(489, 810, 1, 1).data[3] })
      URL.revokeObjectURL(url)
    }
    return results
  })
  expect(results).toHaveLength(6)
  mkdirSync('artifacts/share', { recursive: true })
  for (const result of results) writeFileSync(`artifacts/share/${result.finish}-${result.artVariant}-${test.info().project.name}.png`, Buffer.from(result.png, 'base64'))
  for (const result of results) expect(result).toMatchObject({ type: 'image/png', width: 978, height: 1620, corner: 0, center: 255 })
})

test('D : réduction des animations, annulation du partage et libération des URLs', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { value: () => true })
    Object.defineProperty(navigator, 'share', { value: () => Promise.reject(new DOMException('Annulé', 'AbortError')) })
    const create = URL.createObjectURL.bind(URL), revoke = URL.revokeObjectURL.bind(URL), live = new Set<string>()
    URL.createObjectURL = blob => { const url = create(blob); live.add(url); sessionStorage.setItem('urls', String(live.size)); return url }
    URL.revokeObjectURL = url => { live.delete(url); sessionStorage.setItem('urls', String(live.size)); revoke(url) }
  })
  await seed(page); await page.locator('.collection-pile .card').click()
  const viewer = page.locator('.card-viewer')
  await viewer.getByRole('button', { name: 'Carte suivante', exact: true }).click()
  await expect(viewer.locator('.viewer-slide.is-current .card')).toHaveClass(/glossy/)
  expect(await viewer.locator('*').evaluateAll(elements => elements.every(el => getComputedStyle(el).animationName === 'none'))).toBe(true)
  await expect(viewer.getByRole('button', { name: 'Partager', exact: true })).toBeEnabled()
  await viewer.getByRole('button', { name: 'Partager', exact: true }).click()
  await expect(page.locator('.viewer-sheet, .viewer-error')).toHaveCount(0)
  await viewer.getByRole('button', { name: 'Fermer', exact: true }).click()
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('urls'))).toBe('0')
})
