import { expect, test } from '@playwright/test'
import animaIds from '../src/data/pools/anima-isekai.json' with { type: 'json' }

test('boutique : aucun achat pendant le mouvement, puis achat du paquet affiché', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/boutique')
  await expect(page.getByRole('button', { name: 'Acheter Memory Frame pour 70 fragments', exact: true })).toBeVisible()
  await page.evaluate(async () => {
    const modulePath = '/src/storage/database.ts'
    const { db } = await import(modulePath)
    await db.player.update('local', { fragments: 200 })
  })
  const button = page.locator('.shop-buy'), carousel = page.locator('.booster-carousel-track')
  await expect(button).toBeEnabled()
  await page.setViewportSize({ width: 390, height: 600 })
  await button.evaluate(el => {
    el.setAttribute('data-vertical-locks', '0')
    const observer = new MutationObserver(() => {
      if (el.hasAttribute('disabled') || el.getAttribute('aria-busy') === 'true') el.setAttribute('data-vertical-locks', '1')
    })
    observer.observe(el, { attributes: true, attributeFilter: ['disabled', 'aria-busy'] })
    el.addEventListener('end-vertical-probe', () => observer.disconnect(), { once: true })
  })
  await carousel.hover()
  await page.mouse.wheel(0, 180)
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(0)
  await carousel.evaluate(el => {
    for (const [type, y] of [['touchstart', 100], ['touchmove', 180], ['touchend', 180]] as const) {
      const event = new Event(type, { bubbles: true })
      Object.defineProperty(event, 'touches', { value: type === 'touchend' ? [] : [{ clientX: 100, clientY: y }] })
      el.dispatchEvent(event)
    }
  })
  // Include React's paint so a transient disable cannot escape the observer.
  await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))))
  await expect(button).toHaveAttribute('data-vertical-locks', '0')
  await expect(button).toBeEnabled()
  await button.evaluate(el => el.dispatchEvent(new Event('end-vertical-probe')))
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }))
  await page.setViewportSize({ width: 390, height: 844 })
  // Dispatch both clicks in the same task, before React can paint the disabled button.
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('.carousel-next')!.click()
    document.querySelector<HTMLButtonElement>('.shop-buy')!.click()
  })
  await expect(button).toBeDisabled()
  await expect(button).toHaveAttribute('aria-busy', 'true')
  await expect(button.locator('.shop-switch-spinner')).toBeVisible()
  await expect(button.locator('.shop-switch-spinner')).toHaveCSS('animation-name', 'shopSwitchSpin')
  await expect(button).toHaveAccessibleName('Acheter Anima Isekai pour 50 fragments')
  await expect(button).toBeEnabled()
  await expect.poll(() => carousel.evaluate(el => Math.abs(el.scrollLeft - el.clientWidth))).toBeLessThanOrEqual(1)

  await carousel.evaluate(el => {
    for (const [type, x] of [['touchstart', 180], ['touchmove', 100]] as const) {
      const event = new Event(type, { bubbles: true })
      Object.defineProperty(event, 'touches', { value: [{ clientX: x, clientY: 100 }] })
      el.dispatchEvent(event)
    }
    el.scrollTo({ left: 0, behavior: 'smooth' })
    document.querySelector<HTMLButtonElement>('.shop-buy')!.click()
  })
  await expect.poll(() => carousel.evaluate(el => el.scrollLeft)).toBeLessThanOrEqual(1)
  await expect(button).toBeDisabled()
  await carousel.evaluate(el => el.dispatchEvent(new Event('touchend', { bubbles: true })))
  await expect(button).toHaveAccessibleName('Acheter Memory Frame pour 70 fragments')
  await expect(button).toBeEnabled()

  await carousel.press('End')
  await carousel.press('Home')
  await carousel.press('End')
  await expect(button).toBeDisabled()
  await expect(button).toHaveAccessibleName('Acheter Anima Isekai pour 50 fragments')
  await expect(button).toBeEnabled()
  const before = await page.evaluate(async () => {
    const modulePath = '/src/storage/database.ts'
    const { db } = await import(modulePath)
    return { purchases: await db.boosterPurchases.count(), player: await db.player.get('local') }
  })
  expect(before.purchases).toBe(0)
  expect(before.player.fragments).toBe(200)
  await button.click()
  await expect(button).toHaveAccessibleName('Anima Isekai ajouté')
  const after = await page.evaluate(async () => {
    const modulePath = '/src/storage/database.ts'
    const { db } = await import(modulePath)
    return { purchases: await db.boosterPurchases.toArray(), stock: await db.boosterStock.toArray(), player: await db.player.get('local') }
  })
  expect(after.purchases).toHaveLength(1)
  expect(after.purchases[0]).toMatchObject({ boosterId: 'anima-isekai', fragmentsSpent: 50 })
  expect(after.stock).toHaveLength(1)
  expect(after.stock[0]).toMatchObject({ boosterId: 'anima-isekai', quantity: 1 })
  expect(after.player.fragments).toBe(150)
})

