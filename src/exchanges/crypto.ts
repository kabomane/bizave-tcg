import { cardById } from '../data/cards'
import { DEFAULT_ART_VARIANT_RATES, DEFAULT_FINISH_RATES } from '../game/config'
import { secureRandom, uuid } from '../game/engine'
import type { FriendContactRow, LocalIdentityRow, TransferPayload } from '../game/types'

const encoder = new TextEncoder()
const decoder = new TextDecoder('utf-8', { fatal: true })
export const PLAYER_UUID_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const MAX_CODE_LENGTH = 12_000
const signingAlgorithm = { name: 'ECDSA', namedCurve: 'P-256' }
const signatureAlgorithm = { name: 'ECDSA', hash: 'SHA-256' }
function subtle() {
  if (!globalThis.crypto?.subtle) throw new Error('Les échanges nécessitent une connexion HTTPS et Web Crypto.')
  return crypto.subtle
}
export function readableId() {
  const digits = Math.floor(secureRandom() * 100_000_000).toString().padStart(8, '0')
  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`
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
export function signingPublicKey(value: unknown): JsonWebKey {
  if (!record(value) || value.kty !== 'EC' || value.crv !== 'P-256' || typeof value.x !== 'string' || typeof value.y !== 'string' || unbase64url(value.x).length !== 32 || unbase64url(value.y).length !== 32 || value.d !== undefined || (value.alg !== undefined && value.alg !== 'ES256') || Object.keys(value).some(k => !['kty', 'crv', 'x', 'y', 'ext', 'key_ops', 'alg'].includes(k))) throw new Error('Clé publique de signature invalide.')
  return { kty: 'EC', crv: 'P-256', x: value.x, y: value.y, ext: true }
}
export async function signingFingerprint(value: unknown) {
  const key = signingPublicKey(value)
  await subtle().importKey('jwk', key, signingAlgorithm, false, ['verify'])
  const canonical = { kty: key.kty, crv: key.crv, x: key.x, y: key.y }
  return base64url(new Uint8Array(await subtle().digest('SHA-256', encoder.encode(JSON.stringify(canonical)))))
}
export async function generateIdentity(): Promise<LocalIdentityRow> {
  const s = subtle()
  const signing = await s.generateKey(signingAlgorithm, true, ['sign', 'verify'])
  return { id: 'local', playerUuid: readableId(), signingPrivateKey: signing.privateKey, signingPublicJwk: signingPublicKey(await s.exportKey('jwk', signing.publicKey)), createdAt: Date.now() }
}
export type PortableIdentity = Omit<LocalIdentityRow, 'signingPrivateKey'> & { signingPrivateJwk: JsonWebKey }
export async function portableIdentity(identity: LocalIdentityRow): Promise<PortableIdentity> {
  return { id: 'local', playerUuid: identity.playerUuid, signingPublicJwk: signingPublicKey(identity.signingPublicJwk), signingPrivateJwk: await subtle().exportKey('jwk', identity.signingPrivateKey), createdAt: identity.createdAt }
}
export async function importPortableIdentity(value: unknown): Promise<LocalIdentityRow> {
  if (!record(value) || value.id !== 'local' || typeof value.playerUuid !== 'string' || !PLAYER_UUID_PATTERN.test(value.playerUuid) || typeof value.createdAt !== 'number' || !Number.isSafeInteger(value.createdAt) || value.createdAt < 0 || !record(value.signingPrivateJwk) || Object.keys(value).sort().join(',') !== 'createdAt,id,playerUuid,signingPrivateJwk,signingPublicJwk') throw new Error('Identité de sauvegarde invalide.')
  const publicJwk = signingPublicKey(value.signingPublicJwk), privateJwk = value.signingPrivateJwk
  if (privateJwk.kty !== 'EC' || privateJwk.crv !== 'P-256' || privateJwk.x !== publicJwk.x || privateJwk.y !== publicJwk.y || typeof privateJwk.d !== 'string' || unbase64url(privateJwk.d).length !== 32 || (privateJwk.alg !== undefined && privateJwk.alg !== 'ES256') || Object.keys(privateJwk).some(k => !['kty', 'crv', 'x', 'y', 'd', 'ext', 'key_ops', 'alg'].includes(k))) throw new Error('Clé privée de sauvegarde invalide.')
  const s = subtle()
  const privateKey = await s.importKey('jwk', privateJwk, signingAlgorithm, true, ['sign'])
  const publicKey = await s.importKey('jwk', publicJwk, signingAlgorithm, false, ['verify'])
  const challenge = crypto.getRandomValues(new Uint8Array(32))
  const signature = await s.sign(signatureAlgorithm, privateKey, challenge)
  if (!await s.verify(signatureAlgorithm, publicKey, signature, challenge)) throw new Error('Les clés de sauvegarde ne correspondent pas.')
  return { id: 'local', playerUuid: value.playerUuid, signingPrivateKey: privateKey, signingPublicJwk: publicJwk, createdAt: value.createdAt }
}
export function createContactCode(identity: LocalIdentityRow) {
  return pack('FR2', { version: 2, playerUuid: identity.playerUuid, signingPublicJwk: signingPublicKey(identity.signingPublicJwk) })
}
export async function parseContactCode(code: string): Promise<FriendContactRow> {
  const data = unpack(code, 'FR2')
  if (!record(data) || data.version !== 2 || typeof data.playerUuid !== 'string' || !PLAYER_UUID_PATTERN.test(data.playerUuid) || Object.keys(data).sort().join(',') !== 'playerUuid,signingPublicJwk,version') throw new Error('Format du contact invalide.')
  const signingPublicJwk = signingPublicKey(data.signingPublicJwk)
  return { playerUuid: data.playerUuid, signingPublicJwk, fingerprint: await signingFingerprint(signingPublicJwk), addedAt: Date.now() }
}
export function canonicalPayload(payload: TransferPayload) {
  return encoder.encode('BizaveTCG/CardTransfer/v2\n' + JSON.stringify({ version: payload.version, transferId: payload.transferId, senderId: payload.senderId, recipientId: payload.recipientId, issuedAt: payload.issuedAt, dropId: payload.dropId, cardId: payload.cardId, finish: payload.finish, artVariant: payload.artVariant }))
}
export async function signTransfer(identity: LocalIdentityRow, friend: FriendContactRow, card: Pick<TransferPayload, 'dropId' | 'cardId' | 'finish' | 'artVariant'>) {
  if (identity.playerUuid === friend.playerUuid) throw new Error('Impossible de transférer une carte à vous-même.')
  const payload: TransferPayload = { dropId: card.dropId, cardId: card.cardId, finish: card.finish, artVariant: card.artVariant, version: 2, transferId: uuid(), senderId: identity.playerUuid, recipientId: friend.playerUuid, issuedAt: Date.now() }
  const signature = base64url(new Uint8Array(await subtle().sign(signatureAlgorithm, identity.signingPrivateKey, canonicalPayload(payload))))
  return { payload, code: pack('TR2', { payload, signature }) }
}
function validatePayload(data: unknown): TransferPayload {
  if (!record(data) || data.version !== 2 || typeof data.dropId !== 'string' || !uuidPattern.test(data.dropId) || typeof data.transferId !== 'string' || !uuidPattern.test(data.transferId) || typeof data.senderId !== 'string' || !PLAYER_UUID_PATTERN.test(data.senderId) || typeof data.recipientId !== 'string' || !PLAYER_UUID_PATTERN.test(data.recipientId) || typeof data.issuedAt !== 'number' || !Number.isSafeInteger(data.issuedAt) || data.issuedAt < 0 || typeof data.cardId !== 'string' || !cardById.has(data.cardId) || typeof data.finish !== 'string' || !Object.hasOwn(DEFAULT_FINISH_RATES, data.finish) || typeof data.artVariant !== 'string' || !Object.hasOwn(DEFAULT_ART_VARIANT_RATES, data.artVariant) || Object.keys(data).length !== 9) throw new Error('Le contenu de la carte est invalide.')
  return data as TransferPayload
}
export async function verifyTransfer(code: string, identity: LocalIdentityRow, friends: FriendContactRow[]): Promise<TransferPayload> {
  const signed = unpack(code, 'TR2')
  if (!record(signed) || typeof signed.signature !== 'string' || Object.keys(signed).sort().join(',') !== 'payload,signature') throw new Error('Signature absente ou invalide.')
  const payload = validatePayload(signed.payload)
  const friend = friends.find(contact => contact.playerUuid === payload.senderId)
  if (!friend) throw new Error('Ajoutez le contact de l’expéditeur avant de recevoir sa carte.')
  if (payload.recipientId !== identity.playerUuid || payload.senderId === payload.recipientId) throw new Error('Ce code est destiné à un autre joueur.')
  // Trust the pinned contact key, never a key supplied by the transfer itself.
  const key = await subtle().importKey('jwk', signingPublicKey(friend.signingPublicJwk), signingAlgorithm, false, ['verify'])
  const signature = unbase64url(signed.signature)
  if (signature.length !== 64 || !await subtle().verify(signatureAlgorithm, key, signature, canonicalPayload(payload))) throw new Error('La signature du transfert est invalide.')
  return payload
}
