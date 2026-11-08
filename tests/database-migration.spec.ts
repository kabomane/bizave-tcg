import { expect, test } from '@playwright/test'

test('un nouveau joueur possède seulement bizave-tcg et son entrée version', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Ouvrir le booster Memory Frame', exact: true })).toBeVisible()
  const actual = await page.evaluate(async () => {
    const path = '/src/storage/database.ts', { db } = await import(path)
    return { names: (await indexedDB.databases()).map(database => database.name), version: await db.versionInfo.get('local') }
  })
  expect(actual.names.filter((name: string | undefined) => name === 'bizave-tcg' || name === 'bizave-tcg-v2')).toEqual(['bizave-tcg'])
  expect(actual.version).toEqual({ id: 'local', schemaVersion: 11, ready: true })
})