test('Anima Isekai : boutique à 50 fragments, réserve et ouverture exclusive', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Ouvrir le booster Memory Frame', exact: true })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Ouvrir le booster Anima Isekai', exact: true })).toHaveCount(0)
  const packSizes = new Map<number, { width: number; height: number }>()
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    const box = await page.locator('.booster-pack').boundingBox()
    packSizes.set(width, { width: box!.width, height: box!.height })
  }
  await page.getByRole('link', { name: 'Boutique', exact: true }).click()
  const buy = page.getByRole('button', { name: 'Acheter Anima Isekai pour 50 fragments', exact: true })
  await expect(page.getByRole('button', { name: 'Acheter Memory Frame pour 70 fragments', exact: true })).toBeDisabled()
  await expect(buy).toHaveCount(0)
  await page.evaluate(async () => {
    const modulePath = '/src/storage/database.ts'
    const { db } = await import(modulePath)
    await db.player.update('local', { fragments: 50 })
  })
  await expect(page.getByRole('button', { name: 'Acheter Memory Frame pour 70 fragments', exact: true })).toBeDisabled()
  const carousel = page.locator('.booster-carousel-track')
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const before = await page.locator('.shop-buy').boundingBox()
    const pack = await page.locator('.booster-carousel-slide[aria-hidden="false"] .booster-pack').boundingBox()
    expect(pack!.width).toBeCloseTo(packSizes.get(width)!.width, 0)
    expect(pack!.height).toBeCloseTo(packSizes.get(width)!.height, 0)
    expect(pack!.x + pack!.width / 2).toBeCloseTo(before!.x + before!.width / 2, 0)
    await page.getByRole('button', { name: 'Booster suivant', exact: true }).click()
    await expect(buy).toBeEnabled()
    const after = await page.locator('.shop-buy').boundingBox()
    for (const key of ['x', 'y', 'width', 'height'] as const) expect(after![key]).toBeCloseTo(before![key], 0)
    await carousel.press('Home')
    await expect(page.getByRole('button', { name: 'Acheter Memory Frame pour 70 fragments', exact: true })).toBeDisabled()
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await carousel.evaluate(el => el.scrollTo({ left: el.clientWidth, behavior: 'instant' }))
  await expect(buy).toBeEnabled()
  await page.screenshot({ path: 'artifacts/boosters-boutique-mobile.png', fullPage: true })
  await buy.click()
  await expect(page.getByRole('button', { name: 'Anima Isekai ajouté', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Vos boosters', exact: true }).click()
  await page.getByRole('button', { name: 'Booster suivant', exact: true }).click()
  await page.getByRole('button', { name: 'Ouvrir le booster Anima Isekai', exact: true }).click()
  await page.getByRole('button', { name: 'Révéler la première carte', exact: true }).click()
  await expect(page.locator('.opening-counter')).toHaveText('01 / 05')
  for (let i = 1; i < 5; i++) {
    await page.locator('.opening-card-area .card').click()
    await expect(page.locator('.opening-counter')).toHaveText(`${String(i + 1).padStart(2, '0')} / 05`)
  }
  await page.locator('.opening-card-area .card').click()
  await expect(page.locator('.recap-grid .card')).toHaveCount(5)
  const state = await page.evaluate(async () => {
    const modulePath = '/src/storage/database.ts'
    const { db } = await import(modulePath)
    return { player: await db.player.get('local'), stock: await db.boosterStock.get('anima-isekai'), drops: await db.drops.toArray() }
  })
  expect(state.player).toMatchObject({ fragments: 0, freePackStock: 5, nextFreePackAt: null })
  expect(state.stock.quantity).toBe(0)
  expect(state.drops).toHaveLength(5)
  expect(state.drops.every((drop: { cardId: string }) => animaIds.includes(drop.cardId))).toBe(true)
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Ouvrir le booster Anima Isekai', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Ouvrir le booster Memory Frame', exact: true })).toBeEnabled()
})
