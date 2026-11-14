import { expect, test } from '@playwright/test'

for (const kind of ['card', 'fragments'] as const) test(`envoi ${kind} : fichier téléchargé seulement au clic`, async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/echanges')
  await expect(page.getByRole('heading', { name: 'Amis', exact: true })).toBeVisible()
  const dropId = await page.evaluate(async () => {
    const databasePath = '/src/storage/database.ts', cryptoPath = '/src/exchanges/crypto.ts', servicesPath = '/src/exchanges/services.ts', settingsPath = '/src/settings/useSettings.ts'
    const { db } = await import(databasePath), { generateIdentity, createContactCode } = await import(cryptoPath), { addContact } = await import(servicesPath), { updateSettings } = await import(settingsPath)
    await addContact(createContactCode(await generateIdentity()), 'Nana')
    await db.player.update('local', { fragments: 50 })
    const dropId = crypto.randomUUID()
    await db.drops.add({ dropId, cardId: 't-classique', finish: 'normal', artVariant: 'standard', status: 'owned', acquiredAt: 1, updatedAt: 1 })
    updateSettings({ transferMode: 'file' })
    return dropId
  })
  let downloads = 0
  page.on('download', () => downloads++)
  if (kind === 'card') {
    await page.goto('/envoyer/' + dropId)
    await page.getByRole('button', { name: 'Donner à Nana', exact: true }).click()
  } else {
    await page.goto('/fragments')
    await page.getByRole('button', { name: 'Envoyer', exact: true }).click()
    await page.getByRole('button', { name: 'Choisir Nana', exact: true }).click()
    await page.getByRole('slider', { name: 'Montant à envoyer' }).press('End')
    await page.getByRole('button', { name: 'Envoyer 50 fragments', exact: true }).click()
  }
  const dialog = page.getByRole('dialog', { name: 'Transfert créé', exact: true })
  await expect(dialog.getByRole('heading', { name: 'Fichier de transfert prêt !', exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Fermer', exact: true })).toBeVisible()
  expect(downloads).toBe(0)
  const download = page.waitForEvent('download')
  await dialog.getByRole('button', { name: 'Télécharger', exact: true }).click()
  expect((await download).suggestedFilename()).toMatch(/\.btcg$/)
  expect(downloads).toBe(1)
  if (kind === 'card') {
    const link = dialog.getByRole('link', { name: 'Voir les transferts', exact: true })
    await expect(link.locator('svg')).toHaveCount(0)
    await page.screenshot({ path: 'artifacts/card-gift-confirmation-mobile.png' })
    await expect(link).toHaveAttribute('href', '/echanges')
    const bounds = await dialog.boundingBox()
    expect(bounds?.height).toBe(page.viewportSize()!.height)
    expect(bounds?.width).toBe(page.viewportSize()!.width)
    await dialog.getByRole('button', { name: 'Fermer', exact: true }).click()
    await expect(page).toHaveURL(/\/collection$/)
  } else {
    await dialog.getByRole('button', { name: 'Fermer', exact: true }).click()
    await expect(dialog).toHaveCount(0)
  }
})
