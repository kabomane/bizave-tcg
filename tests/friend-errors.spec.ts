import { expect, test, type Page } from '@playwright/test'

async function setup(page: Page) {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(() => {
    let value = '', mode = 'normal'
    Object.assign(window, {
      setContactClipboard: (text: string, nextMode = 'normal') => { value = text; mode = nextMode },
    })
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      readText: () => mode === 'pending' ? new Promise<string>(() => {}) : mode === 'denied' ? Promise.reject(new Error('Denied')) : Promise.resolve(value),
      writeText: async (text: string) => { value = text },
    } })
  })
  await page.goto('/echanges')
  await page.getByRole('button', { name: 'Ajouter un ami', exact: true }).click()
  return page.evaluate(async () => {
    const path = '/src/exchanges/crypto.ts', services = '/src/exchanges/services.ts'
    const { createContactCode, generateIdentity } = await import(path)
    return { valid: createContactCode(await generateIdentity()), self: await (await import(services)).ownContact() }
  })
}
async function clipboard(page: Page, text: string, mode = 'normal') {
  await page.evaluate(({ text, mode }) => (window as unknown as { setContactClipboard: (text: string, mode: string) => void }).setContactClipboard(text, mode), { text, mode })
}

test('ami : codes invalides successifs puis ajout valide sans fenêtre bloquée', async ({ page }) => {
  test.setTimeout(90_000)
  const codes = await setup(page)
  const dialog = page.getByRole('dialog', { name: 'Ajouter un ami' })
  const paste = dialog.getByRole('button', { name: 'Coller son code ami' })
  for (const value of ['', 'invalide', 'TR2.abc', 'FR2.***', 'FR2.eyJ2ZXJzaW9uIjoyfQ', codes.self]) {
    await clipboard(page, value)
    await paste.click()
    await expect(dialog.getByRole('alert')).toBeVisible()
    await expect(paste).toBeEnabled()
    await dialog.getByRole('textbox', { name: 'Nom de l’ami' }).fill('Ami corrigé')
    await expect(dialog.getByRole('textbox', { name: 'Nom de l’ami' })).toHaveValue('Ami corrigé')
  }
  await clipboard(page, codes.valid)
  await paste.click()
  await expect(dialog.getByRole('button', { name: 'Code ami collé !' })).toBeVisible()
  await dialog.getByRole('button', { name: 'Ajouter', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('.friend-row')).toHaveCount(1)
})

test('ami : presse-papiers refusé ou suspendu, fermeture et nouvelle tentative', async ({ page }) => {
  test.setTimeout(90_000)
  const codes = await setup(page)
  const dialog = page.getByRole('dialog', { name: 'Ajouter un ami' })
  await clipboard(page, '', 'denied')
  await dialog.getByRole('button', { name: 'Coller son code ami' }).click()
  await expect(dialog.getByRole('alert')).toBeVisible()
  await clipboard(page, '', 'pending')
  await dialog.getByRole('button', { name: 'Coller son code ami' }).click()
  await dialog.getByRole('button', { name: 'Fermer' }).click()
  await expect(dialog).toHaveCount(0)
  await page.getByRole('button', { name: 'Ajouter un ami', exact: true }).click()
  await dialog.getByRole('textbox', { name: 'Nom de l’ami' }).fill('Après erreur')
  await clipboard(page, codes.valid)
  await dialog.getByRole('button', { name: 'Coller son code ami' }).click()
  await dialog.getByRole('button', { name: 'Ajouter', exact: true }).click()
  await expect(dialog).toHaveCount(0)
  await expect(page.locator('.friend-row')).toHaveCount(1)
})

test('Safari mobile tactile : erreur puis correction, ajout et fermeture', async ({ browser, browserName, baseURL }) => {
  test.skip(browserName !== 'webkit', 'Simulation iPhone sur WebKit uniquement.')
  test.setTimeout(90_000)
  const context = await browser.newContext({ baseURL, viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true })
  try {
    const page = await context.newPage()
    const codes = await setup(page)
    const dialog = page.getByRole('dialog', { name: 'Ajouter un ami' })
    for (const value of ['FR2.***', codes.self, 'TR2.abc']) {
      await clipboard(page, value)
      await dialog.getByRole('button', { name: 'Coller son code ami' }).tap()
      await expect(dialog.getByRole('alert')).toBeVisible()
      await dialog.getByRole('textbox', { name: 'Nom de l’ami' }).tap()
      await dialog.getByRole('textbox', { name: 'Nom de l’ami' }).fill('Ami tactile')
    }
    await page.screenshot({ path: 'artifacts/ami-code-invalide-mobile.png' })
    await clipboard(page, codes.valid)
    await dialog.getByRole('button', { name: 'Coller son code ami' }).tap()
    await dialog.getByRole('button', { name: 'Ajouter', exact: true }).tap()
    await expect(dialog).toHaveCount(0)
    await expect(page.locator('.friend-row')).toHaveCount(1)
    await page.getByRole('button', { name: 'Ajouter un ami', exact: true }).tap()
    await clipboard(page, 'invalide')
    await dialog.getByRole('button', { name: 'Coller son code ami' }).tap()
    await expect(dialog.getByRole('alert')).toBeVisible()
    await dialog.getByRole('button', { name: 'Fermer' }).tap()
    await expect(dialog).toHaveCount(0)
  } finally { await context.close() }
})

