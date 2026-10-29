import Dexie from 'dexie'
import { afterEach, expect, it, vi } from 'vitest'
import { BizaveDatabase, DATABASE_SCHEMA_VERSION } from '../database'
import { initializeDatabase, openBooster } from '../services'
import { ensureIdentity } from '../../exchanges/services'
import { migrateLegacyDatabase } from './legacyDatabase'

const names: string[] = []
const name = () => { const value = 'db-patch-' + crypto.randomUUID(); names.push(value); return value }
afterEach(async () => { vi.restoreAllMocks(); await Promise.all(names.splice(0).map(value => Dexie.delete(value))) })

it('ne crée pas de base legacy chez les nouveaux joueurs et initialise leur entrée version', async () => {
  const sourceName = name(), targetName = name()
  await migrateLegacyDatabase(sourceName, targetName)
  expect(await Dexie.exists(sourceName)).toBe(false)
  expect(await Dexie.exists(targetName)).toBe(false)
  const target = new BizaveDatabase(targetName)
  try {
    await initializeDatabase(target)
    expect(await target.versionInfo.get('local')).toEqual({ id: 'local', schemaVersion: DATABASE_SCHEMA_VERSION, ready: true })
  } finally { target.close() }
})

it('remplace l’ancienne base par la partie active, clés, favoris et ouverture compris', async () => {
  const sourceName = name(), targetName = name(), source = new BizaveDatabase(sourceName)
  const oldTarget = new Dexie(targetName)
  oldTarget.version(1).stores({ obsolete: '&id' }); await oldTarget.open()
  await oldTarget.table('obsolete').put({ id: 'old', fragments: 99999 }); oldTarget.close()
  await initializeDatabase(source)
  const identity = await ensureIdentity(source)
  const opening = await openBooster('phantom-blood', source)
  await source.player.update('local', { fragments: 321 })
  const card = opening.results[0]
  await source.favorites.put({ cardId: card.cardId, finish: card.finish, artVariant: card.artVariant, key: `${card.cardId}::${card.finish}::${card.artVariant}` })
  await source.usedGiftCodes.put({ codeHash: 'a'.repeat(64), redeemedAt: 1 })
  const expected = await Promise.all(source.tables.filter(table => table.name !== 'version').map(async table => ({ name: table.name, rows: await table.toArray() })))
  source.close()
  await migrateLegacyDatabase(sourceName, targetName)
  expect(await Dexie.exists(sourceName)).toBe(false)
  const target = new BizaveDatabase(targetName)
  try {
    await target.open()
    expect(target.tables.some(table => table.name === 'obsolete')).toBe(false)
    for (const table of expected) expect(await target.table(table.name).toArray(), table.name).toEqual(table.rows)
    expect((await ensureIdentity(target)).playerUuid).toBe(identity.playerUuid)
    expect(await target.versionInfo.get('local')).toMatchObject({ schemaVersion: DATABASE_SCHEMA_VERSION, ready: true })
  } finally { target.close() }
})

it('reprend après une copie interrompue, sans effacer la seule sauvegarde active', async () => {
  const sourceName = name(), targetName = name(), source = new BizaveDatabase(sourceName)
  await initializeDatabase(source); await source.player.update('local', { fragments: 456 })
  // A corrupt key simulates a failure during the final integrity check.
  const identity = await ensureIdentity(source)
  await source.identity.put({ ...identity, signingPrivateKey: undefined as unknown as CryptoKey })
  source.close()
  await expect(migrateLegacyDatabase(sourceName, targetName)).rejects.toThrow()
  expect(await Dexie.exists(sourceName)).toBe(true)
  const partial = new Dexie(targetName); await partial.open()
  expect(await partial.table('version').get('local')).toBeUndefined(); partial.close()
  await source.open(); expect((await source.player.get('local'))?.fragments).toBe(456)
  await source.identity.put(identity); source.close()
  await migrateLegacyDatabase(sourceName, targetName)
  const target = new BizaveDatabase(targetName)
  try { expect((await target.player.get('local'))?.fragments).toBe(456) } finally { target.close() }
  expect(await Dexie.exists(sourceName)).toBe(false)
})

it('conserve la base validée si un ancien client recrée une base v2 obsolète', async () => {
  const sourceName = name(), targetName = name(), target = new BizaveDatabase(targetName), source = new BizaveDatabase(sourceName)
  await initializeDatabase(target); await target.player.update('local', { fragments: 789 }); target.close()
  await initializeDatabase(source); await source.player.update('local', { fragments: 1 }); source.close()
  await migrateLegacyDatabase(sourceName, targetName)
  try { await target.open(); expect((await target.player.get('local'))?.fragments).toBe(789) } finally { target.close() }
  expect(await Dexie.exists(sourceName)).toBe(false)
})

it('préserve un compte transféré et son fichier de téléchargement', async () => {
  const sourceName = name(), targetName = name(), source = new BizaveDatabase(sourceName)
  await initializeDatabase(source)
  await source.transaction('rw', source.tables, async () => {
    for (const table of source.tables) await table.clear()
    await source.accountState.put({ id: 'local', status: 'exported', transferId: crypto.randomUUID(), recipientId: '1234-56-78', file: 'signed-save-file' })
  })
  source.close()
  await migrateLegacyDatabase(sourceName, targetName)
  const target = new BizaveDatabase(targetName)
  try { expect(await target.accountState.get('local')).toMatchObject({ status: 'exported', file: 'signed-save-file' }); expect(await target.player.count()).toBe(0) } finally { target.close() }
})

it('migre une vraie base du schéma 8 et initialise sa version explicite', async () => {
  const sourceName = name(), targetName = name(), template = new BizaveDatabase(name())
  await template.open()
  const schemas = Object.fromEntries(template.tables.filter(table => table.name !== 'version').map(table => [table.name, [table.schema.primKey.src, ...table.schema.indexes.map(index => index.src)].join(',')]))
  template.close()
  const legacy = new Dexie(sourceName)
  legacy.version(8).stores(schemas); await legacy.open()
  await legacy.table('player').put({ id: 'local', fragments: 543, freePackStock: 5, nextFreePackAt: null, maxObservedClockAt: 1, schemaVersion: 8 })
  legacy.close()
  await migrateLegacyDatabase(sourceName, targetName)
  const target = new BizaveDatabase(targetName)
  try {
    expect(await target.player.get('local')).toMatchObject({ fragments: 543, schemaVersion: 9 })
    expect(await target.versionInfo.get('local')).toEqual({ id: 'local', schemaVersion: 9, ready: true })
  } finally { target.close() }
  expect(await Dexie.exists(sourceName)).toBe(false)
})

it('sérialise deux démarrages concurrents sans perdre la sauvegarde', async () => {
  const sourceName = name(), targetName = name(), source = new BizaveDatabase(sourceName)
  await initializeDatabase(source); await source.player.update('local', { fragments: 654 }); source.close()
  await Promise.all([migrateLegacyDatabase(sourceName, targetName), migrateLegacyDatabase(sourceName, targetName)])
  const target = new BizaveDatabase(targetName)
  try { expect((await target.player.get('local'))?.fragments).toBe(654) } finally { target.close() }
  expect(await Dexie.exists(sourceName)).toBe(false)
})
