import { expect, test, type Page } from '@playwright/test'
import { UPDATE_VERSION } from '../src/data/update'
import { expandSettings } from './settings-helpers'

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(version => {
    localStorage.setItem('updated', String(version))
    let clipboard = ''
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { readText: async () => clipboard, writeText: async (value: string) => { clipboard = value } } })
  }, UPDATE_VERSION)
})

async function seed(page: Page) {
  await page.goto('/echanges')
  await expect(page.getByRole('heading', { name: 'Amis', exact: true })).toBeVisible()
  return page.evaluate(async () => {
    const dbPath = '/src/storage/database.ts', servicesPath = '/src/exchanges/services.ts', cryptoPath = '/src/exchanges/crypto.ts'
    const { db } = await import(dbPath), services = await import(servicesPath), protocol = await import(cryptoPath)
    const sender = await protocol.generateIdentity(), recipient = await services.ensureIdentity()
    await services.addContact(protocol.createContactCode(sender), 'Dorian')
    await db.player.update('local', { fragments: 690 })
    return (await protocol.signFragmentTransfer(sender, await protocol.parseContactCode(protocol.createContactCode(recipient)), 40)).code
  })
}

async function closeSide(page: Page, side: 'left' | 'right') {
  const close = (await page.getByRole('dialog').getByRole('button', { name: 'Fermer', exact: true }).boundingBox())!
  expect(side === 'right' ? close.x > page.viewportSize()!.width / 2 : close.x < page.viewportSize()!.width / 2).toBe(true)
}

for (const route of ['/fragments', '/echanges']) test(`fragments reçus : rendu, solde et navigation depuis ${route}`, async ({ page }) => {
  const code = await seed(page)
  if (route === '/echanges') {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.evaluate(async () => { const path = '/src/settings/useSettings.ts'; (await import(path)).updateSettings({ handedness: 'left' }) })
  }
  await page.goto(route)
  await page.getByRole('button', { name: 'Recevoir', exact: true }).click()
  if (route === '/fragments') {
    await page.evaluate(value => navigator.clipboard.writeText(value), code)
    await page.getByRole('button', { name: 'Coller le code' }).click()
  } else {
    await page.getByLabel('Fichier de transfert .btcg').setInputFiles({ name: 'fragments.btcg', mimeType: 'application/octet-stream', buffer: Buffer.from(JSON.stringify({ format: 'bizave-tcg-transfer', version: 2, code })) })
  }
  await page.getByRole('dialog').getByRole('button', { name: 'Recevoir', exact: true }).click()
  const viewer = page.getByRole('dialog', { name: 'Fragments reçus', exact: true })
  await expect(viewer).toBeVisible()
  await expect(viewer.getByRole('status')).toHaveText('40 fragments reçus de Dorian. Nouveau solde : 730 fragments.')
  await expect(viewer.locator('.received-fragment-amount')).toHaveText('+40')
  await expect(viewer.locator('.received-fragment-balance b')).toHaveText('730')
  await closeSide(page, route === '/fragments' ? 'right' : 'left')
  await expect(viewer.getByRole('button')).toHaveCount(3)
  for (const [width, height, theme] of [[390, 844, 'dark'], [820, 1180, 'light'], [1440, 900, 'dark']] as const) {
    await page.setViewportSize({ width, height })
    await page.evaluate(async theme => { const path = '/src/settings/useSettings.ts'; (await import(path)).updateSettings({ theme }) }, theme)
    await expect(viewer.getByRole('button', { name: 'Boutique', exact: true })).toHaveCSS('color', theme === 'dark' ? 'rgb(239, 237, 230)' : 'rgb(36, 37, 35)')
    const card = (await viewer.locator('.received-fragment-card').boundingBox())!
    const dock = (await viewer.locator('.viewer-dock').boundingBox())!
    expect(card.x).toBeGreaterThanOrEqual(0)
    expect(card.x + card.width).toBeLessThanOrEqual(width)
    expect(card.y + card.height).toBeLessThan(dock.y)
    await page.screenshot({ path: `artifacts/fragments-recus-${route.slice(1)}-${width}-${test.info().project.name}.png` })
  }
  await viewer.getByRole('button', { name: route === '/fragments' ? 'Terminé' : 'Mes fragments', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveURL(/\/fragments$/)
  await expect(page.locator('.fragment-balance strong')).toHaveText('730')
  await page.getByRole('button', { name: 'Recevoir', exact: true }).click()
  await page.evaluate(value => navigator.clipboard.writeText(value), code)
  await page.getByRole('button', { name: 'Coller le code' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Recevoir', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('Ce code a déjà été utilisé.')
  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('droitier/gaucher : persistance, fenêtres et actions de la visionneuse', async ({ page }) => {
  await seed(page)
  await page.goto('/parametres')
  await expandSettings(page, 'appearance')
  await expect(page.getByRole('button', { name: 'Droitier', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Gaucher', exact: true }).click()
  await page.reload()
  await expandSettings(page, 'appearance')
  await expect(page.getByRole('button', { name: 'Gaucher', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.goto('/fragments')
  await page.getByRole('button', { name: 'Recevoir', exact: true }).click()
  await closeSide(page, 'left')
  await page.keyboard.press('Escape')
  await page.evaluate(async () => {
    const dbPath = '/src/storage/database.ts'
    const { db } = await import(dbPath)
    await db.drops.add({ dropId: crypto.randomUUID(), cardId: 't-classique', finish: 'normal', artVariant: 'standard', status: 'owned', acquiredAt: 1, updatedAt: 1 })
  })
  for (const handedness of ['left', 'right'] as const) for (const actionBar of ['two', 'four'] as const) {
    await page.evaluate(async settings => { const path = '/src/settings/useSettings.ts'; (await import(path)).updateSettings(settings) }, { handedness, actionBar })
    await page.goto('/collection')
    await page.locator('.collection-grid .card').click()
    await closeSide(page, handedness)
    const actions = page.locator('.viewer-top-actions')
    await expect(actions).toHaveCount(actionBar === 'two' ? 1 : 0)
    if (actionBar === 'two') {
      const box = (await actions.boundingBox())!
      expect(handedness === 'right' ? box.x < 195 : box.x > 195).toBe(true)
    }
    await page.keyboard.press('Escape')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  }
})
