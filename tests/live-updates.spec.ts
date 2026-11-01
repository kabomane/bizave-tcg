import { expect, test, type Page } from '@playwright/test'

async function setup(page: Page) {
  const current = (await (await page.request.get('/version.json')).json()).buildId as string
  let remote = current, offline = false
  await page.route('**/version.json', route => offline ? route.abort() : route.fulfill({ json: { schema: 1, buildId: remote } }))
  const firstVersion = page.waitForResponse(response => response.url().endsWith('/version.json'))
  await page.goto('/collection')
  await expect(page.getByRole('heading', { name: 'Collection', exact: true })).toBeVisible()
  await (await firstVersion).finished()
  await page.clock.install()
  return { publish: () => { remote = 'new-build' }, offline: () => { offline = true }, current }
}
const notice = (page: Page) => page.getByRole('complementary', { name: 'Mise à jour disponible' })
async function online(page: Page) { await page.clock.fastForward(3000); await page.evaluate(() => window.dispatchEvent(new Event('online'))) }
async function restored(page: Page) { await page.evaluate(() => window.dispatchEvent(new PageTransitionEvent('pageshow', { persisted: true }))) }

test('signale un build, actualise sur demande et conserve les possessions', async ({ page }) => {
  const version = await setup(page)
  await page.evaluate(async () => { const path = '/src/storage/database.ts', { db } = await import(path); await db.player.update('local', { fragments: 123 }) })
  version.publish(); await online(page)
  await expect(notice(page)).toBeVisible()
  await expect(notice(page).getByRole('button', { name: 'Actualiser', exact: true })).toBeEnabled()
  await page.evaluate(() => { document.body.dataset.beforeReload = 'yes' })
  await notice(page).getByRole('button', { name: 'Actualiser', exact: true }).click()
  await expect(page.locator('body')).not.toHaveAttribute('data-before-reload')
  await expect(page.getByLabel('123 fragments', { exact: true })).toBeVisible()
})

test('restauration : recharge automatique une seule fois par build', async ({ page }) => {
  const version = await setup(page); version.publish()
  await restored(page)
  await expect.poll(() => page.evaluate(() => sessionStorage.getItem('bizave.last-auto-build'))).toBe('new-build')
  await expect(notice(page)).toBeVisible()
  await page.evaluate(() => { document.body.dataset.afterReload = 'yes' })
  await restored(page)
  await expect(notice(page).getByRole('button', { name: 'Actualiser', exact: true })).toBeEnabled()
  expect(await page.locator('body').getAttribute('data-after-reload')).toBe('yes')
})

test('une ouverture en cours interdit tout rechargement', async ({ page }) => {
  const version = await setup(page)
  await page.getByRole('link', { name: 'Boosters', exact: true }).first().click()
  await page.getByRole('button', { name: 'Ouvrir le booster Memory Frame', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Révéler la première carte', exact: true })).toBeVisible()
  version.publish(); await restored(page)
  await expect(notice(page)).toBeVisible()
  await expect(notice(page).getByRole('button', { name: 'Actualiser', exact: true })).toBeDisabled()
  expect(await page.evaluate(() => sessionStorage.getItem('bizave.last-auto-build'))).toBeNull()
  await expect(page.getByRole('button', { name: 'Révéler la première carte', exact: true })).toBeVisible()
})

test('hors ligne, une actualisation manuelle échouée conserve le jeu ouvert', async ({ page }) => {
  const version = await setup(page); version.publish(); await online(page)
  await expect(notice(page)).toBeVisible(); version.offline()
  await notice(page).getByRole('button', { name: 'Actualiser', exact: true }).click()
  await expect(notice(page).getByRole('alert')).toContainText('Connexion indisponible')
  await expect(page.getByRole('heading', { name: 'Collection', exact: true })).toBeVisible()
})

test('une saisie empêche la mise à jour automatique jusqu’au choix du joueur', async ({ page }) => {
  const version = await setup(page)
  await page.getByRole('searchbox').fill('Thomas')
  version.publish(); await restored(page)
  await expect(notice(page)).toBeVisible()
  await expect(notice(page).getByRole('button', { name: 'Actualiser', exact: true })).toBeDisabled()
  await expect(page.getByRole('searchbox')).toHaveValue('Thomas')
  await page.getByRole('searchbox').fill(''); await page.getByRole('heading', { name: 'Collection', exact: true }).click()
  await expect(notice(page).getByRole('button', { name: 'Actualiser', exact: true })).toBeEnabled()
})
