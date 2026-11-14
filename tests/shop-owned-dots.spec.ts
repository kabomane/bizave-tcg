import { expect, test } from '@playwright/test'

test('points boutique : possession exacte, mise à jour en direct et offre seule', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.clock.setFixedTime(new Date('2026-11-12T12:00:00Z'))
  await page.goto('/boutique')
  await expect(page.locator('.weekly-lucky .primary-button')).toBeVisible()
  await page.evaluate(async () => {
    const path = '/src/storage/database.ts', { db } = await import(path)
    const offers = [
      { id: 'one', cardId: 't-classique', finish: 'normal', artVariant: 'standard', price: 10, sold: false },
      { id: 'two', cardId: 't-voyageur', finish: 'glossy', artVariant: 'standard', price: 20, sold: false },
      { id: 'three', cardId: 't-etudiant', finish: 'normal', artVariant: 'standard', price: 30, sold: false },
    ]
    await db.dailyShop.update('current', { cards: [offers[0]] })
    await db.weeklyShop.update('current', { offers })
    await db.drops.bulkAdd([
      { dropId: 'owned-test', cardId: 't-classique', finish: 'normal', artVariant: 'standard', status: 'owned', acquiredAt: 1, updatedAt: 1 },
      { dropId: 'other-variant', cardId: 't-voyageur', finish: 'normal', artVariant: 'standard', status: 'owned', acquiredAt: 1, updatedAt: 1 },
      { dropId: 'outgoing-test', cardId: 't-etudiant', finish: 'normal', artVariant: 'standard', status: 'outgoing', acquiredAt: 1, updatedAt: 1 },
    ])
  })
  const daily = page.locator('#daily .card-zone'), weekly = page.locator('#weekly .card-zone')
  const dailyDots = daily.locator('.booster-carousel-dots > span'), weeklyDots = weekly.locator('.booster-carousel-dots > span')
  await expect(dailyDots).toHaveCount(1)
  await expect(dailyDots).toHaveAttribute('data-ownership', 'owned')
  await expect(daily.locator('.carousel-previous, .carousel-next')).toHaveCount(0)
  expect(await daily.locator('.booster-carousel-track').evaluate(element => element.scrollWidth - element.clientWidth)).toBeLessThanOrEqual(1)
  await expect(weeklyDots).toHaveCount(3)
  await expect(weeklyDots.nth(0)).toHaveAttribute('data-ownership', 'owned')
  await expect(weeklyDots.nth(1)).toHaveAttribute('data-ownership', 'missing')
  await expect(weeklyDots.nth(2)).toHaveAttribute('data-ownership', 'missing')
  const bounds = await weeklyDots.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().toJSON()))
  await page.evaluate(async () => { const path = '/src/storage/database.ts'; const { db } = await import(path); await db.drops.update('owned-test', { status: 'recycled' }) })
  await expect(dailyDots).toHaveAttribute('data-ownership', 'missing')
  await expect(weeklyDots.nth(0)).toHaveAttribute('data-ownership', 'missing')
  expect(await weeklyDots.nth(0).evaluate(element => getComputedStyle(element).backgroundImage)).toContain('linear-gradient')
  expect(await weeklyDots.evaluateAll(elements => elements.map(element => element.getBoundingClientRect().toJSON()))).toEqual(bounds)
  await page.evaluate(async () => { const path = '/src/storage/database.ts'; const { db } = await import(path); await db.drops.update('owned-test', { status: 'owned' }) })
  await expect(dailyDots).toHaveAttribute('data-ownership', 'owned')
  await expect(weeklyDots.nth(0)).toHaveAttribute('data-ownership', 'owned')
  await page.screenshot({ path: 'artifacts/shop-owned-dots.png', fullPage: true })
})
