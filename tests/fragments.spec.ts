import { expect, test, type Page } from '@playwright/test'
import { UPDATE_VERSION } from '../src/data/update'
import { readFile } from 'node:fs/promises'
import { parseTransferFile } from '../src/exchanges/transferFile'

test.beforeEach(async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.addInitScript(version => {
    localStorage.setItem('updated', String(version))
    let clipboard = ''
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: async (text: string) => { clipboard = text }, readText: async () => clipboard }, configurable: true })
  }, UPDATE_VERSION)
})

async function seed(page: Page) {
  await page.goto('/echanges')
  await expect(page.getByRole('heading', { name: 'Amis', exact: true })).toBeVisible()
  return page.evaluate(async () => {
    const dbPath = '/src/storage/database.ts', servicePath = '/src/exchanges/services.ts', cryptoPath = '/src/exchanges/crypto.ts'
    const { db } = await import(dbPath), services = await import(servicePath), protocol = await import(cryptoPath)
    const external = await protocol.generateIdentity(), identity = await services.ensureIdentity()
    await services.addContact(protocol.createContactCode(external), 'Nana')
    const recipient = await protocol.parseContactCode(protocol.createContactCode(identity))
    await db.player.update('local', { fragments: 997 })
    return {
      fragments: (await protocol.signFragmentTransfer(external, recipient, 137)).code,
      card: (await protocol.signTransfer(external, recipient, { dropId: crypto.randomUUID(), cardId: 't-classique', finish: 'normal', artVariant: 'standard' })).code,
    }
  })
}

test('Amis vide : un seul bouton ; Fragments reste accessible et explique la réception', async ({ page }) => {
  await page.goto('/echanges')
  await expect(page.getByRole('heading', { name: 'Votre cercle commence ici.' })).toBeVisible()
  await expect(page.locator('main button')).toHaveCount(1)
  await expect(page.getByRole('tab')).toHaveCount(0)
  await page.locator('.fragment-wallet').click()
  await expect(page).toHaveURL(/\/fragments$/)
  await expect(page.getByRole('button', { name: 'Envoyer', exact: true })).toBeDisabled()
  await expect(page.locator('.desktop-nav [aria-current], .mobile-nav [aria-current]')).toHaveCount(0)
  await page.getByRole('button', { name: 'Recevoir', exact: true }).click()
  await expect(page.getByRole('dialog')).toContainText('Ajoutez d’abord le contact de l’expéditeur.')
})

