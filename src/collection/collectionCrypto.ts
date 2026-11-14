import { db, type BizaveDatabase } from '../storage/database'
import { readCollectionMemory, type CollectionMemory, type MemoryDecision } from './collectionMemory'
import { assertAccountActive } from '../storage/accountGuard'
import { ensureIdentity } from '../exchanges/services'
import { signingPublicKey } from '../exchanges/crypto'
import type { FriendContactRow, LocalIdentityRow } from '../game/types'
import { aggregateCollection, fromNumericVariants, toNumericVariants } from './collectionSnapshot'
import type { SharedVariant } from './collectionSnapshot'
import { collectionCardSlots, collectionRegistryVersion } from './registry'
import { COLLECTION_LIMITS, collectionBase64, decodeBody, encodePayload, parseEnvelope } from './snapshotCodec'

const domain = new TextEncoder().encode('BizaveTCG/CollectionSnapshot/v3\n')
function message(payload: Uint8Array) { return new Uint8Array([...domain, ...payload]) }
function subtle() { if (!globalThis.crypto?.subtle) throw new Error('Le partage de collection nécessite HTTPS et Web Crypto.'); return crypto.subtle }
export type VerifiedCollection = { code: string; senderId: string; issuedAt: number; variants: SharedVariant[] }
export async function signCollection(identity: LocalIdentityRow, variants: readonly SharedVariant[], issuedAt = Math.floor(Date.now() / 1000)) {
  const entries = toNumericVariants(variants)
  const header = { senderId: identity.playerUuid, issuedAt, registryVersion: collectionRegistryVersion, cardSlots: collectionCardSlots }
  const bitmap = encodePayload({ ...header, bodyMode: 0 }, entries)
  const sparse = encodePayload({ ...header, bodyMode: 1 }, entries)
  const payload = sparse.length < bitmap.length ? sparse : bitmap
  const signature = new Uint8Array(await subtle().sign({ name: 'ECDSA', hash: 'SHA-256' }, identity.signingPrivateKey, message(payload)))
  if (signature.length !== 64) throw new Error('Signature inattendue.')
  const code = 'CL1.' + collectionBase64(new Uint8Array([...payload, ...signature]))
  if (code.length > COLLECTION_LIMITS.text) throw new Error('Cette collection dépasse la taille maximale de partage.')
  return code
}
export async function verifyCollection(code: string, friends: readonly FriendContactRow[]): Promise<VerifiedCollection> {
  const envelope = parseEnvelope(code)
  const friend = friends.find(row => row.playerUuid === envelope.senderId)
  if (!friend) throw new Error('Ajoutez d’abord cet ami pour vérifier sa collection.')
  const key = await subtle().importKey('jwk', signingPublicKey(friend.signingPublicJwk), { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
  if (!await subtle().verify({ name: 'ECDSA', hash: 'SHA-256' }, key, envelope.signature, message(envelope.payload))) throw new Error('Impossible de vérifier la signature de cette collection.')
  const variants = fromNumericVariants(decodeBody(envelope.body, envelope.cardSlots, envelope.bodyMode))
  return { code, senderId: envelope.senderId, issuedAt: envelope.issuedAt, variants }
}
export async function exportCollection(database: BizaveDatabase = db) {
  const identity = await ensureIdentity(database)
  const variants = await database.transaction('r', [database.drops, database.favorites, database.identity, database.accountState], async () => {
    await assertAccountActive(database)
    if ((await database.identity.get('local'))?.playerUuid !== identity.playerUuid) throw new Error('L’identité locale a changé. Réessayez.')
    return aggregateCollection(await database.drops.where('status').equals('owned').toArray(), await database.favorites.toArray())
  })
  const issuedAt = Math.floor(Date.now() / 1000), code = await signCollection(identity, variants, issuedAt)
  return { code, senderId: identity.playerUuid, issuedAt, variants }
}
export async function readCollection(code: string, database: BizaveDatabase = db) {
  await assertAccountActive(database)
  const result = await verifyCollection(code, await database.friends.toArray())
  const friend = await database.friends.get(result.senderId)
  // Revalidate against the current pinned key if a contact changed while crypto ran.
  return verifyCollection(result.code, friend ? [friend] : [])
}

export async function memoryDecision(snapshot: VerifiedCollection, friends: readonly FriendContactRow[], storage?: Storage): Promise<MemoryDecision> {
  let memory: CollectionMemory | null
  try { memory = readCollectionMemory(snapshot.senderId, storage) } catch { return 'invalid' }
  if (!memory) return 'new'
  let previous: VerifiedCollection
  try {
    previous = await verifyCollection(memory.code, friends)
    if (previous.senderId !== snapshot.senderId) return 'invalid'
  } catch { return 'invalid' }
  if (memory.code === snapshot.code || previous.issuedAt === snapshot.issuedAt && JSON.stringify(previous.variants) === JSON.stringify(snapshot.variants)) return 'identical'
  return snapshot.issuedAt > previous.issuedAt ? 'newer' : snapshot.issuedAt < previous.issuedAt ? 'older' : 'sameTime'
}
