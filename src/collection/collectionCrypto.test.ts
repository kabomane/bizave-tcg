import { afterEach, expect, it } from 'vitest'
import { db, BizaveDatabase, DATABASE_SCHEMA_VERSION } from '../storage/database'
import { initializeDatabase } from '../storage/services'
import { ensureIdentity } from '../exchanges/services'
import { createContactCode, generateIdentity, parseContactCode } from '../exchanges/crypto'
import { uuid, variantKey } from '../game/engine'
import { cards, archivedCards, cardById } from '../data/cards'
import { collectionCardSlots } from './registry'
import { aggregateCollection, type SharedVariant } from './collectionSnapshot'
import { exportCollection, signCollection, verifyCollection } from './collectionCrypto'
import { collectionBase64, encodePayload, parseEnvelope } from './snapshotCodec'
import { collectionFileContents, readCollectionFile } from './collectionFile'
import { readTransferFile } from '../exchanges/transferFile'
import { parseSaveFile } from '../storage/saveTransfer'
import fixture from './fixtures/snapshot-v3.json'

const databases: BizaveDatabase[] = []
afterEach(async () => { await Promise.all(databases.splice(0).map(database => database.delete())); db.close() })
const variant: SharedVariant = { cardId: cards[0].id, finish: 'glossy', artVariant: 'fullArt', quantity: 256, favorite: true }
it.each(fixture.vectors)('lit le vecteur signé publié de mode $mode', async vector => {
  const contact = await parseContactCode('FR2.' + collectionBase64(new TextEncoder().encode(JSON.stringify({ version: 2, playerUuid: fixture.senderId, signingPublicJwk: fixture.publicJwk }))))
  const decoded = await verifyCollection(vector.code, [contact]), envelope = parseEnvelope(vector.code)
  expect(decoded).toMatchObject({ senderId: fixture.senderId, issuedAt: fixture.issuedAt, variants: fixture.expected })
  expect(Array.from(envelope.payload, byte => byte.toString(16).padStart(2, '0')).join('')).toBe(vector.payloadHex)
  expect(Array.from(envelope.signature, byte => byte.toString(16).padStart(2, '0')).join('')).toBe(vector.signatureHex)
})
async function setup() { const identity = await generateIdentity(); return { identity, friend: await parseContactCode(createContactCode(identity)) } }
it('choisit automatiquement le mode le plus court avant signature', async () => {
  const { identity, friend } = await setup()
  const sparse = await signCollection(identity, [variant], 1)
  expect(parseEnvelope(sparse).bodyMode).toBe(1)
  expect((await verifyCollection(sparse, [friend])).variants).toEqual([variant])
  const finishes = ['normal', 'glossy', 'alternative'] as const
  const variants = cards.flatMap(card => Array.from({ length: 6 }, (_, i): SharedVariant => ({ cardId: card.id, finish: finishes[i % 3], artVariant: i >= 3 ? 'fullArt' : 'standard', quantity: 1, favorite: i % 2 === 0 })))
  const dense = await signCollection(identity, variants, 1)
  expect(parseEnvelope(dense).bodyMode).toBe(0)
  expect((await verifyCollection(dense, [friend])).variants).toHaveLength(variants.length)
})
async function rawSigned(identity: Awaited<ReturnType<typeof generateIdentity>>, payload: Uint8Array) {
  const message = new Uint8Array([...new TextEncoder().encode('BizaveTCG/CollectionSnapshot/v3\n'), ...payload])
  const signature = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, identity.signingPrivateKey, message))
  return 'CL1.' + collectionBase64(new Uint8Array([...payload, ...signature]))
}
it('vérifie avec la clé épinglée et rejette une modification, autre clé ou contact absent', async () => {
  const { identity, friend } = await setup(), code = await signCollection(identity, [variant], 1)
  expect(await verifyCollection(code, [friend])).toMatchObject({ senderId: identity.playerUuid, issuedAt: 1, variants: [variant] })
  expect(code.length).toBeLessThan(1000)
  await expect(verifyCollection(code, [])).rejects.toThrow('Ajoutez')
  const other = await setup()
  await expect(verifyCollection(code, [{ ...other.friend, playerUuid: friend.playerUuid }])).rejects.toThrow('signature')
  const envelope = parseEnvelope(code); envelope.payload[envelope.payload.length - 1] ^= 1
  const tampered = 'CL1.' + collectionBase64(new Uint8Array([...envelope.payload, ...envelope.signature]))
  await expect(verifyCollection(tampered, [friend])).rejects.toThrow('signature')
})
it('vérifie la signature avant de décoder un corps invalide', async () => {
  const { identity, friend } = await setup(), envelope = parseEnvelope(await signCollection(identity, [], 1))
  envelope.payload[envelope.payload.length - 1] = 128
  const unsigned = 'CL1.' + collectionBase64(new Uint8Array([...envelope.payload, ...new Uint8Array(64)]))
  await expect(verifyCollection(unsigned, [friend])).rejects.toThrow('signature')
  await expect(verifyCollection(await rawSigned(identity, envelope.payload), [friend])).rejects.toThrow('malformé')
})
it('accepte les collections dépassant l’ancienne limite de 12 000 caractères', async () => {
  const { identity, friend } = await setup()
  const finishes = ['normal', 'glossy', 'alternative'] as const
  const variants = cards.flatMap(card => Array.from({ length: 6 }, (_, i): SharedVariant => ({ cardId: card.id, finish: finishes[i % 3], artVariant: i >= 3 ? 'fullArt' : 'standard', quantity: 20000, favorite: true })))
  const code = await signCollection(identity, variants, 1)
  expect(code.length).toBeGreaterThan(12000)
  expect((await verifyCollection(code, [friend])).variants).toHaveLength(variants.length)
})
it.each([0, 1] as const)('tolère un registre futur sans carte inconnue en mode %i', async bodyMode => {
  const { identity, friend } = await setup(), header = { senderId: identity.playerUuid, issuedAt: 1, registryVersion: 100, bodyMode, cardSlots: collectionCardSlots + 50 }
  const payload = encodePayload(header, [{ number: 1, variant: 5, quantity: 99, favorite: true }])
  const code = await rawSigned(identity, payload)
  expect((await verifyCollection(code, [friend])).variants).toMatchObject([{ cardId: cards[0].id, quantity: 99 }])
  const unknown = encodePayload(header, [{ number: collectionCardSlots + 25, variant: 0, quantity: 1, favorite: false }])
  await expect(verifyCollection(await rawSigned(identity, unknown), [friend])).rejects.toThrow('version plus récente')
})
it('conserve l’affichage des cartes retirées via le catalogue archivé', async () => {
  const { identity, friend } = await setup(), code = await signCollection(identity, [variant], 1), definition = cardById.get(variant.cardId)!
  // Retiring a model retains its definition in the global display registry.
  archivedCards.push(definition)
  try { expect((await verifyCollection(code, [friend])).variants[0].cardId).toBe(definition.id) } finally { archivedCards.pop() }
})
it('agrège uniquement owned, sans IDs/date, et l’export ne modifie aucune table', async () => {
  const database = new BizaveDatabase('collection-' + uuid()); databases.push(database)
  await initializeDatabase(database); await ensureIdentity(database)
  const drops = ['owned', 'owned', 'outgoing', 'recycled'].map(status => ({ dropId: uuid(), cardId: variant.cardId, finish: variant.finish, artVariant: variant.artVariant, status: status as 'owned', acquiredAt: 123, updatedAt: 456 }))
  const favorite = { cardId: variant.cardId, finish: variant.finish, artVariant: variant.artVariant, key: variantKey(variant) }
  await database.drops.bulkAdd(drops); await database.favorites.put(favorite)
  expect(aggregateCollection(drops, [favorite])).toEqual([{ ...variant, quantity: 2 }])
  const before = await Promise.all(database.tables.map(table => table.toArray()))
  const snapshot = await exportCollection(database)
  expect(snapshot.variants).toEqual([{ ...variant, quantity: 2 }])
  expect(await Promise.all(database.tables.map(table => table.toArray()))).toEqual(before)
  expect(DATABASE_SCHEMA_VERSION).toBe(13)
})
it('valide strictement le fichier et sépare collections, dons et sauvegardes', async () => {
  const { identity } = await setup(), code = await signCollection(identity, [variant]), contents = collectionFileContents(code)
  const file = new File([contents], 'collection.btcg')
  expect(await readCollectionFile(file)).toBe(code)
  await expect(readTransferFile(file)).rejects.toThrow()
  await expect(parseSaveFile(contents)).rejects.toThrow()
  for (const text of [JSON.stringify({ format: 'bizave-tcg-collection', version: 1, code, extra: true }), JSON.stringify({ format: 'bizave-tcg-save-transfer', version: 2, code }), 'null', '{']) await expect(readCollectionFile(new File([text], 'bad.btcg'))).rejects.toThrow()
  await expect(readCollectionFile(new File([contents], 'bad.json'))).rejects.toThrow()
  await expect(readCollectionFile(new File([' '.repeat(65537)], 'big.btcg'))).rejects.toThrow()
})
