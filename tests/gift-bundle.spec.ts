import { expandSettings } from './settings-helpers'
import { expect, test } from '@playwright/test'
import { UPDATE_NOTE } from '../src/data/update'

test('le code de la note crédite une fois chacun des quatre boosters', async ({ page }) => {
  const code = UPDATE_NOTE.match(/[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}/)![0]
  await page.goto('/parametres'); await expandSettings(page, 'gifts')
  const input = page.getByRole('textbox', { name: 'Code cadeau', exact: true })
  await input.fill(code)
  await page.getByRole('button', { name: 'Utiliser', exact: true }).click()
  for (const title of ['Memory Frame', 'Anima Isekai', 'epico stellari', 'rarity only']) await expect(page.locator('#gift-note')).toContainText(`1 booster ${title}`)
  const stock = () => page.evaluate(async () => { const path = '/src/storage/database.ts', { db } = await import(path); return (await db.boosterStock.toArray()).map((row: { boosterId: string; quantity: number }) => [row.boosterId, row.quantity]).sort() })
  const expected = [['phantom-blood', 1], ['anima-isekai', 1], ['epico-stellari', 1], ['rarity-only', 1]].sort()
  expect(await stock()).toEqual(expected)
  await input.fill(code)
  await page.getByRole('button', { name: 'Utiliser', exact: true }).click()
  await expect(page.locator('#gift-note')).toContainText('déjà été utilisé')
  expect(await stock()).toEqual(expected)
})
