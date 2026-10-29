import { expect, test } from '@playwright/test'

test('une seule base canonique après migration, identité et ouverture conservées', async ({ page }) => {
  await page.route('**/src/main.tsx*', route => route.fulfill({ contentType: 'application/javascript', body: 'export {}' }))
  await page.goto('/')
  const expected = await page.evaluate(async () => {
    const dbPath = '/src/storage/database.ts', servicePath = '/src/storage/services.ts', exchangePath = '/src/exchanges/services.ts'
    const { BizaveDatabase } = await import(dbPath), { initializeDatabase, openBooster } = await import(servicePath), { ensureIdentity } = await import(exchangePath)
    const source = new BizaveDatabase('bizave-tcg-v2')
    await initializeDatabase(source)
    const identity = await ensureIdentity(source)
    const opening = await openBooster('phantom-blood', source)
    await source.player.update('local', { fragments: 735 })
    const installation = await source.installation.get('local')
    source.close()
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open('bizave-tcg', 1)
      request.onupgradeneeded = () => request.result.createObjectStore('obsolete')
      request.onsuccess = () => { request.result.close(); resolve() }
      request.onerror = () => reject(request.error)
    })
    localStorage.setItem('updated', '1')
    return { playerUuid: identity.playerUuid, openingId: opening.id, installationId: installation.installationId }
  })
  await page.unroute('**/src/main.tsx*')
  await page.reload()
  await expect(page.getByRole('button', { name: 'Révéler la première carte', exact: true })).toBeVisible()
  const actual = await page.evaluate(async () => {
    const dbPath = '/src/storage/database.ts', { db } = await import(dbPath)
    return { names: (await indexedDB.databases()).map(database => database.name), player: await db.player.get('local'), identity: await db.identity.get('local'), installation: await db.installation.get('local'), opening: await db.openings.toArray(), version: await db.versionInfo.get('local') }
  })
  expect(actual.names.filter((name: string | undefined) => name === 'bizave-tcg' || name === 'bizave-tcg-v2')).toEqual(['bizave-tcg'])
  expect(actual.player).toMatchObject({ fragments: 735, freePackStock: 4, schemaVersion: 9 })
  expect(actual.identity.playerUuid).toBe(expected.playerUuid)
  expect(actual.installation.installationId).toBe(expected.installationId)
  expect(actual.opening[0].id).toBe(expected.openingId)
  expect(actual.version).toEqual({ id: 'local', schemaVersion: 9, ready: true })
  await page.reload()
  await expect(page.getByRole('button', { name: 'Révéler la première carte', exact: true })).toBeVisible()
})

test('un nouveau joueur possède seulement bizave-tcg et son entrée version', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Ouvrir le booster Memory Frame', exact: true })).toBeVisible()
  const actual = await page.evaluate(async () => {
    const path = '/src/storage/database.ts', { db } = await import(path)
    return { names: (await indexedDB.databases()).map(database => database.name), version: await db.versionInfo.get('local') }
  })
  expect(actual.names.filter((name: string | undefined) => name === 'bizave-tcg' || name === 'bizave-tcg-v2')).toEqual(['bizave-tcg'])
  expect(actual.version).toEqual({ id: 'local', schemaVersion: 9, ready: true })
})
