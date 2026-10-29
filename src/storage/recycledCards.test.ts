import { afterEach, beforeEach, expect, it } from 'vitest'
import Dexie from 'dexie'
import { BizaveDatabase } from './database'
import { initializeDatabase, openBooster, finishOpening, recycleDrops } from './services'
import { addContact, ownContact, ensureIdentity, sendTransfer, receiveTransfer } from '../exchanges/services'
import { base64url, signTransfer } from '../exchanges/crypto'
import { canonicalSavePayload, exportSave, importSave } from './saveTransfer'
import { ensureInstallation } from './installation'
import { DEFAULT_PREFERENCES } from '../settings/preferences'
import type { CardDropRow } from '../game/types'

let db: BizaveDatabase, other: BizaveDatabase
beforeEach(async () => {
  db = new BizaveDatabase('compact-' + crypto.randomUUID()); other = new BizaveDatabase('compact-other-' + crypto.randomUUID())
  await Promise.all([initializeDatabase(db), initializeDatabase(other)])
})
afterEach(async () => { await Promise.all([db.delete(), other.delete()]) })
const copy = (circulation?: CardDropRow['circulation']): CardDropRow => ({ dropId: crypto.randomUUID(), cardId: 't-classique', finish: 'normal', artVariant: 'standard', acquiredAt: 1, updatedAt: 1, status: 'owned', ...(circulation ? { circulation } : {}) })

it('efface intégralement les exemplaires tirés puis recyclés sans échange', async () => {
  const opening = await openBooster('phantom-blood', db)
  expect((await db.drops.toArray()).every(card => card.circulation === 'local')).toBe(true)
  await finishOpening(opening.id, db)
  await recycleDrops(opening.results.map(card => card.dropId), true, db)
  expect(await db.drops.count()).toBe(0)
  expect(await db.openings.count()).toBe(0)
  expect(await db.recycling.count()).toBe(0)
  expect(await db.recycledCards.count()).toBe(0)
  expect(await db.discoveries.count()).toBeGreaterThan(0)
})

it('recycle 2000 cartes locales sans aucun identifiant résiduel et garde seulement les blocages utiles', async () => {
  const local = Array.from({ length: 2000 }, () => copy('local')), exchanged = copy('exchanged'), unknown = copy()
  const inventory = [...local, exchanged, unknown]
  await db.drops.bulkAdd(inventory)
  await recycleDrops(inventory.map(card => card.dropId), true, db)
  expect(await db.drops.count()).toBe(0)
  expect(await db.recycling.count()).toBe(0)
  expect((await db.player.get('local'))?.fragments).toBe(2002)
  expect((await db.recycledCards.toArray()).sort((a, b) => a.dropId.localeCompare(b.dropId))).toEqual([{ dropId: exchanged.dropId }, { dropId: unknown.dropId }].sort((a, b) => a.dropId.localeCompare(b.dropId)))
  await expect(recycleDrops([local[0].dropId], true, db)).rejects.toThrow(/plus disponible/)
  expect((await db.player.get('local'))?.fragments).toBe(2002)
}, 20_000)

it('protège une carte locale envoyée, rendue puis recyclée contre un nouveau code signé', async () => {
  await addContact(await ownContact(other), 'Autre', db); await addContact(await ownContact(db), 'Source', other)
  const card = copy('local'); await db.drops.add(card)
  const outgoing = await sendTransfer(card.dropId, (await ensureIdentity(other)).playerUuid, db)
  expect((await db.drops.get(card.dropId))?.circulation).toBe('exchanged')
  await receiveTransfer(outgoing.code, other)
  const returned = await sendTransfer(card.dropId, (await ensureIdentity(db)).playerUuid, other)
  await receiveTransfer(returned.code, db)
  expect((await db.drops.get(card.dropId))?.circulation).toBe('exchanged')
  await recycleDrops([card.dropId], true, db)
  expect(await db.drops.get(card.dropId)).toBeUndefined()
  expect(await db.recycledCards.get(card.dropId)).toEqual({ dropId: card.dropId })
  const forged = await signTransfer(await ensureIdentity(other), (await other.friends.toArray())[0], card)
  await expect(receiveTransfer(forged.code, db)).rejects.toThrow(/recyclé/)
  await expect(receiveTransfer(returned.code, db)).rejects.toThrow(/déjà été utilisé/)
})

it('transfère les marqueurs locaux et fusionne les identifiants recyclés des deux appareils', async () => {
  const local = copy('local'), unknown = copy()
  await db.drops.bulkAdd([local, unknown]); await recycleDrops([unknown.dropId], true, db)
  const previous = { dropId: crypto.randomUUID() }; await other.recycledCards.put(previous)
  const contents = await exportSave((await ensureInstallation(other)).installationId, DEFAULT_PREFERENCES, db)
  await importSave(contents, other)
  expect((await other.drops.get(local.dropId))?.circulation).toBe('local')
  expect(await other.recycledCards.count()).toBe(2)
  expect(await other.recycledCards.get(previous.dropId)).toEqual(previous)
  await recycleDrops([local.dropId], true, other)
  expect(await other.recycledCards.count()).toBe(2)
})

