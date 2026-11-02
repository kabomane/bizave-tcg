import { expect, test } from '@playwright/test'

for (const pile of [false, true]) test(`Premier partage à froid : illustration présente ${pile ? 'dans une pile' : 'sur une carte seule'}`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false })
    const decode = HTMLImageElement.prototype.decode
    HTMLImageElement.prototype.decode = function () {
      if (this.isConnected || !this.src.includes('/assets/cards/')) return decode.call(this)
      sessionStorage.setItem('export-awaiting-decode', 'yes')
      return new Promise<void>((resolve, reject) => document.addEventListener('release-export-decode', () => { void decode.call(this).then(resolve, reject) }, { once: true }))
    }
  })
  await page.goto('/collection')
  await expect(page.getByRole('heading', { name: 'Collection', exact: true })).toBeVisible()
  await page.evaluate(async pile => {
    const path = '/src/storage/database.ts', settings = '/src/settings/useSettings.ts'
    const { db } = await import(path), { updateSettings } = await import(settings)
    updateSettings({ collectionDisplay: { groupBy: pile ? 'card' : 'none', duplicates: 'hide', sort: 'rarity', direction: 'asc' } })
    await db.drops.bulkAdd((pile ? ['normal', 'glossy'] : ['normal']).map((finish, i) => ({ dropId: `first-${i}`, cardId: 'bb-eli', finish, artVariant: 'standard', status: 'owned', acquiredAt: i + 1, updatedAt: i + 1 })))
  }, pile)
  await page.reload(); await page.locator('.collection-grid .card').click()
  const share = page.getByRole('button', { name: 'Partager', exact: true })
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('export-awaiting-decode'))).toBe('yes')
  await expect(share).toBeDisabled()
  await page.evaluate(() => document.dispatchEvent(new Event('release-export-decode')))
  await expect(share).toBeEnabled(); await share.click()
  const link = page.getByRole('link', { name: 'Télécharger', exact: true })
  await expect(link).toBeVisible()
  const colors = await link.evaluate(async el => {
    const image = new Image(); image.src = (el as HTMLAnchorElement).href; await image.decode()
    const canvas = document.createElement('canvas'); canvas.width = image.naturalWidth; canvas.height = image.naturalHeight
    const ctx = canvas.getContext('2d')!; ctx.drawImage(image, 0, 0)
    const { data } = ctx.getImageData(240, 440, 600, 570), colors = new Set<string>()
    for (let i = 0; i < data.length; i += 400) colors.add(`${data[i] >> 3},${data[i + 1] >> 3},${data[i + 2] >> 3}`)
    return colors.size
  })
  // The empty blue art well (including its paper grain) has very few colors.
  expect(colors).toBeGreaterThan(150)
})
