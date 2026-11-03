import { expandSettings } from './settings-helpers'
import { expect, test } from '@playwright/test'
import { createHash } from 'node:crypto'
import { GIFT_CODE_DOMAIN } from '../src/gifts/format'

test('un code de lot crédite une fois chacun des quatre boosters', async ({ page }) => {
  // Keep this bundle fixture independent of the changing release gift.
  const code = 'EEEE-EEEE-EEEE-EEEE'
  const codeHash = createHash('sha256').update(GIFT_CODE_DOMAIN + code.replaceAll('-', '')).digest('hex')
  const reward = { type: 'boosters', boosters: ['phantom-blood', 'anima-isekai', 'epico-stellari', 'rarity-only'].map(boosterId => ({ boosterId, quantity: 1 })) }
  await page.route(/\/src\/data\/gift-codes\.json(?:\?.*)?$/, route => route.fulfill({ contentType: 'application/javascript', body: `export default ${JSON.stringify([{ codeHash, reward, issuedAt: 0, expiresAt: 8_000_000_000_000_000 }])}` }))
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
