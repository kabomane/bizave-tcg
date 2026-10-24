import { cardById } from '../data/cards'
import { DEFAULT_ART_VARIANT_RATES, DEFAULT_FINISH_RATES } from '../game/config'
import { secureRandom, uuid } from '../game/engine'
import type { FriendContactRow, LocalIdentityRow, TransferPayload } from '../game/types'

const encoder = new TextEncoder()
const decoder = new TextDecoder('utf-8', { fatal: true })
export const PLAYER_UUID_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_CODE_LENGTH = 12_000
function subtle() {
  if (!globalThis.crypto?.subtle) throw new Error('Les échanges nécessitent une connexion HTTPS et Web Crypto.')
  return crypto.subtle
}
export function base64url(bytes: Uint8Array): string { return btoa(String.fromCharCode(...bytes)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '') }
export function unbase64url(value: string): Uint8Array<ArrayBuffer> {
  if (!/^[A-Za-z0-9_-]+$/.test(value) || value.length > MAX_CODE_LENGTH) throw new Error('Code invalide.')
  const bytes = Uint8Array.from(atob(value.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - value.length % 4) % 4)), c => c.charCodeAt(0))
  if (base64url(bytes) !== value) throw new Error('Encodage du code invalide.')
  return bytes
}
function pack(prefix: string, value: unknown) { return `${prefix}.${base64url(encoder.encode(JSON.stringify(value)))}` }
function unpack(code: string, prefix: string): unknown {
  const text = code.trim()
  if (text.length > MAX_CODE_LENGTH || !text.startsWith(`${prefix}.`)) throw new Error(`Code ${prefix} invalide.`)
  try { return JSON.parse(decoder.decode(unbase64url(text.slice(prefix.length + 1)))) } catch { throw new Error('Code malformé ou corrompu.') }
}
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === 'object' && !Array.isArray(value) }
function publicKey(value: unknown): JsonWebKey {
  if (!record(value) || value.kty !== 'EC' || value.crv !== 'P-256' || typeof value.x !== 'string' || typeof value.y !== 'string' || unbase64url(value.x).length !== 32 || unbase64url(value.y).length !== 32 || value.d !== undefined || Object.keys(value).some(k => !['kty', 'crv', 'x', 'y', 'ext', 'key_ops'].includes(k))) throw new Error('Clé publique de contact invalide.')
  return { kty: 'EC', crv: 'P-256', x: value.x, y: value.y, ext: true }
}
export const canonicalKey = (key: JsonWebKey) => ({ kty: key.kty, crv: key.crv, x: key.x, y: key.y })
export async function generateIdentity(): Promise<LocalIdentityRow> {
  const s = subtle()
  const signing = await s.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, false, ['sign', 'verify'])
  const encryption = await s.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, false, ['deriveBits'])
  const digits = Math.floor(secureRandom() * 100_000_000).toString().padStart(8, '0')
  return { id: 'local', playerUuid: `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`, signingPrivateKey: signing.privateKey, encryptionPrivateKey: encryption.privateKey, signingPublicJwk: await s.exportKey('jwk', signing.publicKey), encryptionPublicJwk: await s.exportKey('jwk', encryption.publicKey), createdAt: Date.now() }
}
export function createContactCode(identity: LocalIdentityRow) {
  return pack('FR1', { version: 1, playerUuid: identity.playerUuid, signingPublicJwk: canonicalKey(identity.signingPublicJwk), encryptionPublicJwk: canonicalKey(identity.encryptionPublicJwk) })
}
export async function parseContactCode(code: string): Promise<FriendContactRow> {
  const data = unpack(code, 'FR1')
  if (!record(data) || data.version !== 1 || typeof data.playerUuid !== 'string' || !PLAYER_UUID_PATTERN.test(data.playerUuid) || Object.keys(data).sort().join(',') !== 'encryptionPublicJwk,playerUuid,signingPublicJwk,version') throw new Error('Format du contact invalide.')
  const signingPublicJwk = publicKey(data.signingPublicJwk), encryptionPublicJwk = publicKey(data.encryptionPublicJwk)
  const s = subtle()
  await s.importKey('jwk', signingPublicJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
  await s.importKey('jwk', encryptionPublicJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const hash = await s.digest('SHA-256', encoder.encode(JSON.stringify([canonicalKey(signingPublicJwk), canonicalKey(encryptionPublicJwk)])))
  return { playerUuid: data.playerUuid, signingPublicJwk, encryptionPublicJwk, fingerprint: base64url(new Uint8Array(hash)), addedAt: Date.now() }
}
export function canonicalPayload(payload: TransferPayload) {
  return encoder.encode(JSON.stringify({ version: payload.version, transferId: payload.transferId, senderId: payload.senderId, recipientId: payload.recipientId, issuedAt: payload.issuedAt, dropId: payload.dropId, cardId: payload.cardId, finish: payload.finish, artVariant: payload.artVariant }))
}
async function sharedKey(identity: LocalIdentityRow, friend: FriendContactRow, salt: Uint8Array<ArrayBuffer>) {
  const s = subtle()
  const publicKey = await s.importKey('jwk', friend.encryptionPublicJwk, { name: 'ECDH', namedCurve: 'P-256' }, false, [])
  const bits = await s.deriveBits({ name: 'ECDH', public: publicKey }, identity.encryptionPrivateKey, 256)
  const material = await s.importKey('raw', bits, 'HKDF', false, ['deriveKey'])
  return s.deriveKey({ name: 'HKDF', hash: 'SHA-256', salt, info: encoder.encode('BizaveTCG/TR1/ECDH-HKDF-AESGCM') }, material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
}
export async function encryptTransfer(identity: LocalIdentityRow, friend: FriendContactRow, card: Pick<TransferPayload, 'dropId' | 'cardId' | 'finish' | 'artVariant'>) {
  if (identity.playerUuid === friend.playerUuid) throw new Error('Impossible de transférer une carte à vous-même.')
  const payload: TransferPayload = { dropId: card.dropId, cardId: card.cardId, finish: card.finish, artVariant: card.artVariant, version: 1, transferId: uuid(), senderId: identity.playerUuid, recipientId: friend.playerUuid, issuedAt: Date.now() }
  const s = subtle()
  const signature = base64url(new Uint8Array(await s.sign({ name: 'ECDSA', hash: 'SHA-256' }, identity.signingPrivateKey, canonicalPayload(payload))))
  const salt = crypto.getRandomValues(new Uint8Array(32)), iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await sharedKey(identity, friend, salt)
  const ciphertext = await s.encrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode('TR1') }, key, encoder.encode(JSON.stringify({ payload, signature })))
  return { payload, code: pack('TR1', { version: 1, salt: base64url(salt), iv: base64url(iv), ciphertext: base64url(new Uint8Array(ciphertext)) }) }
}
function validatePayload(data: unknown): TransferPayload {
  if (!record(data) || data.version !== 1 || typeof data.dropId !== 'string' || !uuidPattern.test(data.dropId) || typeof data.transferId !== 'string' || !uuidPattern.test(data.transferId) || typeof data.senderId !== 'string' || !PLAYER_UUID_PATTERN.test(data.senderId) || typeof data.recipientId !== 'string' || !PLAYER_UUID_PATTERN.test(data.recipientId) || typeof data.issuedAt !== 'number' || !Number.isSafeInteger(data.issuedAt) || data.issuedAt < 0 || typeof data.cardId !== 'string' || !cardById.has(data.cardId) || typeof data.finish !== 'string' || !Object.hasOwn(DEFAULT_FINISH_RATES, data.finish) || typeof data.artVariant !== 'string' || !Object.hasOwn(DEFAULT_ART_VARIANT_RATES, data.artVariant) || Object.keys(data).length !== 9) throw new Error('Le contenu de la carte est invalide.')
  return data as TransferPayload
}
export async function decryptTransfer(code: string, identity: LocalIdentityRow, friends: FriendContactRow[]): Promise<TransferPayload> {
  const envelope = unpack(code, 'TR1')
  if (!record(envelope) || envelope.version !== 1 || typeof envelope.salt !== 'string' || typeof envelope.iv !== 'string' || typeof envelope.ciphertext !== 'string' || Object.keys(envelope).sort().join(',') !== 'ciphertext,iv,salt,version') throw new Error('Format du transfert invalide.')
  const salt = unbase64url(envelope.salt), iv = unbase64url(envelope.iv), ciphertext = unbase64url(envelope.ciphertext)
  if (salt.length !== 32 || iv.length !== 12 || ciphertext.length < 16 || ciphertext.length > 8000) throw new Error('Taille du transfert invalide.')
  if (!friends.length) throw new Error('Ajoutez le contact de l’expéditeur avant de recevoir sa carte.')
  const s = subtle()
  for (const friend of friends) {
    let bytes: ArrayBuffer
    try {
      const key = await sharedKey(identity, friend, salt)
      bytes = await s.decrypt({ name: 'AES-GCM', iv, additionalData: encoder.encode('TR1') }, key, ciphertext)
    } catch { continue }
    let signed: unknown
    try { signed = JSON.parse(decoder.decode(bytes)) } catch { throw new Error('Contenu du transfert invalide.') }
    if (!record(signed) || typeof signed.signature !== 'string' || Object.keys(signed).sort().join(',') !== 'payload,signature') throw new Error('Signature absente ou invalide.')
    const payload = validatePayload(signed.payload)
    if (payload.senderId !== friend.playerUuid || payload.recipientId !== identity.playerUuid || payload.senderId === payload.recipientId) throw new Error('Ce code n’est pas destiné à ce joueur.')
    const key = await s.importKey('jwk', friend.signingPublicJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
    if (!await s.verify({ name: 'ECDSA', hash: 'SHA-256' }, key, unbase64url(signed.signature), canonicalPayload(payload))) throw new Error('La signature du transfert est invalide.')
    return payload
  }
  throw new Error('Code invalide, destiné à un autre joueur ou contact de l’expéditeur manquant.')
}
