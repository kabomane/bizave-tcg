import { expect, test } from '@playwright/test'

test('Collection : mêmes dimensions, légendes alignées et fragments toujours à droite', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/collection')
  await expect(page.getByRole('heading', { name: 'Collection', exact: true })).toBeVisible()
  await page.evaluate(async () => {
    const path = '/src/storage/database.ts', settings = '/src/settings/useSettings.ts'
    const { db } = await import(path)
    ;(await import(settings)).updateSettings({ theme: 'dark', collectionDisplay: { groupBy: 'card', duplicates: 'hide', sort: 'value', direction: 'desc' } })
    await db.drops.bulkAdd([
      { cardId: 'kis-arashi', finish: 'normal', artVariant: 'fullArt' },
      { cardId: 'kis-arashi', finish: 'normal', artVariant: 'standard' },
      { cardId: 'm-minis', finish: 'normal', artVariant: 'standard' },
      { cardId: 'm-minis', finish: 'normal', artVariant: 'standard' },
    ].map((card, i) => ({ ...card, dropId: `alignment-${i}`, status: 'owned', acquiredAt: i + 1, updatedAt: i + 1 })))
  })
  await page.reload()
  await expect(page.locator('.collection-item')).toHaveCount(2)
  for (const width of [320, 390, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(page.locator('.collection-grid .card')).toHaveCount(2)
    const boxes = await page.locator('.collection-item').evaluateAll(items => items.map(item => {
      const face = item.querySelector('.card-scene')!.getBoundingClientRect(), caption = item.querySelector('.card-caption')!.getBoundingClientRect(), value = item.querySelector('.card-fragment-value')!.getBoundingClientRect()
      return { top: face.top, bottom: face.bottom, width: face.width, captionY: caption.y, fragmentY: value.y, rightInset: face.right - value.right }
    }))
    for (const key of ['top', 'bottom', 'width', 'captionY', 'fragmentY'] as const) expect(Math.abs(boxes[0][key] - boxes[1][key]), `${width}px ${key}`).toBeLessThan(1)
    for (const box of boxes) expect(Math.abs(box.rightInset)).toBeLessThan(1)
    if (width === 390) await page.screenshot({ path: `artifacts/collection-alignee-${test.info().project.name}.png` })
  }
})

test('Boosters : réserve accolée au stock gratuit, sans invitation à toucher', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Ouvrir le booster Memory Frame', exact: true })).toBeVisible()
  await page.evaluate(async () => {
    const path = '/src/storage/database.ts', { db } = await import(path)
    await db.player.update('local', { freePackStock: 0, nextFreePackAt: Date.now() + 600_000 })
    await db.boosterStock.put({ boosterId: 'phantom-blood', quantity: 2, updatedAt: Date.now() })
  })
  await expect(page.locator('.booster-stock-count')).toHaveText(/0\s*\/\s*5\s*\+\s*2/)
  await expect(page.getByText('Toucher pour ouvrir')).toHaveCount(0)
  await expect(page.locator('.pack-hint-row')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Ouvrir le booster Memory Frame', exact: true })).toBeEnabled()
  await page.screenshot({ path: `artifacts/stock-reserve-${test.info().project.name}.png` })
  await page.getByRole('button', { name: 'Booster suivant', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Ouvrir le booster Anima Isekai', exact: true })).toBeVisible()
  await expect(page.locator('.purchased-pack-reserve')).toHaveCount(0)
})

test('Story PNG : halos, thème système actualisé et fichier prêt avant le partage', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false })
  })
  await page.goto('/collection')
  await expect(page.getByRole('heading', { name: 'Collection', exact: true })).toBeVisible()
  await page.evaluate(async () => {
    const path = '/src/storage/database.ts', { db } = await import(path)
    await db.drops.add({ dropId: 'story-theme', cardId: 'eli-veilleuse', finish: 'normal', artVariant: 'standard', status: 'owned', acquiredAt: 1, updatedAt: 1 })
  })
  await page.locator('.collection-grid .card').click()
  const share = page.getByRole('button', { name: 'Partager', exact: true })
  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme })
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    await expect(share).toBeEnabled(); await share.click()
    const image = page.locator('.share-preview img')
    await expect.poll(() => image.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(1080)
    const sample = await image.evaluate((img: HTMLImageElement) => {
      const canvas = document.createElement('canvas'); canvas.width = 1080; canvas.height = 1920
      const ctx = canvas.getContext('2d')!; ctx.drawImage(img, 0, 0)
      return Array.from(ctx.getImageData(20, 20, 1, 1).data)
    })
    expect(sample[3]).toBe(255)
    if (theme === 'light') expect(sample[0]).toBeGreaterThan(200)
    else expect(sample[0]).toBeLessThan(80)
    const download = page.waitForEvent('download')
    await page.getByRole('link', { name: 'Télécharger' }).click()
    const file = await download
    expect(file.suggestedFilename()).toMatch(/-story\.png$/)
    await file.saveAs(`artifacts/story-halos-${theme}-${test.info().project.name}.png`)
    await page.keyboard.press('Escape')
  }
})
