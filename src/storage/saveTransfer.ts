import Dexie from 'dexie'
import { db, DATABASE_SCHEMA_VERSION, type BizaveDatabase } from './database'
import { assertAccountActive } from './accountGuard'
import { ensureIdentity } from '../exchanges/services'
import { base64url, unbase64url, PLAYER_UUID_PATTERN, generateIdentity, portableIdentity, importPortableIdentity, readableId, signingFingerprint, signingPublicKey } from '../exchanges/crypto'
import type { PortableIdentity } from '../exchanges/crypto'
import { ensureInstallation } from './installation'
import { uuid, variantKey, settleFreePackRecharge } from '../game/engine'
import { cards, archivedCards } from '../data/cards'
import { FREE_PACK_CAPACITY, FREE_PACK_INITIAL_STOCK, FREE_PACK_RECHARGE_MS } from '../game/config'
import { DEFAULT_PREFERENCES, parsePreferences } from '../settings/preferences'
import type { Preferences } from '../settings/preferences'
import type { BoosterPurchaseRow, BoosterStockRow, CardDefinition, CardDiscoveryRow, CardDropRow, FriendContactRow, OpenRecord, OutgoingTransferRow, PlayerStateRow, RecyclingRecord, UsedTransferRow } from '../game/types'
import type { UsedSaveTransferRow } from './accountTypes'
import type { UsedGiftCodeRow } from '../gifts/types'
import { GIFT_CODE_HASH_PATTERN } from '../gifts/format'

