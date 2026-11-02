import { expect, test } from '@playwright/test'

test('D : le glissé tactile natif annule le tilt et change de carte', async ({ page, browserName }) => {
  test.skip(browserName !== 'chromium', 'Injection de gestes tactiles natifs par CDP.')
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/collection')
  await expect(page.getByRole('heading', { name: 'Collection', exact: true })).toBeVisible()
  await page.evaluate(async () => {
    const path = '/src/storage/database.ts', settings = '/src/settings/useSettings.ts'
    const { db } = await import(path), { updateSettings } = await import(settings)
    updateSettings({ collectionDisplay: { groupBy: 'card', duplicates: 'hide', sort: 'rarity', direction: 'asc' } })
    await db.drops.bulkAdd(['normal', 'glossy'].map((finish, i) => ({ dropId: `touch-${i}`, cardId: 't-classique', artVariant: 'standard', finish, status: 'owned', acquiredAt: i + 1, updatedAt: i + 1 })))
  })
  await page.reload()
  await page.locator('.collection-pile .card').click()
  const card = page.locator('.viewer-slide.is-current .card')
  await expect(page.locator('.viewer-slide.is-current .viewer-card-shell')).toHaveAttribute('data-ready', 'true')
  await expect(card).toHaveCSS('touch-action', 'pan-x')
  await card.evaluate(el => el.addEventListener('pointercancel', () => sessionStorage.setItem('pointer-cancel', 'yes')))
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 305, y: 400 }] })
  for (let i = 1; i <= 12; i++) {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 305 - i * 21, y: 400 }] })
    await page.evaluate(() => new Promise(requestAnimationFrame))
  }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
  await expect(card).toHaveClass(/glossy/)
  expect(await page.evaluate(() => sessionStorage.getItem('pointer-cancel'))).toBe('yes')
  await cdp.detach()
})
