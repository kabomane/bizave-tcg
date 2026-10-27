import { expect, test, type Page } from '@playwright/test'

async function previewCatalogue(page: Page) {
  await page.goto('/parametres')
  await page.getByRole('switch', { name: 'Mode dev' }).click()
  await page.getByRole('link', { name: 'Collection', exact: true }).click()
  await expect(page.getByRole('searchbox', { name: 'Rechercher une carte' })).toBeVisible()
}

test('valeur par exemplaire, piles, préférences et panneau mobile', async ({ page }) => {
  await previewCatalogue(page)
  await page.getByRole('searchbox').fill('Thomas classique')
  await page.getByRole('button', { name: 'Affichage', exact: true }).click()
  const display = page.getByRole('dialog', { name: 'Affichage' })
  for (const name of ['Nom', 'Ordre', 'Date', 'Valeur']) await expect(display.getByRole('button', { name, exact: true })).toBeVisible()
  await display.getByRole('button', { name: 'Valeur', exact: true }).click()
  await display.getByRole('button', { name: 'Fermer' }).click()
  const values = page.locator('.collection-grid > .collection-item .card-fragment-value')
  await expect(values).toHaveText(['6', '4', '3', '2', '1', '1'])
  await page.getByRole('button', { name: 'Affichage', exact: true }).click()
  await display.getByRole('button', { name: 'Plus faible valeur' }).click()
  await display.getByRole('button', { name: 'Fermer' }).click()
  await expect(values).toHaveText(['1', '1', '2', '3', '4', '6'])
  await page.getByRole('button', { name: 'Affichage', exact: true }).click()
  await display.getByRole('button', { name: 'Par carte', exact: true }).click()
  await display.getByRole('button', { name: 'Fermer' }).click()
  await expect(values).toHaveText(['6'])
  const cover = page.locator('.collection-grid .card')
  await expect(cover).toHaveAttribute('data-art', 'fullArt')
  await expect(cover).toHaveClass(/alternative/)
  await cover.click()
  await expect(page.locator('.stack-grid .card-fragment-value')).toHaveText(['1', '1', '2', '3', '4', '6'])
  await page.getByRole('button', { name: 'Fermer' }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Affichage', exact: true }).click()
  await expect(display.getByRole('button', { name: 'Valeur', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(display.getByRole('button', { name: 'Par carte', exact: true })).toHaveAttribute('aria-pressed', 'true')
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 })
    await expect(display).toBeVisible()
    const box = await display.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(width)
    expect(await display.locator('.display-option').evaluateAll(elements => elements.every(el => el.scrollWidth <= el.clientWidth))).toBe(true)
    if (width === 390) await page.screenshot({ path: 'artifacts/collection-affichage-valeur-mobile.png' })
  }
})

test('filtre multi-booster avec cartes partagées et menus mobiles', async ({ page }) => {
  // The second edition exists only in this isolated browser response, never in production data.
  await page.route('**/src/data/boosters.ts*', async route => {
    const response = await route.fetch()
    const body = await response.text()
    await route.fulfill({ response, body: body + '\nboosters.push({ ...boosters[0], id: "test-edition", title: "Édition test", order: 1, sources: [{ type: "cards", cardIds: ["t-classique", "t-voyageur", "t-etudiant", "nana-diff", "t-risitas"] }] });\n' })
  })
  await previewCatalogue(page)
  await expect(page.locator('.collection-filters .filter-trigger')).toHaveCount(3)
  await page.getByRole('button', { name: 'Boosters', exact: true }).click()
  await page.getByRole('menuitemcheckbox', { name: 'Édition test', exact: true }).click()
  await page.getByRole('menu').getByRole('menuitemcheckbox').first().press('Escape')
  await expect(page.locator('.collection-grid > .collection-item')).toHaveCount(30)
  await page.getByRole('searchbox').fill('Thomas classique')
  await expect(page.locator('.collection-grid > .collection-item')).toHaveCount(6)
  await page.getByRole('searchbox').fill('')
  await page.getByRole('button', { name: /^Boosters/ }).click()
  await page.getByRole('menuitemcheckbox', { name: 'Phantom Blood', exact: true }).click()
  await page.getByRole('menu').getByRole('menuitemcheckbox').first().press('Escape')
  await expect(page.locator('.collection-grid > .collection-item')).toHaveCount(660)
  await page.getByRole('button', { name: /^Finitions/ }).click()
  await page.getByRole('menuitemcheckbox', { name: 'Full Art', exact: true }).click()
  await page.getByRole('menu').getByRole('menuitemcheckbox').first().press('Escape')
  await expect(page.locator('.collection-grid > .collection-item')).toHaveCount(330)
  for (const width of [320, 390]) {
    await page.setViewportSize({ width, height: 844 })
    for (const name of ['Boosters', 'Rareté', 'Finitions']) {
      await page.getByRole('button', { name: new RegExp('^' + name) }).click()
      const box = await page.getByRole('menu', { name, exact: true }).boundingBox()
      expect(box!.x).toBeGreaterThanOrEqual(0)
      expect(box!.x + box!.width).toBeLessThanOrEqual(width)
      if (width === 390 && name === 'Boosters') {
        await expect(page.getByRole('menu', { name, exact: true })).toHaveCSS('opacity', '1')
        await page.screenshot({ path: 'artifacts/collection-filtre-boosters-mobile.png' })
      }
      await page.getByRole('menu').getByRole('menuitemcheckbox').first().press('Escape')
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
})