export const MAX_SAVE_FILE_BYTES = 25 * 1024 * 1024
const FORMAT = 'bizave-tcg-save-transfer'
const encoder = new TextEncoder()
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
export const SAVE_TABLES = ['player', 'drops', 'discoveries', 'openings', 'recycling', 'friends', 'outbox', 'usedTransfers', 'definitions', 'boosterStock', 'boosterPurchases', 'usedSaveTransfers', 'usedGiftCodes'] as const
type Snapshot = {
  player: PlayerStateRow[]; drops: CardDropRow[]; discoveries: CardDiscoveryRow[]; openings: OpenRecord[]
  recycling: RecyclingRecord[]; friends: FriendContactRow[]; outbox: OutgoingTransferRow[]; usedTransfers: UsedTransferRow[]
  definitions: CardDefinition[]; boosterStock: BoosterStockRow[]; boosterPurchases: BoosterPurchaseRow[]; usedSaveTransfers: UsedSaveTransferRow[]
  usedGiftCodes?: UsedGiftCodeRow[] // Schema 5 files predate gift codes.
}
export type SavePayload = { version: 2; schemaVersion: 5 | 6; transferId: string; sourceId: string; sourceInstallationId: string; recipientId: string; issuedAt: number; identity: PortableIdentity; preferences: Preferences; tables: Snapshot }
export type PreparedSave = { contents: string; payload: SavePayload }
export const canonicalSavePayload = (serialized: string) => encoder.encode('BizaveTCG/SaveTransfer/v2\n' + serialized)
function requireCrypto() {
  if (!globalThis.crypto?.subtle) throw new Error('Le transfert de sauvegarde nécessite HTTPS et Web Crypto.')
  return crypto.subtle
}
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) }
const integer = (value: unknown): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0
const text = (value: unknown): value is string => typeof value === 'string' && value.length <= 16_384
const id = (value: unknown): value is string => typeof value === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(value)
const playerId = (value: unknown): value is string => typeof value === 'string' && PLAYER_UUID_PATTERN.test(value)
const transferId = (value: unknown): value is string => typeof value === 'string' && uuidPattern.test(value)
function assert(condition: unknown): asserts condition { if (!condition) throw new Error('Le contenu de cette sauvegarde est invalide ou incompatible.') }
function validatePayload(value: unknown): asserts value is SavePayload {
  assert(record(value) && value.version === 2 && (value.schemaVersion === 5 || value.schemaVersion === DATABASE_SCHEMA_VERSION) && transferId(value.transferId) && playerId(value.sourceId) && playerId(value.sourceInstallationId) && playerId(value.recipientId) && value.sourceInstallationId !== value.recipientId && integer(value.issuedAt) && record(value.identity) && value.identity.playerUuid === value.sourceId && record(value.tables) && record(value.preferences))
  assert(Object.keys(value).sort().join(',') === 'identity,issuedAt,preferences,recipientId,schemaVersion,sourceId,sourceInstallationId,tables,transferId,version')
  const tables = value.tables
  const tableNames = value.schemaVersion === 5 ? SAVE_TABLES.filter(name => name !== 'usedGiftCodes') : SAVE_TABLES
  assert(Object.keys(tables).sort().join(',') === [...tableNames].sort().join(','))
  const primaryKeys: Record<typeof SAVE_TABLES[number], string> = { player: 'id', drops: 'dropId', discoveries: 'key', openings: 'id', recycling: 'id', friends: 'playerUuid', outbox: 'transferId', usedTransfers: 'transferId', definitions: 'id', boosterStock: 'boosterId', boosterPurchases: 'id', usedSaveTransfers: 'transferId', usedGiftCodes: 'codeHash' }
  for (const name of tableNames) {
    const rows = tables[name]
    assert(Array.isArray(rows) && rows.length <= 100_000 && rows.every(record))
    assert(rows.every(row => text(row[primaryKeys[name]])) && new Set(rows.map(row => row[primaryKeys[name]])).size === rows.length)
  }
  // Check row structures before passing data to Dexie or the game engine.
  const s = tables as unknown as Snapshot
  assert(s.player.length === 1)
  const player = s.player[0]
  assert(player.id === 'local' && integer(player.fragments) && integer(player.maxObservedClockAt) && player.schemaVersion === value.schemaVersion && integer(player.freePackStock) && player.freePackStock <= FREE_PACK_CAPACITY && (player.nextFreePackAt === null || integer(player.nextFreePackAt)))
  settleFreePackRecharge(player, player.maxObservedClockAt)
  assert(s.definitions.length > 0 && s.definitions.every(c => id(c.id) && text(c.title) && text(c.description) && id(c.collectionId) && ['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(c.rarity) && record(c.artwork) && Object.values(c.artwork).length === 2 && ['standard', 'fullArt'].every(k => typeof c.artwork[k as 'standard'] === 'string' && /^\/assets\/cards\/[a-z0-9/-]+\/[a-zA-Z0-9.-]+$/.test(c.artwork[k as 'standard'])) && (c.weight === undefined || (Number.isFinite(c.weight) && c.weight > 0)) && (c.artworkPosition === undefined || (record(c.artworkPosition) && Object.values(c.artworkPosition).every(text)))))
  const definitions = new Map(s.definitions.map(c => [c.id, c]))
  for (const current of [...cards, ...archivedCards]) assert(!definitions.has(current.id) || definitions.get(current.id)!.rarity === current.rarity)
  const card = (c: { cardId: string; finish: string; artVariant: string }) => text(c.cardId) && definitions.has(c.cardId) && ['normal', 'glossy', 'alternative'].includes(c.finish) && ['standard', 'fullArt'].includes(c.artVariant)
  assert(s.drops.every(c => card(c) && transferId(c.dropId) && ['owned', 'outgoing', 'recycled'].includes(c.status) && integer(c.acquiredAt) && integer(c.updatedAt)))
  assert(s.discoveries.every(c => card(c) && c.key === variantKey(c) && integer(c.firstDiscoveredAt)))
  assert(s.openings.every(o => transferId(o.id) && id(o.boosterId) && (o.boosterTitle === undefined || text(o.boosterTitle)) && integer(o.openedAt) && ['free', 'fragments', 'shop'].includes(o.payment) && integer(o.fragmentsSpent) && typeof o.revealComplete === 'boolean' && Array.isArray(o.results) && o.results.length > 0 && o.results.length <= 100 && o.results.every(c => record(c) && card(c) && transferId(c.dropId)) && integer(o.revealedCount) && o.revealedCount <= o.results.length))
  assert(s.openings.filter(o => !o.revealComplete).length <= 1)
  assert(s.recycling.every(r => transferId(r.id) && integer(r.createdAt) && integer(r.fragmentsGained) && Array.isArray(r.dropIds) && r.dropIds.every(transferId)))
  assert(s.friends.every(f => playerId(f.playerUuid) && f.playerUuid !== value.sourceId && record(f.signingPublicJwk) && text(f.fingerprint) && integer(f.addedAt) && (f.label === undefined || (text(f.label) && f.label.length <= 80)) && !('encryptionPublicJwk' in f)))
  assert(s.outbox.every(o => transferId(o.transferId) && transferId(o.dropId) && playerId(o.recipientId) && text(o.code) && /^TR2\.[A-Za-z0-9_-]+$/.test(o.code) && o.code.length <= 12_000 && integer(o.createdAt) && o.status === 'generated' && (o.recipientLabel === undefined || text(o.recipientLabel))))
  assert([...s.usedTransfers, ...s.usedSaveTransfers].every(r => transferId(r.transferId) && integer(r.receivedAt)))
  assert(s.boosterStock.every(r => id(r.boosterId) && integer(r.quantity) && integer(r.updatedAt)))
  assert(s.boosterPurchases.every(r => transferId(r.id) && id(r.boosterId) && text(r.boosterTitle) && integer(r.unitPrice) && r.unitPrice > 0 && integer(r.fragmentsSpent) && integer(r.createdAt)))
  assert((s.usedGiftCodes ?? []).every(r => typeof r.codeHash === 'string' && GIFT_CODE_HASH_PATTERN.test(r.codeHash) && integer(r.redeemedAt)))
}

export async function parseSaveFile(contents: string): Promise<PreparedSave> {
  if (encoder.encode(contents).byteLength > MAX_SAVE_FILE_BYTES) throw new Error('Cette sauvegarde dépasse la limite de 25 Mo.')
  let envelope: unknown
  try { envelope = JSON.parse(contents) } catch { throw new Error('Ce fichier .btcg est illisible.') }
  if (!record(envelope) || envelope.format !== FORMAT || envelope.version !== 2 || typeof envelope.payload !== 'string' || typeof envelope.signature !== 'string' || !record(envelope.publicKey) || Object.keys(envelope).sort().join(',') !== 'format,payload,publicKey,signature,version') throw new Error('Choisissez un fichier de transfert de sauvegarde .btcg, pas un transfert de carte.')
  const jwk = signingPublicKey(envelope.publicKey)
  const subtle = requireCrypto()
  const key = await subtle.importKey('jwk', { kty: 'EC', crv: 'P-256', x: jwk.x, y: jwk.y }, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
  if (!await subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, unbase64url(envelope.signature), canonicalSavePayload(envelope.payload))) throw new Error('La signature de la sauvegarde est invalide.')
  let payload: unknown
  try { payload = JSON.parse(envelope.payload) } catch { throw new Error('Le contenu de cette sauvegarde est illisible.') }
  validatePayload(payload)
  const identity = await importPortableIdentity(payload.identity)
  assert(await signingFingerprint(identity.signingPublicJwk) === await signingFingerprint(jwk))
  for (const friend of payload.tables.friends) {
    assert(await signingFingerprint(friend.signingPublicJwk) === friend.fingerprint)
  }
  return { contents, payload }
}

export async function readSaveFile(file: File) {
  if (!/\.btcg$/i.test(file.name)) throw new Error('Choisissez un fichier .btcg.')
  if (file.size > MAX_SAVE_FILE_BYTES) throw new Error('Cette sauvegarde dépasse la limite de 25 Mo.')
  return parseSaveFile(await file.text())
}

export async function exportSave(recipientId: string, preferences: Preferences, database = db) {
  if (!PLAYER_UUID_PATTERN.test(recipientId)) throw new Error('Saisissez un ID au format 1234-56-78.')
  const identity = await ensureIdentity(database)
  const installation = await ensureInstallation(database)
  if (installation.installationId === recipientId) throw new Error('Choisissez l’ID de l’autre appareil, différent du vôtre.')
  const subtle = requireCrypto()
  return database.transaction('rw', database.tables, async () => {
    await assertAccountActive(database)
    if ((await database.identity.get('local'))?.playerUuid !== identity.playerUuid || (await database.installation.get('local'))?.installationId !== installation.installationId) throw new Error('L’identité locale a changé. Réessayez.')
    const tables = Object.fromEntries(await Promise.all(SAVE_TABLES.map(async name => [name, await database.table(name).toArray()]))) as Snapshot
    const portable = await Dexie.waitFor(portableIdentity(identity))
    const payload: SavePayload = { version: 2, schemaVersion: DATABASE_SCHEMA_VERSION, transferId: uuid(), sourceId: identity.playerUuid, sourceInstallationId: installation.installationId, recipientId, issuedAt: Date.now(), identity: portable, preferences: parsePreferences(JSON.stringify(preferences)), tables }
    validatePayload(payload)
    const serialized = JSON.stringify(payload)
    // Keep this single transaction alive during Web Crypto. No source write can be lost.
    const signature = await Dexie.waitFor(subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, identity.signingPrivateKey, canonicalSavePayload(serialized)))
    const contents = JSON.stringify({ format: FORMAT, version: 2, payload: serialized, publicKey: identity.signingPublicJwk, signature: base64url(new Uint8Array(signature)) })
    if (encoder.encode(contents).byteLength > MAX_SAVE_FILE_BYTES) throw new Error('Cette sauvegarde dépasse la limite de 25 Mo. La partie est conservée.')
    // Verify that the generated file can be read before deleting the only playable copy.
    await Dexie.waitFor(parseSaveFile(contents))
    // Persist the downloadable file and erase all playable data atomically.
    for (const table of database.tables) await table.clear()
    await database.accountState.put({ id: 'local', status: 'exported', transferId: payload.transferId, recipientId, file: contents })
    return contents
  })
}

export async function importSave(contents: string, database = db) {
  // Always verify again at commit time; previews are not trusted input.
  const { payload } = await parseSaveFile(contents)
  const installation = await ensureInstallation(database)
  const identity = await importPortableIdentity(payload.identity)
  return database.transaction('rw', database.tables, async () => {
    await assertAccountActive(database)
    if ((await database.installation.get('local'))?.installationId !== installation.installationId || installation.installationId !== payload.recipientId) throw new Error('Cette sauvegarde est destinée à un autre appareil.')
    if (await database.usedSaveTransfers.get(payload.transferId)) throw new Error('Cette sauvegarde a déjà été importée.')
    const previousSaves = await database.usedSaveTransfers.toArray(), previousCards = await database.usedTransfers.toArray(), previousGifts = await database.usedGiftCodes.toArray()
    for (const name of SAVE_TABLES) { await database.table(name).clear(); await database.table(name).bulkPut(payload.tables[name] ?? []) }
    // Preserve both histories, then record this import in the same transaction.
    for (const row of previousSaves) if (!await database.usedSaveTransfers.get(row.transferId)) await database.usedSaveTransfers.add(row)
    for (const row of previousCards) if (!await database.usedTransfers.get(row.transferId)) await database.usedTransfers.add(row)
    for (const row of previousGifts) if (!await database.usedGiftCodes.get(row.codeHash)) await database.usedGiftCodes.add(row)
    await database.player.update('local', { schemaVersion: DATABASE_SCHEMA_VERSION })
    await database.usedSaveTransfers.add({ transferId: payload.transferId, receivedAt: Date.now() })
    await database.identity.put(identity)
    await database.accountState.put({ id: 'local', status: 'active', preferences: parsePreferences(JSON.stringify(payload.preferences)) })
  })
}

export async function deleteAccount(database: BizaveDatabase = db) {
  const previous = await database.identity.get('local')
  const previousInstallation = await database.installation.get('local')
  let identity = await generateIdentity()
  while (identity.playerUuid === previous?.playerUuid) identity = await generateIdentity()
  let installationId = readableId()
  while (installationId === previousInstallation?.installationId || installationId === identity.playerUuid) installationId = readableId()
  const now = Date.now()
  await database.transaction('rw', database.tables, async () => {
    for (const table of database.tables) await table.clear()
    await database.identity.add(identity)
    await database.installation.add({ id: 'local', installationId, createdAt: now })
    await database.player.add({ id: 'local', schemaVersion: DATABASE_SCHEMA_VERSION, fragments: 0, freePackStock: FREE_PACK_INITIAL_STOCK, nextFreePackAt: FREE_PACK_INITIAL_STOCK < FREE_PACK_CAPACITY ? now + FREE_PACK_RECHARGE_MS : null, maxObservedClockAt: now })
    await database.definitions.bulkPut([...cards, ...archivedCards])
    await database.accountState.put({ id: 'local', status: 'active', preferences: { ...DEFAULT_PREFERENCES } })
  })
}

export function downloadSaveFile(contents: string, transferId: string) {
  const url = URL.createObjectURL(new Blob([contents], { type: 'application/octet-stream' }))
  const link = document.createElement('a')
  link.href = url; link.download = `bizave-sauvegarde-${transferId.replace(/[^a-zA-Z0-9-]/g, '')}.btcg`
  document.body.append(link)
  try { link.click() } finally { link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 60_000) }
}
