import { expect, test } from '@playwright/test'

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
