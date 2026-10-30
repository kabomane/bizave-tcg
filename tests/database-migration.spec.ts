import { expect, test } from '@playwright/test'
import { UPDATE_VERSION } from '../src/data/update'

test('ancienne rareté de Soirée film #3 corrigée au démarrage sans perdre la collection', async ({ page }) => {
  await page.goto('/collection')
  await expect(page.getByRole('heading', { name: 'Collection', exact: true })).toBeVisible()
  const expected = await page.evaluate(async () => {
    const databasePath = '/src/storage/database.ts', exchangePath = '/src/exchanges/services.ts'
    const { db } = await import(databasePath), { ensureIdentity } = await import(exchangePath)
    const identity = await ensureIdentity()
    const card = { dropId: crypto.randomUUID(), cardId: 'soiree-film-3', finish: 'alternative', artVariant: 'fullArt', status: 'owned', acquiredAt: 1, updatedAt: 1 }
    await db.drops.add(card)
    await db.favorites.put({ cardId: card.cardId, finish: card.finish, artVariant: card.artVariant, key: `${card.cardId}::${card.finish}::${card.artVariant}` })
    await db.definitions.update(card.cardId, { rarity: 'rare' })
    await db.player.update('local', { fragments: 273 })
    return { card, playerUuid: identity.playerUuid, favorites: await db.favorites.toArray(), installation: await db.installation.get('local') }
  })
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.reload()
    await expect(page.getByRole('heading', { name: 'Collection', exact: true })).toBeVisible()
    await expect(page.locator('.title-with-count > span')).toHaveText('1')
    await expect(page.locator('.collection-grid .card')).toHaveAttribute('data-rarity', 'uncommon')
    const actual = await page.evaluate(async () => {
      const databasePath = '/src/storage/database.ts', { db } = await import(databasePath)
      return { card: await db.drops.toArray(), definition: await db.definitions.get('soiree-film-3'), favorites: await db.favorites.toArray(), identity: await db.identity.get('local'), installation: await db.installation.get('local'), player: await db.player.get('local') }
    })
    expect(actual.card).toEqual([expected.card])
    expect(actual.definition.rarity).toBe('uncommon')
    expect(actual.favorites).toEqual(expected.favorites)
    expect(actual.identity.playerUuid).toBe(expected.playerUuid)
    expect(actual.installation).toEqual(expected.installation)
    expect(actual.player.fragments).toBe(273)
  }
})

test('une seule base canonique après migration, identité et ouverture conservées', async ({ page }) => {
  await page.route('**/src/main.tsx*', route => route.fulfill({ contentType: 'application/javascript', body: 'export {}' }))
  await page.goto('/')
  const expected = await page.evaluate(async updateVersion => {
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
    localStorage.setItem('updated', String(updateVersion))
    return { playerUuid: identity.playerUuid, openingId: opening.id, installationId: installation.installationId }
  }, UPDATE_VERSION)
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
