import { expect, test } from '@playwright/test'
import { expandSettings } from './settings-helpers'

test('Options : en-tête dédié, rubriques dépliantes et réglages conservés', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/parametres')
  await expect(page.locator('.brand')).toHaveText('optionTCG')
  await expect(page.getByTestId('player-id')).toHaveText(/^\d{4}-\d{2}-\d{2}$/)
  await expect(page.locator('.fragment-wallet, .settings-heading')).toHaveCount(0)
  await expect(page.locator('.settings-group[open]')).toHaveCount(0)
  await page.screenshot({ path: `artifacts/options-depliants-${test.info().project.name}.png` })
  await expandSettings(page, 'appearance')
  await page.getByRole('button', { name: 'Sombre', exact: true }).click()
  await expandSettings(page, 'collection')
  await expect(page.locator('.settings-group[open]')).toHaveCount(1)
  await page.getByRole('button', { name: '2 actions', exact: true }).click()
  await page.getByRole('button', { name: 'Carte', exact: true }).click()
  for (const width of [320, 390, 820, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  }
  await page.screenshot({ path: `artifacts/options-collection-${test.info().project.name}.png` })
  await page.reload(); await expandSettings(page, 'collection')
  await expect(page.getByRole('button', { name: '2 actions', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Carte', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.goto('/collection')
  await expect(page.locator('.brand')).toHaveText('bizaveTCG')
  await expect(page.locator('.fragment-wallet')).toBeVisible()
  await expect(page.getByTestId('player-id')).toHaveCount(0)
})

test('Halos diffus : thème clair/sombre/système et rareté dans l’aperçu', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' })
  await page.goto('/collection')
  await expect(page.getByRole('heading', { name: 'Collection', exact: true })).toBeVisible()
  await page.evaluate(async () => {
    const path = '/src/storage/database.ts'
    const { db } = await import(path)
    await db.drops.add({ dropId: 'radial-rare', cardId: 'eli-veilleuse', finish: 'normal', artVariant: 'standard', status: 'owned', acquiredAt: 1, updatedAt: 1 })
  })
  for (const [theme, expected] of [['light', 'rgb(243, 241, 235)'], ['dark', 'rgb(25, 26, 28)'], ['system', 'rgb(25, 26, 28)']]) {
    await page.evaluate(async theme => { const path = '/src/settings/useSettings.ts'; (await import(path)).updateSettings({ theme }) }, theme)
    await page.locator('.collection-grid .card').click()
    const backdrop = page.locator('.viewer-backdrop')
    await expect(backdrop).toHaveCSS('filter', 'none')
    await expect(backdrop).toHaveCSS('background-color', expected)
    const glow = await backdrop.evaluate(el => getComputedStyle(el, '::before').backgroundImage)
    expect(glow).toContain('rgb(135, 185, 240)'); expect(glow).not.toContain('url(')
    await page.getByRole('button', { name: 'Fermer', exact: true }).click()
  }
})

test('Ouverture : orbes holo/dorés visibles en sombre et fond selon la carte révélée', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/collection')
  await expect(page.getByRole('heading', { name: 'Collection', exact: true })).toBeVisible()
  await page.evaluate(async () => {
    const path = '/src/storage/database.ts', settings = '/src/settings/useSettings.ts'
    const { db } = await import(path)
    ;(await import(settings)).updateSettings({ theme: 'dark' })
    const results = ['normal', 'glossy', 'alternative', 'normal', 'normal'].map((finish, i) => ({ dropId: `orb-${i}`, cardId: i === 2 ? 'eli-veilleuse' : 't-classique', finish, artVariant: i === 2 ? 'fullArt' : 'standard' }))
    await db.openings.add({ id: 'orbs', boosterId: 'phantom-blood', openedAt: 1, payment: 'free', fragmentsSpent: 0, results, revealComplete: false, revealedCount: 3 })
  })
  await page.goto('/')
  const progress = page.locator('.reveal-progress')
  await expect(progress.locator('.is-revealed')).toHaveCount(3)
  await expect(progress.locator('.is-current')).toHaveCount(1)
  await expect(progress.locator('.f-glossy')).toHaveCSS('background-image', /conic-gradient/)
  await expect(progress.locator('.f-alternative')).toHaveCSS('background-image', /linear-gradient/)
  await expect(progress.locator('.a-fullArt')).toHaveCSS('border-radius', '1.5px')
  expect(await progress.locator('.f-normal').first().evaluate(el => getComputedStyle(el).backgroundColor)).not.toBe('rgb(65, 64, 69)')
  const background = page.locator('.opening-backdrop')
  await expect(background).toHaveAttribute('data-rarity', 'rare')
  await expect(background).toHaveCSS('background-color', 'rgb(25, 26, 28)')
  expect(await background.evaluate(el => getComputedStyle(el, '::before').backgroundImage)).toContain('rgb(135, 185, 240)')
  await page.screenshot({ path: `artifacts/orbes-radial-${test.info().project.name}.png` })
  await page.locator('.opening-card-area .card').click()
  await expect(background).toHaveAttribute('data-rarity', 'common')
  expect(await background.evaluate(el => getComputedStyle(el, '::before').backgroundImage)).toContain('rgb(161, 167, 178)')
})
