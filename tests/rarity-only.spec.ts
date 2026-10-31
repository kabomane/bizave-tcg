import { expect, test } from '@playwright/test'

test('rarity only : boutique à 400, taux rares garantis et ouverture sans crédit gratuit', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Ouvrir le booster rarity only', exact: true })).toHaveCount(0)
  await page.goto('/boutique')
  await page.locator('.booster-carousel-track').press('Home')
  await page.locator('.booster-carousel-track').press('ArrowRight')
  await page.locator('.booster-carousel-track').press('ArrowRight')
  const buy = page.getByRole('button', { name: 'Acheter rarity only pour 400 fragments', exact: true })
  await expect(buy).toBeDisabled()
  await page.getByRole('button', { name: 'taux de drop', exact: true }).click()
  const rates = page.getByRole('dialog', { name: 'Taux de drop', exact: true })
  await expect(rates.locator('section').filter({ has: page.getByRole('heading', { name: 'Rareté', exact: true }) }).locator('dd')).toHaveText(['0 %', '0 %', '100 %', '0 %', '0 %'])
  await rates.getByRole('button', { name: 'Fermer', exact: true }).click()
  const freeStock = await page.evaluate(async () => {
    const path = '/src/storage/database.ts', { db } = await import(path)
    await db.player.update('local', { fragments: 400 })
    return (await db.player.get('local')).freePackStock
  })
  await expect(buy).toBeEnabled()
  await page.screenshot({ path: 'artifacts/rarity-only-shop.png', fullPage: true })
  await buy.click()
  await expect(page.getByRole('button', { name: 'rarity only ajouté', exact: true })).toBeVisible()
  await page.getByRole('link', { name: 'Vos boosters', exact: true }).click()
  await expect(page.locator('.booster-carousel-slide')).toHaveCount(3)
  await page.locator('.booster-carousel-track').press('End')
  await page.getByRole('button', { name: 'Ouvrir le booster rarity only', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Révéler la première carte', exact: true })).toBeVisible()
  const state = await page.evaluate(async () => {
    const dbPath = '/src/storage/database.ts', cardsPath = '/src/data/cards.ts'
    const { db } = await import(dbPath), { cardById } = await import(cardsPath)
    const [opening] = await db.openings.toArray()
    return { fragments: (await db.player.get('local')).fragments, freeStock: (await db.player.get('local')).freePackStock, stock: (await db.boosterStock.get('rarity-only')).quantity, payment: opening.payment, rarities: opening.results.map((card: { cardId: string }) => cardById.get(card.cardId).rarity) }
  })
  expect(state).toEqual({ fragments: 0, freeStock, stock: 0, payment: 'shop', rarities: ['rare', 'rare', 'rare', 'rare', 'rare'] })
})
