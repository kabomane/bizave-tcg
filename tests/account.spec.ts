import { expect, test, type Page } from '@playwright/test'
import { readFile } from 'node:fs/promises'

const accountId = (page: Page) => page.getByTestId('player-id')
async function seedCollection(page: Page) {
  await page.evaluate(async () => {
    const modulePath = '/src/storage/services.ts'
    const { openBooster, finishOpening } = await import(modulePath)
    const opening = await openBooster('phantom-blood')
    await finishOpening(opening.id)
  })
}

test('transfert par fichier, source verrouillée après rechargement, identité source conservée et import unique', async ({ page, context, browser }) => {
  const recipientContext = await browser.newContext(), target = await recipientContext.newPage()
  const otherSourceTab = await context.newPage()
  try {
    await page.goto('/parametres'); await target.goto('/parametres'); await otherSourceTab.goto('/parametres')
    await expect(accountId(page)).toHaveText(/^\d{4}-\d{2}-\d{2}$/)
    await expect(accountId(target)).toHaveText(/^\d{4}-\d{2}-\d{2}$/)
    const sourceId = await accountId(page).innerText()
    await target.getByRole('button', { name: 'Transfert de sauvegarde', exact: true }).click()
    const targetId = await target.getByTestId('installation-id').innerText()
    await target.getByRole('button', { name: 'Fermer', exact: true }).click()
    await seedCollection(page)
    await page.getByRole('button', { name: 'Transfert de sauvegarde', exact: true }).click()
    await page.getByRole('button', { name: 'Exporter', exact: true }).click()
    await page.getByLabel('ID de l’appareil destinataire').fill(targetId)
    await expect(page.getByRole('button', { name: 'Transférer et effacer cet appareil' })).toBeDisabled()
    for (const confirmation of ['transferer', 'TRANSFERER', 'TrAnSfErEr']) {
      await page.getByLabel('Pour confirmer, saisissez TRANSFERER').fill(confirmation)
      await expect(page.getByRole('button', { name: 'Transférer et effacer cet appareil' })).toBeEnabled()
    }
    await page.getByRole('button', { name: 'Transférer et effacer cet appareil' }).click()
    await expect(page.getByRole('heading', { name: 'Votre sauvegarde est prête.' })).toBeVisible()
    await expect(otherSourceTab.getByRole('heading', { name: 'Votre sauvegarde est prête.' })).toBeVisible()
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Votre sauvegarde est prête.' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Collection', exact: true })).toHaveCount(0)
    const downloadEvent = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Télécharger la sauvegarde' }).click()
    const download = await downloadEvent
    expect(download.suggestedFilename()).toMatch(/^bizave-sauvegarde-.*\.btcg$/)
    const bytes = await readFile((await download.path())!)
    await page.screenshot({ path: `artifacts/save-download-${test.info().project.name}.png`, fullPage: true })
    const file = { name: download.suggestedFilename(), mimeType: 'application/octet-stream', buffer: bytes }
    await target.getByRole('button', { name: 'Transfert de sauvegarde', exact: true }).click()
    await target.getByLabel('Fichier de sauvegarde .btcg', { exact: true }).setInputFiles(file)
    await expect(target.getByRole('dialog')).toContainText(sourceId)
    for (const confirmation of ['importer', 'IMPORTER', 'ImPoRtEr']) {
      await target.getByLabel('Pour confirmer le remplacement, saisissez IMPORTER').fill(confirmation)
      await expect(target.getByRole('button', { name: 'Importer et remplacer la partie' })).toBeEnabled()
    }
    await target.getByRole('button', { name: 'Importer et remplacer la partie' }).click()
    await expect(target.getByRole('heading', { name: 'Options', exact: true })).toBeVisible()
    await expect(target.getByRole('dialog')).toHaveCount(0)
    await expect(accountId(target)).toHaveText(sourceId)
    const state = await target.evaluate(async () => {
      const modulePath = '/src/storage/database.ts'
      const { db } = await import(modulePath)
      return { drops: await db.drops.count(), imports: await db.usedSaveTransfers.count(), stock: (await db.player.get('local')).freePackStock }
    })
    expect(state).toEqual({ drops: 5, imports: 1, stock: 4 })
    await target.getByRole('button', { name: 'Transfert de sauvegarde', exact: true }).click()
    await expect(target.getByTestId('installation-id')).toHaveText(targetId)
    await target.getByLabel('Fichier de sauvegarde .btcg', { exact: true }).setInputFiles(file)
    await target.getByLabel('Pour confirmer le remplacement, saisissez IMPORTER').fill('importer')
    await target.getByRole('button', { name: 'Importer et remplacer la partie' }).click()
    await expect(target.getByRole('alert')).toHaveText('Cette sauvegarde a déjà été importée.')
    await page.goto('/collection')
    await expect(page.getByRole('heading', { name: 'Votre sauvegarde est prête.' })).toBeVisible()
  } finally { await recipientContext.close() }
})

test('supprimer le compte exige confirmation et renouvelle toute la partie ainsi que les options', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/parametres')
  await expect(accountId(page)).toHaveText(/^\d{4}-\d{2}-\d{2}$/)
  const before = await accountId(page).innerText()
  await page.getByRole('button', { name: 'Sombre', exact: true }).click()
  await seedCollection(page)
  await page.getByRole('button', { name: 'Supprimer le compte', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Supprimer', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Annuler', exact: true }).click()
  await expect(accountId(page)).toHaveText(before)
  await page.getByRole('button', { name: 'Supprimer le compte', exact: true }).click()
  for (const confirmation of ['supprimer', 'SUPPRIMER', 'sUpPrImEr']) {
    await page.getByLabel('Pour confirmer, saisissez SUPPRIMER').fill(confirmation)
    await expect(page.getByRole('button', { name: 'Supprimer', exact: true })).toBeEnabled()
  }
  await page.getByRole('button', { name: 'Supprimer', exact: true }).click()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(accountId(page)).toHaveText(/^\d{4}-\d{2}-\d{2}$/)
  await expect(accountId(page)).not.toHaveText(before)
  await expect(page.getByRole('button', { name: 'Système', exact: true })).toHaveAttribute('aria-pressed', 'true')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await page.screenshot({ path: `artifacts/account-settings-mobile-${test.info().project.name}.png`, fullPage: true })
  await page.goto('/collection')
  await expect(page.getByRole('heading', { name: 'La première vous attend.' })).toBeVisible()
  await page.goto('/')
  await expect(page.getByLabel('5 boosters disponibles sur 5')).toBeVisible()
})
