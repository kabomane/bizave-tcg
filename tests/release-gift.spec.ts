import { expect, test } from '@playwright/test'
import { UPDATE_NOTE } from '../src/data/update'
import gifts from '../src/data/gift-codes.json' with { type: 'json' }
import { hashGiftCode } from '../src/gifts/format'
import { expandSettings } from './settings-helpers'

test('le cadeau annoncé offre un Hunger Games, une seule fois, puis sa carte permanente', async ({ page }) => {
  const code = UPDATE_NOTE.match(/[A-Z2-9]{4}(?:-[A-Z2-9]{4}){3}/)?.[0]
  expect(code).toBeTruthy()
  const hash = await hashGiftCode(code!)
  const gift = gifts.find(item => item.codeHash === hash)!
  expect(gift.reward).toEqual({ type: 'booster', boosterId: 'hunger-games-2026', quantity: 1 })
  expect(gift.expiresAt).toBe(Date.parse('2026-11-30T00:00:00+01:00'))
  await page.clock.install({ time: gift.issuedAt + 1 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('/parametres')
  await expandSettings(page, 'gifts')
  const input = page.getByRole('textbox', { name: 'Code cadeau', exact: true })
  await input.fill(code!)
  await page.getByRole('button', { name: 'Utiliser', exact: true }).click()
  await expect(page.locator('#gift-note')).toHaveText('1 booster Hunger Games ajouté à vos boosters.')
  await input.fill(code!)
  await page.getByRole('button', { name: 'Utiliser', exact: true }).click()
  await expect(page.locator('#gift-note')).toContainText('déjà été utilisé')
  await page.goto('/')
  await page.locator('.booster-carousel-track').press('End')
  await page.getByRole('button', { name: 'Ouvrir le booster Hunger Games', exact: true }).click()
  await page.getByRole('button', { name: 'Révéler la carte', exact: true }).click()
  await page.getByRole('button', { name: /Voir le récapitulatif$/ }).click()
  await expect(page.getByText('Dans votre collection.', { exact: true })).toBeVisible()
  await expect(page.locator('.event-opening .recap-grid .card')).toHaveCount(1)
})

test('les anciens codes cadeaux sont retirés et ne créditent plus rien', async ({ page }) => {
  await page.goto('/parametres')
  const result = await page.evaluate(async () => {
    const servicePath = '/src/gifts/services.ts', dbPath = '/src/storage/database.ts'
    const { redeemGiftCode } = await import(servicePath), { db } = await import(dbPath)
    const before = await db.player.get('local')
    let error = ''
    try { await redeemGiftCode('DEE5-AVCY-8L4W-JL7A') } catch (e) { error = (e as Error).message }
    return { error, before, after: await db.player.get('local'), used: await db.usedGiftCodes.count() }
  })
  expect(result.error).toBe('Ce code cadeau est invalide.')
  expect(result.after).toEqual(result.before)
  expect(result.used).toBe(0)
})