it('annule tout le lot, fragments compris, si un identifiant bloqué ne peut pas être écrit', async () => {
  const local = copy('local'), unknown = copy(); await db.drops.bulkAdd([local, unknown])
  const fail = () => { throw new Error('Disque plein') }
  db.recycledCards.hook('creating', fail)
  await expect(recycleDrops([local.dropId, unknown.dropId], true, db)).rejects.toThrow(/Disque plein/)
  db.recycledCards.hook('creating').unsubscribe(fail)
  expect(await db.drops.count()).toBe(2)
  expect((await db.player.get('local'))?.fragments).toBe(0)
  expect(await db.recycledCards.count()).toBe(0)
})

it('refuse sans perte un import qui ressusciterait une carte déjà recyclée sur la cible', async () => {
  const card = copy('local'); await db.drops.add(card)
  const contents = await exportSave((await ensureInstallation(other)).installationId, DEFAULT_PREFERENCES, db)
  await other.recycledCards.put({ dropId: card.dropId })
  await other.player.update('local', { fragments: 42 })
  await expect(importSave(contents, other)).rejects.toThrow(/déjà recyclée/)
  expect((await other.player.get('local'))?.fragments).toBe(42)
  expect(await other.drops.count()).toBe(0)
  expect(await other.recycledCards.get(card.dropId)).toEqual({ dropId: card.dropId })
  expect(await other.usedSaveTransfers.count()).toBe(0)
})

it('compacte un fichier signé du schéma 7 et considère sa provenance comme inconnue', async () => {
  const card = copy('local'), recycled = { ...copy(), status: 'recycled' }
  await db.drops.add(card)
  const identity = await ensureIdentity(db)
  const envelope = JSON.parse(await exportSave((await ensureInstallation(other)).installationId, DEFAULT_PREFERENCES, db))
  const payload = JSON.parse(envelope.payload)
  payload.schemaVersion = 7; payload.tables.player[0].schemaVersion = 7; delete payload.tables.recycledCards
  payload.tables.drops.push(recycled)
  payload.tables.recycling.push({ id: crypto.randomUUID(), createdAt: 1, dropIds: [recycled.dropId], fragmentsGained: 1 })
  envelope.payload = JSON.stringify(payload)
  envelope.signature = base64url(new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, identity.signingPrivateKey, canonicalSavePayload(envelope.payload))))
  await importSave(JSON.stringify(envelope), other)
  expect(await other.drops.get(card.dropId)).toEqual({ ...card, circulation: undefined })
  expect(await other.recycledCards.get(recycled.dropId)).toEqual({ dropId: recycled.dropId })
  expect(await other.recycling.count()).toBe(0)
  await recycleDrops([card.dropId], true, other)
  expect(await other.recycledCards.count()).toBe(2)
})

it('compacte une sauvegarde du schéma 7 sans toucher aux cartes possédées ni aux transferts reçus', async () => {
  const name = 'compact-legacy-' + crypto.randomUUID(), legacy = new Dexie(name)
  legacy.version(7).stores(Object.fromEntries(db.tables.filter(table => table.name !== 'recycledCards').map(table => [table.name, [table.schema.primKey.src, ...table.schema.indexes.map(index => index.src)].join(',')])))
  await legacy.open()
  const owned = copy(), recycled = { ...copy(), status: 'recycled' }, transfer = { transferId: crypto.randomUUID(), receivedAt: 1 }
  await legacy.table('player').add({ ...await db.player.get('local'), schemaVersion: 7, fragments: 123 })
  await legacy.table('drops').bulkAdd([owned, recycled])
  await legacy.table('usedTransfers').add(transfer)
  await legacy.table('recycling').add({ id: crypto.randomUUID(), createdAt: 1, dropIds: [recycled.dropId], fragmentsGained: 1 })
  legacy.close()
  const upgraded = new BizaveDatabase(name)
  try {
    await upgraded.open()
    expect(await upgraded.drops.toArray()).toEqual([owned])
    expect(await upgraded.recycledCards.toArray()).toEqual([{ dropId: recycled.dropId }])
    expect(await upgraded.recycling.count()).toBe(0)
    expect(await upgraded.usedTransfers.get(transfer.transferId)).toEqual(transfer)
    expect(await upgraded.player.get('local')).toMatchObject({ fragments: 123, schemaVersion: 9 })
  } finally { await upgraded.delete() }
})
