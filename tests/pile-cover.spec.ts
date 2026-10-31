import { expect, test } from '@playwright/test'

test('la couverture des piles se choisit et reste mémorisée après rechargement', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/collection')
  await expect(page.getByRole('heading', { name: 'Collection', exact: true })).toBeVisible()
  await page.evaluate(async () => {
    const path = '/src/storage/database.ts', { db } = await import(path)
    await db.drops.bulkAdd(['normal', 'glossy', 'alternative'].map((finish, index) => ({
      dropId: crypto.randomUUID(), cardId: 't-classique', finish, artVariant: 'standard',
      status: 'owned', acquiredAt: index === 1 ? 50 : index + 1, updatedAt: index === 1 ? 50 : index + 1,
    })))
  })
  await page.getByRole('button', { name: 'Affichage', exact: true }).click()
  await page.getByRole('button', { name: 'Par carte', exact: true }).click()
  await expect(page.getByRole('group', { name: 'Carte affichée sur les piles', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Fermer', exact: true }).click()
  await page.goto('/parametres')
  const covers = page.getByRole('combobox', { name: 'Carte sur les piles', exact: true })
  const card = page.locator('.collection-pile .card')
  for (const [label, finish] of [['Dernière obtenue', 'glossy'], ['Plus rare', 'alternative'], ['Moins rare', 'standard']] as const) {
    await covers.click()
    await page.getByRole('option', { name: label, exact: true }).click()
    await page.goto('/collection')
    await expect(card).toHaveClass(new RegExp(`\\b${finish}\\b`))
    await page.reload()
    await expect(card).toHaveClass(new RegExp(`\\b${finish}\\b`))
    await page.goto('/parametres')
    await expect(covers).toHaveText(label)
  }
  await page.screenshot({ path: `artifacts/pile-cover-${test.info().project.name}.png`, fullPage: true })
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('les options compactes conservent le thème et le format d’envoi', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/parametres')
  await page.getByRole('button', { name: 'Sombre', exact: true }).click()
  await page.getByRole('button', { name: 'Fichier', exact: true }).click()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Sombre', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Fichier', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Système', exact: true }).click()
  const cover = page.getByRole('combobox', { name: 'Carte sur les piles', exact: true })
  await cover.focus()
  await page.keyboard.press('ArrowDown')
  await page.keyboard.press('End')
  await page.keyboard.press('Enter')
  await expect(cover).toHaveText('Moins rare')
  await expect(cover).toBeFocused()
  await cover.click()
  await page.keyboard.press('Escape')
  await expect(cover).toHaveAttribute('aria-expanded', 'false')
  await cover.click()
  await page.getByRole('heading', { name: 'Options', exact: true }).click()
  await expect(cover).toHaveAttribute('aria-expanded', 'false')
  await expect(page.getByTestId('player-id')).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Code cadeau', exact: true })).toBeVisible()
  for (const width of [360, 390, 900]) {
    await page.setViewportSize({ width, height: 1000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    await page.screenshot({ path: `artifacts/options-compact-${width}-${test.info().project.name}.png`, fullPage: true })
  }
})
