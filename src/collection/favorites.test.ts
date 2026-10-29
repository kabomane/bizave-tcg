import { afterEach, beforeEach, expect, it } from 'vitest'
import Dexie from 'dexie'
import { BizaveDatabase } from '../storage/database'
import { initializeDatabase, openBooster, finishOpening, recycleDrops } from '../storage/services'
import { addContact, ownContact, receiveTransfer, sendTransfer } from '../exchanges/services'
import { ensureInstallation } from '../storage/installation'
import { canonicalSavePayload, exportSave, importSave } from '../storage/saveTransfer'
import { ensureIdentity } from '../exchanges/services'
import { base64url } from '../exchanges/crypto'
import { DEFAULT_PREFERENCES } from '../settings/preferences'
import { variantKey } from '../game/engine'
import type { CardDropRow } from '../game/types'
import { setFavorite } from './favorites'

let db: BizaveDatabase, other: BizaveDatabase
beforeEach(async () => {
  db = new BizaveDatabase('favorites-' + crypto.randomUUID()); other = new BizaveDatabase('favorites-other-' + crypto.randomUUID())
  await Promise.all([initializeDatabase(db), initializeDatabase(other)])
})
afterEach(async () => { await Promise.all([db.delete(), other.delete()]) })
async function copy(overrides: Partial<CardDropRow> = {}) {
  const row: CardDropRow = { dropId: crypto.randomUUID(), cardId: 't-classique', finish: 'normal', artVariant: 'standard', status: 'owned', acquiredAt: 1, updatedAt: 1, ...overrides }
  await db.drops.add(row); return row
}

it('partage le favori entre copies, distingue les variantes et permet son retrait', async () => {
  const card = await copy(); await copy(); const foil = await copy({ finish: 'glossy' })
  await setFavorite(card, true, db); await setFavorite(card, true, db)
  expect(await db.favorites.count()).toBe(1)
  expect(await db.favorites.get(variantKey(foil))).toBeUndefined()
  await setFavorite(card, false, db)
  expect(await db.favorites.count()).toBe(0)
  await expect(setFavorite({ ...card, artVariant: 'fullArt' }, true, db)).rejects.toThrow(/plus dans/)
})

it('garde le favori avant la dernière copie, puis l’efface au recyclage en lot', async () => {
  const first = await copy(), second = await copy({ acquiredAt: 2 }), foil = await copy({ finish: 'glossy' })
  await setFavorite(first, true, db); await setFavorite(foil, true, db)
  await recycleDrops([second.dropId], false, db)
  expect(await db.favorites.count()).toBe(2)
  await recycleDrops([first.dropId, foil.dropId], true, db)
  expect(await db.favorites.count()).toBe(0)
  const replacement = await copy()
  expect(await db.favorites.get(variantKey(replacement))).toBeUndefined()
})

it('efface le favori au dernier envoi et ne le restaure pas au retour', async () => {
  await addContact(await ownContact(other), 'Autre', db); await addContact(await ownContact(db), 'Source', other)
  const first = await copy(), second = await copy()
  await setFavorite(first, true, db)
  await sendTransfer(first.dropId, (await ensureIdentity(other)).playerUuid, db)
  expect(await db.favorites.count()).toBe(1)
  const outgoing = await sendTransfer(second.dropId, (await ensureIdentity(other)).playerUuid, db)
  expect(await db.favorites.count()).toBe(0)
  await receiveTransfer(outgoing.code, other)
  const returned = await sendTransfer(second.dropId, (await ensureIdentity(db)).playerUuid, other)
  await receiveTransfer(returned.code, db)
  expect(await db.favorites.count()).toBe(0)
})

it('annule aussi la suppression du favori si le recyclage échoue', async () => {
  const card = await copy(); await setFavorite(card, true, db)
  const before = await db.player.get('local')
  const fail = () => { throw new Error('Stockage plein') }
  db.recycledCards.hook('creating', fail)
  await expect(recycleDrops([card.dropId], true, db)).rejects.toThrow(/Stockage plein/)
  db.recycledCards.hook('creating').unsubscribe(fail)
  expect((await db.drops.get(card.dropId))?.status).toBe('owned')
  expect(await db.favorites.count()).toBe(1)
  expect(await db.player.get('local')).toEqual(before)
})

