import { expect, test } from '@playwright/test'

test('swipe tactile natif depuis le booster, l’illustration et le texte des cartes', async ({ browser, browserName }) => {
  test.skip(browserName !== 'chromium', 'Le geste tactile natif est injecté via CDP.')
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true })
  const page = await context.newPage()
  try {
    await page.clock.setFixedTime(new Date('2026-11-06T12:00:00Z'))
    await page.goto('http://localhost:5173/boutique')
    const selection = page.locator('.weekly-selection'), buy = selection.locator('.shop-buy')
    await expect(buy).toBeVisible()
    await page.evaluate(async () => {
      const path = '/src/storage/database.ts', { db } = await import(path), cardsPath = '/src/data/cards.ts', { cards } = await import(cardsPath)
      const shop = await db.weeklyShop.get('current')
      shop.offers = cards.slice(0, 3).map((card: { id: string }, i: number) => ({ id: String(i), cardId: card.id, finish: 'normal', artVariant: 'standard', price: (i + 1) * 100, sold: false }))
      await db.player.update('local', { fragments: 1000 }); await db.weeklyShop.put(shop)
    })
    const client = await context.newCDPSession(page)
    async function swipe(selector: string, dx: number, dy = 0) {
      const target = selection.locator('.booster-carousel-slide[aria-hidden="false"]').locator(selector)
      await target.scrollIntoViewIfNeeded()
      const box = (await target.boundingBox())!
      const x = box.x + box.width * (dx < 0 ? .8 : .2), y = box.y + box.height * .5
      await client.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] })
      for (let i = 1; i <= 12; i++) {
        await client.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + dx * i / 12, y: y + dy * i / 12 }] })
        await page.waitForTimeout(16)
      }
      await client.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] })
    }
    await swipe('.booster-pack', -220)
    await expect(buy).toHaveText('Acheter 100')
    await expect(buy).toBeEnabled()
    await swipe('.custom-art', -220)
    await expect(buy).toHaveText('Acheter 200')
    await expect(buy).toBeEnabled()
    await swipe('.description', 220)
    await expect(buy).toHaveText('Acheter 100')
    await expect(buy).toBeEnabled()
    const before = await page.evaluate(() => scrollY)
    await swipe('.custom-art', 0, -130)
    await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(before)
    await expect(buy).toHaveText('Acheter 100')
    await expect(buy).toBeEnabled()
  } finally { await context.close() }
})