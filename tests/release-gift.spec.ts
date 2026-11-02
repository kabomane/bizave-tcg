import { expect, test } from '@playwright/test'
import { UPDATE_NOTE, UPDATE_VERSION } from '../src/data/update'
import { expandSettings } from './settings-helpers'

test('Le cadeau annoncé crédite un Memory Frame une seule fois', async ({ page }) => {
  await page.goto('/collection')
  await expect(page.getByRole('heading', { name: 'Collection', exact: true })).toBeVisible()
  await page.evaluate(version => localStorage.setItem('updated', String(version - 1)), UPDATE_VERSION)
  await page.reload()
  await expect(page.locator('.update-note')).toHaveText(UPDATE_NOTE)
  const code = UPDATE_NOTE.split('\n\n').at(-1)!
  expect(code).toMatch(/^[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}$/)
  await page.getByRole('button', { name: 'Continuer', exact: true }).click()
  await page.goto('/parametres'); await expandSettings(page, 'gifts')
  const input = page.getByRole('textbox', { name: 'Code cadeau', exact: true }), button = page.getByRole('button', { name: 'Utiliser', exact: true })
  await input.fill(code); await button.click()
  await expect(page.locator('#gift-note')).toHaveText('1 booster Memory Frame ajouté à vos boosters.')
  const stock = () => page.evaluate(async () => {
    const path = '/src/storage/database.ts', { db } = await import(path)
    return { stock: await db.boosterStock.toArray(), used: await db.usedGiftCodes.count() }
  })
  expect(await stock()).toMatchObject({ stock: [{ boosterId: 'phantom-blood', quantity: 1 }], used: 1 })
  await input.fill(code); await button.click()
  await expect(page.locator('#gift-note')).toHaveText('Ce code cadeau a déjà été utilisé.')
  expect(await stock()).toMatchObject({ stock: [{ boosterId: 'phantom-blood', quantity: 1 }], used: 1 })
})