it('refuse atomiquement les favoris dans un lot Atelier même en mode dernières copies', async () => {
  const favorite = await copy(), ordinary = await copy({ cardId: 'op-thomas' })
  await setFavorite(favorite, true, db)
  const before = await db.player.get('local')
  await expect(recycleDrops([ordinary.dropId, favorite.dropId], true, db, Date.now(), true)).rejects.toThrow(/favorite/)
  expect(await db.player.get('local')).toEqual(before)
  expect((await db.drops.toArray()).every(drop => drop.status === 'owned')).toBe(true)
  expect(await db.recycling.count()).toBe(0)
  expect(await db.favorites.count()).toBe(1)
})

it('transfère les favoris avec la sauvegarde et efface la source', async () => {
  const card = await copy(); await setFavorite(card, true, db)
  const contents = await exportSave((await ensureInstallation(other)).installationId, DEFAULT_PREFERENCES, db)
  expect(await db.favorites.count()).toBe(0)
  await importSave(contents, other)
  expect(await other.favorites.get(variantKey(card))).toMatchObject({ cardId: card.cardId, finish: card.finish, artVariant: card.artVariant })
})

it('importe les anciennes sauvegardes du schéma 6 sans favoris ni ouvertures terminées', async () => {
  const card = await copy(), identity = await ensureIdentity(db)
  const envelope = JSON.parse(await exportSave((await ensureInstallation(other)).installationId, DEFAULT_PREFERENCES, db))
  const payload = JSON.parse(envelope.payload)
  payload.schemaVersion = 6; payload.tables.player[0].schemaVersion = 6; delete payload.tables.favorites; delete payload.tables.recycledCards
  payload.tables.openings.push({ id: crypto.randomUUID(), boosterId: 'phantom-blood', openedAt: 1, payment: 'free', fragmentsSpent: 0, results: [card], revealComplete: true, revealedCount: 1 })
  envelope.payload = JSON.stringify(payload)
  envelope.signature = base64url(new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, identity.signingPrivateKey, canonicalSavePayload(envelope.payload))))
  await importSave(JSON.stringify(envelope), other)
  expect(await other.favorites.count()).toBe(0)
  expect(await other.openings.count()).toBe(0)
  expect(await other.drops.count()).toBe(1)
})

it('conserve la reprise en cours puis supprime seulement l’ouverture terminée', async () => {
  const opening = await openBooster('phantom-blood', db)
  expect((await openBooster('anima-isekai', db)).id).toBe(opening.id)
  await finishOpening(opening.id, db)
  expect(await db.openings.count()).toBe(0)
  expect(await db.drops.count()).toBe(5)
  expect(await db.discoveries.count()).toBeGreaterThan(0)
})

it('migre le schéma 6 en gardant les exemplaires et l’ouverture inachevée', async () => {
  const name = 'legacy-favorites-' + crypto.randomUUID(), legacy = new Dexie(name)
  const schemas = Object.fromEntries(db.tables.filter(table => !['favorites', 'recycledCards'].includes(table.name)).map(table => [table.name, [table.schema.primKey.src, ...table.schema.indexes.map(index => index.src)].join(',')]))
  legacy.version(6).stores(schemas)
  await legacy.open()
  await legacy.table('player').add({ ...await db.player.get('local'), schemaVersion: 6 })
  const card = await copy()
  await legacy.table('drops').add(card)
  const pending = { id: crypto.randomUUID(), boosterId: 'phantom-blood', openedAt: 1, payment: 'free', fragmentsSpent: 0, results: [card], revealComplete: false, revealedCount: 1 }
  await legacy.table('openings').bulkAdd([pending, { ...pending, id: crypto.randomUUID(), revealComplete: true }])
  legacy.close()
  const upgraded = new BizaveDatabase(name)
  try {
    await upgraded.open()
    expect(await upgraded.openings.toArray()).toEqual([pending])
    expect(await upgraded.drops.get(card.dropId)).toEqual(card)
    expect(await upgraded.favorites.count()).toBe(0)
    expect((await upgraded.player.get('local'))?.schemaVersion).toBe(9)
  } finally { await upgraded.delete() }
})
