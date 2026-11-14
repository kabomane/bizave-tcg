import { expect, test } from '@playwright/test'
import type { Table } from 'dexie'
import { expandSettings } from './settings-helpers'

test('un nouveau joueur possède seulement bizave-tcg et son entrée version', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Ouvrir le booster Memory Frame', exact: true })).toBeVisible()
  const actual = await page.evaluate(async () => {
    const path = '/src/storage/database.ts', { db } = await import(path)
    return { names: (await indexedDB.databases()).map(database => database.name), version: await db.versionInfo.get('local') }
  })
  expect(actual.names.filter((name: string | undefined) => name === 'bizave-tcg' || name === 'bizave-tcg-v2')).toEqual(['bizave-tcg'])
  expect(actual.version).toEqual({ id: 'local', schemaVersion: 13, ready: true })
  await expect(page.locator('.beta-closed')).toHaveCount(0)
})

test('affiche PR-001 avant la réinitialisation explicite de la partie bêta', async ({ page }) => {
  await page.clock.setFixedTime(new Date('2026-11-15T12:00:00Z'))
  await page.route('**/release-fixture', route => route.fulfill({ contentType: 'text/html', body: '<!doctype html><title>Fixture</title>' }))
  await page.goto('/release-fixture')
  await page.evaluate(async () => {
    const databasePath = '/src/storage/database.ts', dexiePath = '/node_modules/dexie/dist/dexie.mjs'
    const { db } = await import(databasePath), { default: Dexie } = await import(dexiePath)
    const legacy = new Dexie(db.name)
    legacy.version(11).stores(Object.fromEntries(db.tables.map((table: Table) => [table.name, [table.schema.primKey.src, ...table.schema.indexes.map(index => index.src)].join(',')])))
    await legacy.table('player').add({ id: 'local', schemaVersion: 11, fragments: 987, freePackStock: 2, nextFreePackAt: null, maxObservedClockAt: Date.now() })
    await legacy.table('version').add({ id: 'local', schemaVersion: 11, ready: true })
    legacy.close()
    await caches.open('beta-fixture')
  })

  await page.goto('/collection')
  const gate = page.locator('.beta-closed')
  await expect(gate.getByRole('heading', { name: 'La bêta est terminée.' })).toBeVisible()
  await expect(gate.locator('.beta-fan .card')).toHaveCount(3)
  const code = (await gate.locator('code').textContent())!
  expect(code).toMatch(/^(?:[A-Z2-9]{4}-){3}[A-Z2-9]{4}$/)
  const entry = gate.getByRole('button', { name: 'Réinitialiser et entrer en 1.5.2' })

  const cacheResetPath = '**/release-cache-reset.json'
  await page.route(cacheResetPath, route => route.fulfill({ status: 503 }))
  await entry.click()
  await expect(gate.getByRole('alert')).toContainText('Le cache n’a pas pu être actualisé')
  expect(await page.evaluate(async () => ({ dbVersion: (await indexedDB.databases()).find(db => db.name === 'bizave-tcg')?.version, caches: await caches.keys() }))).toEqual({ dbVersion: 110, caches: ['beta-fixture'] })
  await page.unroute(cacheResetPath)

  await entry.click()
  await expect(page.getByRole('button', { name: 'Ouvrir le booster Memory Frame', exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/$/)
  expect(await page.evaluate(async () => {
    const path = '/src/storage/database.ts', { db } = await import(path)
    const { fragments, schemaVersion } = await db.player.get('local')
    return { fragments, schemaVersion, version: (await db.versionInfo.get('local')).schemaVersion, caches: await caches.keys() }
  })).toEqual({ fragments: 0, schemaVersion: 13, version: 13, caches: [] })

  await page.goto('/parametres')
  await expect(gate).toHaveCount(0)
  await expandSettings(page, 'gifts')
  await page.getByRole('textbox', { name: 'Code cadeau' }).fill(code)
  await page.getByRole('button', { name: 'Utiliser', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Bizave TCG bêta (PR-001) a été ajoutée à votre collection en Classique, finition Alternative.')
  expect(await page.evaluate(async () => {
    const path = '/src/storage/database.ts', { db } = await import(path)
    return (await db.drops.toArray()).map(({ cardId, artVariant, finish }: { cardId: string; artVariant: string; finish: string }) => ({ cardId, artVariant, finish }))
  })).toEqual([{ cardId: 'bizave-tcg-beta', artVariant: 'standard', finish: 'alternative' }])
})