test('envoi : sélecteur partagé, curseur précis, clavier, maintien annulé puis confirmé et copie locale', async ({ page }) => {
  await seed(page)
  await page.locator('.fragment-wallet').click()
  await page.getByRole('button', { name: 'Envoyer', exact: true }).click()
  await page.getByRole('searchbox', { name: 'Rechercher un ami' }).fill('nàna')
  await page.getByRole('button', { name: 'Choisir Nana' }).click()
  const slider = page.getByRole('slider', { name: 'Montant à envoyer' })
  await slider.press('End')
  await expect(slider).toHaveAttribute('aria-valuenow', '997')
  await expect(page.getByRole('button', { name: 'Augmenter le montant' })).toBeDisabled()
  await slider.press('Home')
  await expect(page.getByRole('button', { name: 'Diminuer le montant' })).toBeDisabled()
  await slider.press('1'); await slider.press('2'); await slider.press('0')
  await expect(slider).toHaveAttribute('aria-valuenow', '120')
  await slider.press('Backspace'); await slider.press('Shift+ArrowRight')
  await page.getByRole('button', { name: 'Augmenter le montant' }).click()
  await expect(slider).toHaveAttribute('aria-valuenow', '23')
  await page.getByRole('button', { name: 'Diminuer le montant' }).click()
  await expect(slider).toHaveAttribute('aria-valuenow', '22')
  const bounds = (await slider.boundingBox())!
  await slider.click({ position: { x: bounds.width / 2, y: bounds.height / 2 } })
  await expect(slider).toHaveAttribute('aria-valuenow', '249')
  const hold = page.getByRole('button', { name: 'Maintenir pour envoyer 249' })
  await hold.hover(); await page.mouse.down(); await page.waitForTimeout(150); await page.mouse.up()
  await expect(page.locator('.fragment-wallet')).toContainText('997')
  await expect(slider).toBeVisible()
  await hold.hover(); await page.mouse.down(); await page.waitForTimeout(1000); await page.mouse.up()
  await expect(page.getByRole('heading', { name: 'Code de transfert copié !' })).toBeVisible()
  const code = await page.evaluate(() => navigator.clipboard.readText())
  expect(code).toMatch(/^TF1\./)
  await expect(page.locator('.fragment-wallet')).toContainText('748')
  await page.getByRole('dialog').getByRole('button', { name: 'Copier', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Code copié !', exact: true })).toHaveClass(/is-confirmed/)
  await expect(page.locator('.toast')).toHaveCount(0)
  await expect(page.getByRole('dialog').getByRole('button', { name: 'Copier', exact: true })).toBeVisible({ timeout: 5000 })
  await page.getByRole('button', { name: 'Terminé' }).click()
  await page.getByRole('button', { name: 'Codes envoyés · 1' }).click()
  await expect(page.getByRole('dialog').locator('.transfer-row')).toHaveCount(1)
  await expect(page.getByRole('dialog')).toContainText('249 fragments')
  await page.getByRole('dialog').getByRole('button', { name: 'Copier', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Code copié !', exact: true })).toBeVisible()
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(code)
  await expect(page.locator('.toast')).toHaveCount(0)
})

test('réglage accéléré, envoi clavier par fichier et codes accessibles après retrait du dernier ami', async ({ page }) => {
  await seed(page)
  await page.evaluate(() => localStorage.setItem('bizave.preferences.v1', JSON.stringify({ transferMode: 'file' })))
  await page.goto('/fragments')
  for (const key of ['Enter', 'Space']) {
    await page.getByRole('button', { name: 'Envoyer', exact: true }).click()
    await page.getByRole('button', { name: 'Choisir Nana' }).click()
    const slider = page.getByRole('slider')
    if (key === 'Enter') {
      const plus = page.getByRole('button', { name: 'Augmenter le montant' })
      await plus.hover(); await page.mouse.down(); await page.waitForTimeout(3300); await page.mouse.up()
      const amount = Number(await slider.getAttribute('aria-valuenow'))
      expect(amount).toBeGreaterThan(50)
      await page.waitForTimeout(200)
      await expect(slider).toHaveAttribute('aria-valuenow', String(amount))
    }
    await slider.press('Home'); await slider.press('1')
    const pending = page.waitForEvent('download')
    await page.getByRole('button', { name: 'Maintenir pour envoyer 1', exact: true }).press(key)
    const download = await pending
    expect(parseTransferFile(await readFile((await download.path())!, 'utf8'))).toMatch(/^TF1\./)
    await expect(page.getByRole('heading', { name: 'Fichier de transfert prêt !' })).toBeVisible()
    await page.getByRole('button', { name: 'Terminé' }).click()
  }
  await expect(page.locator('.fragment-wallet')).toContainText('995')
  await page.goto('/echanges')
  await page.getByRole('button', { name: 'Voir la fiche de Nana' }).click()
  await page.getByRole('button', { name: 'Retirer de vos amis' }).click()
  await page.getByRole('button', { name: 'Retirer Nana', exact: true }).click()
  await expect(page.locator('.friend-row')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Recevoir', exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Ajouter un ami', exact: true })).toHaveCount(1)
  await expect(page.locator('.transfer-row')).toHaveCount(2)
  const pending = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Télécharger', exact: true }).first().click()
  await pending
  await expect(page.getByRole('button', { name: 'Fichier prêt !', exact: true })).toHaveClass(/is-confirmed/)
  await expect(page.locator('.toast')).toHaveCount(0)
})

for (const route of ['/echanges', '/fragments']) test(`réception carte et fragments dans la même feuille depuis ${route}`, async ({ page }) => {
  const codes = await seed(page)
  await page.goto(route)
  for (const kind of ['card', 'fragments'] as const) {
    await page.getByRole('button', { name: 'Recevoir', exact: true }).click()
    const sheet = page.getByRole('dialog')
    await expect(sheet).toContainText('Une carte ou des fragments : le code sait ce qu’il contient.')
    if (kind === 'card') {
      await page.evaluate(code => navigator.clipboard.writeText(code), codes.card)
      await sheet.getByRole('button', { name: 'Coller le code' }).click()
    } else {
      await sheet.getByLabel('Fichier de transfert .btcg').setInputFiles({ name: 'fragments.btcg', mimeType: 'application/octet-stream', buffer: Buffer.from(JSON.stringify({ format: 'bizave-tcg-transfer', version: 2, code: codes.fragments })) })
    }
    await sheet.getByRole('button', { name: 'Recevoir', exact: true }).click()
    if (kind === 'card') {
      await expect(sheet.locator('.viewer-meta')).toHaveText('Carte reçue de Nana · ajoutée à votre collection')
      await expect(sheet.locator('.card')).toHaveCount(1)
      await expect(sheet.locator('.viewer-dock button')).toHaveCount(2)
      await sheet.getByRole('button', { name: 'Fermer', exact: true }).click()
    } else {
      await expect(sheet).toContainText('+137')
      await expect(sheet.getByRole('status')).toHaveText('137 fragments reçus de Nana. Nouveau solde : 1 134 fragments.')
      await expect(page.locator('.fragment-wallet')).toContainText('1134')
      await sheet.getByRole('button', { name: route === '/fragments' ? 'Terminé' : 'Mes fragments', exact: true }).click()
    }
  }
  await page.getByRole('button', { name: 'Recevoir', exact: true }).click()
  await page.evaluate(code => navigator.clipboard.writeText(code), codes.fragments)
  await page.getByRole('button', { name: 'Coller le code' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Recevoir', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('Ce code a déjà été utilisé.')
})

test('responsive clair/sombre : solde, codes mixtes, filtre et fiche ami sans envoi', async ({ page }) => {
  await seed(page)
  await page.evaluate(async () => {
    const dbPath = '/src/storage/database.ts', servicesPath = '/src/exchanges/services.ts'
    const { db } = await import(dbPath), { sendFragments } = await import(servicesPath)
    const friend = (await db.friends.toArray())[0]
    for (let i = 0; i < 4; i++) await sendFragments(10 + i, friend.playerUuid)
    const dropId = crypto.randomUUID()
    await db.drops.add({ dropId, cardId: 't-classique', finish: 'normal', artVariant: 'standard', status: 'outgoing', acquiredAt: 1, updatedAt: 1 })
    await db.outbox.add({ kind: 'card', transferId: crypto.randomUUID(), dropId, recipientId: friend.playerUuid, recipientLabel: 'Nana', code: 'TR2.YWJj', createdAt: Date.now(), status: 'generated' })
  })
  for (const theme of ['light', 'dark']) for (const width of [390, 820, 1180, 1440]) {
    await page.setViewportSize({ width, height: width === 820 ? 1180 : 900 })
    await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme)
    await expect(page.locator('.friend-row')).toHaveCount(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    if (width === 390) {
      await expect(page.locator('.transfer-row:visible')).toHaveCount(3)
      await page.getByRole('button', { name: 'Tout voir · 5' }).click()
    }
    await expect(page.locator('.transfer-row:visible')).toHaveCount(5)
    await page.screenshot({ path: `artifacts/amis-${theme}-${width}.png`, fullPage: true })
    await page.locator('.fragment-wallet').click()
    if (width >= 1200) await expect(page.locator('.fragment-inline-codes .transfer-row')).toHaveCount(4)
    else await expect(page.getByRole('button', { name: 'Codes envoyés · 4' })).toBeVisible()
    await page.screenshot({ path: `artifacts/fragments-${theme}-${width}.png`, fullPage: true })
    await page.goto('/echanges')
  }
  await page.getByRole('button', { name: 'Fragments', exact: true }).click()
  await expect(page.locator('.transfer-row')).toHaveCount(4)
  await page.getByRole('button', { name: 'Cartes', exact: true }).click()
  await expect(page.locator('.transfer-row')).toHaveCount(1)
  await page.getByRole('button', { name: 'Voir la fiche de Nana' }).click()
  await expect(page.getByRole('dialog').getByRole('button', { name: /Envoyer|Donner/ })).toHaveCount(0)
  await page.getByRole('button', { name: 'Renommer', exact: true }).click()
  await page.getByRole('textbox', { name: 'Nom de l’ami' }).fill('Nana renommée')
  await page.getByRole('button', { name: 'Enregistrer', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Fiche ami' }).getByRole('heading', { name: 'Nana renommée', exact: true })).toBeVisible()
  await page.getByRole('dialog', { name: 'Fiche ami' }).getByRole('button', { name: 'Fermer', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Voir la fiche de Nana renommée' })).toBeVisible()
  await expect(page.locator('.transfer-row')).toContainText('pour Nana')
})
