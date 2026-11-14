import { expect, test } from '@playwright/test'

test('les événements restent masqués par défaut et Anima Isekai affiche 220 cartes', async ({ page }) => {
  await page.goto('/boutique')
  await expect(page.getByRole('button', { name: 'Acheter Anima Isekai pour 50 fragments', exact: true })).toBeVisible()
  await expect(page.locator('.permanent-grid [data-booster="anima-isekai"]')).toHaveAttribute('aria-label', 'Booster Anima Isekai, 220 cartes')
  await expect(page.getByRole('button', { name: /Acheter (Hunger Games|Nouvel An)/ })).toHaveCount(0)
})

for (const [id, title, width] of [['hunger-games-2026', 'Hunger Games', 1440], ['new-year-2027', 'Nouvel An', 390]] as const) {
  test(`${title} : un bloc, une carte, reprise et collection permanente`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await page.setViewportSize({ width, height: 900 })
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/boutique')
    await expect(page.locator('.permanent-grid .shop-buy')).toHaveCount(4)
    await page.evaluate(async ({ id }) => {
      const path = '/src/storage/database.ts', settingsPath = '/src/settings/useSettings.ts'
      const { db } = await import(path), { updateSettings } = await import(settingsPath)
      await db.player.update('local', { fragments: 30 })
      updateSettings({ devEventAlwaysActive: true, selectedBoosterId: id })
    }, { id })
    await page.getByRole('button', { name: `Acheter ${title} pour 30 fragments`, exact: true }).click()
    await expect(page.getByRole('button', { name: `${title} ajouté`, exact: true })).toBeVisible()
    await page.getByRole('link', { name: 'Vos boosters', exact: true }).click()
    const pack = page.locator(`[data-booster="${id}"]`)
    await expect(pack).toHaveClass(/pack-bloc/)
    await expect(pack.locator('.pack-card-back')).toHaveCount(1)
    await page.emulateMedia({ reducedMotion: 'no-preference' })
    await page.getByRole('button', { name: `Ouvrir le booster ${title}`, exact: true }).click()
    await expect(pack).toHaveClass(/pack-tearing/)
    await expect(pack.locator('.pack-card-back')).toHaveCount(1)
    await page.getByRole('button', { name: 'Révéler la carte', exact: true }).click()
    await expect(page.locator('.reveal-progress')).toHaveAttribute('aria-label', '1 carte révélée sur 1')
    await page.reload()
    await expect(page.locator('.reveal-progress')).toHaveAttribute('aria-label', '1 carte révélée sur 1')
    await page.getByRole('button', { name: /Voir le récapitulatif$/ }).click()
    await expect(page.getByText('Dans votre collection.', { exact: true })).toBeVisible()
    await expect(page.locator('.event-opening .recap-grid .card')).toHaveCount(1)
    await expect(page.getByText('Carte temporaire', { exact: true })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `artifacts/event-${id}-recap.png`, fullPage: true })
    await page.getByRole('button', { name: 'Valider', exact: true }).click()
    await page.goto('/collection')
    await expect(page.locator('.collection-item .card')).toHaveCount(1)
    await page.reload()
    await expect(page.locator('.collection-item .card')).toHaveCount(1)
    const actual = await page.evaluate(async () => {
      const path = '/src/storage/database.ts', cardsPath = '/src/data/cards.ts'
      const { db } = await import(path), { cardById } = await import(cardsPath)
      const drops = await db.drops.toArray()
      return { player: await db.player.get('local'), drops: drops.length, eventId: cardById.get(drops[0].cardId).eventId, discoveries: await db.discoveries.count(), openings: await db.openings.count() }
    })
    expect(actual).toMatchObject({ player: { fragments: 0, freePackStock: 5 }, drops: 1, eventId: id, discoveries: 1, openings: 0 })
    expect(errors).toEqual([])
  })
}
