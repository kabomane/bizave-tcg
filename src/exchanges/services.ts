import { db, type BizaveDatabase } from '../storage/database'
import { discover } from '../storage/services'
import { createContactCode, verifyTransfer, signTransfer, generateIdentity, parseContactCode, signFragmentTransfer, verifyFragmentTransfer, MAX_FRAGMENT_TRANSFER } from './crypto'
import type { Card, LocalIdentityRow } from '../game/types'
import { assertAccountActive } from '../storage/accountGuard'
import { pruneFavorites } from '../collection/favorites'
import { assertTransferNotExpired } from './expiry'

export async function ensureIdentity(database = db) {
  await assertAccountActive(database)
  const existing = await database.identity.get('local')
  if (existing) return existing
  // A missing identity after prior transfers indicates lost keys, never silently regenerate.
  if (await database.outbox.count() || await database.usedTransfers.count() || await database.friends.count() || await database.drops.where('status').equals('outgoing').count()) throw new Error('Les clés locales ont été perdues. Les anciens échanges ne peuvent pas être restaurés.')
  let generated = await generateIdentity()
  const installationId = (await database.installation.get('local'))?.installationId
  while (generated.playerUuid === installationId) generated = await generateIdentity()
  return database.transaction('rw', [database.identity, database.friends, database.accountState], async () => {
    await assertAccountActive(database)
    const current = await database.identity.get('local')
    if (current) return current
    if (await database.friends.get(generated.playerUuid)) throw new Error('Collision d’identifiant joueur. Réessayez.')
    await database.identity.add(generated)
    return generated
  })
}
export async function ownContact(database = db) { return createContactCode(await ensureIdentity(database)) }
export async function addContact(code: string, label = '', database = db) {
  const identity = await ensureIdentity(database), friend = await parseContactCode(code)
  if (friend.playerUuid === identity.playerUuid) throw new Error('Vous ne pouvez pas vous ajouter vous-même.')
  return database.transaction('rw', [database.friends, database.identity, database.accountState], async () => {
    await assertAccountActive(database)
    if ((await database.identity.get('local'))?.playerUuid !== identity.playerUuid) throw new Error('L’identité locale a changé.')
    const existing = await database.friends.get(friend.playerUuid)
    if (existing && existing.fingerprint !== friend.fingerprint) throw new Error('Conflit : cet identifiant est associé à d’autres clés.')
    if (!existing) await database.friends.add({ ...friend, label: label.trim().slice(0, 80) })
    return existing ?? friend
  })
}
export async function sendTransfer(dropId: string, friendId: string, database = db) {
  const identity = await ensureIdentity(database), friend = await database.friends.get(friendId), drop = await database.drops.get(dropId)
  if (!friend) throw new Error('Le contact du destinataire est introuvable.')
  if (!drop || drop.status !== 'owned') throw new Error('Cette carte n’est plus disponible.')
  const { payload, code } = await signTransfer(identity, friend, drop)
  const row = { kind: 'card' as const, transferId: payload.transferId, dropId, recipientId: friendId, code, recipientLabel: friend.label, createdAt: Date.now(), status: 'generated' as const }
  await database.transaction('rw', [database.drops, database.outbox, database.identity, database.friends, database.accountState, database.favorites], async () => {
    await assertAccountActive(database)
    const current = await database.drops.get(dropId)
    const currentFriend = await database.friends.get(friendId)
    const currentIdentity = await database.identity.get('local')
    if (currentFriend?.fingerprint !== friend.fingerprint || currentIdentity?.playerUuid !== identity.playerUuid) throw new Error('Le contact ou l’identité a changé pendant le transfert.')
    if (!current || current.status !== 'owned' || current.cardId !== drop.cardId || current.finish !== drop.finish || current.artVariant !== drop.artVariant) throw new Error('La carte a déjà été envoyée ou recyclée.')
    await database.drops.update(dropId, { status: 'outgoing', updatedAt: row.createdAt, circulation: 'exchanged' })
    await pruneFavorites(database)
    await database.outbox.add(row)
  })
  return row
}
export async function receiveTransfer(code: string, database: BizaveDatabase = db) {
  const identity = await ensureIdentity(database)
  const payload = await verifyTransfer(code, identity, await database.friends.toArray())
  return database.transaction('rw', [database.player, database.drops, database.recycledCards, database.discoveries, database.usedTransfers, database.identity, database.accountState], async () => {
    await assertAccountActive(database)
    if ((await database.identity.get('local'))?.playerUuid !== identity.playerUuid) throw new Error('L’identité locale a changé.')
    if (await database.usedTransfers.get(payload.transferId)) throw new Error('Ce code a déjà été utilisé.')
    if (await database.recycledCards.get(payload.dropId)) throw new Error('Cet exemplaire a été recyclé et ne peut pas revenir.')
    const existing = await database.drops.get(payload.dropId)
    if (existing?.status === 'owned') throw new Error('Cet exemplaire est déjà dans votre collection.')
    if (existing?.status === 'recycled') throw new Error('Cet exemplaire a été recyclé et ne peut pas revenir.')
    if (existing && (existing.cardId !== payload.cardId || existing.finish !== payload.finish || existing.artVariant !== payload.artVariant)) throw new Error('Les caractéristiques de la carte ont été altérées.')
    const player = await database.player.get('local')
    const now = Math.max(Date.now(), player?.maxObservedClockAt ?? 0)
    assertTransferNotExpired(payload.issuedAt, now)
    const card = { dropId: payload.dropId, cardId: payload.cardId, finish: payload.finish, artVariant: payload.artVariant }
    await database.drops.put({ ...card, status: 'owned', acquiredAt: existing?.acquiredAt ?? now, updatedAt: now, circulation: 'exchanged' })
    await discover(database, card, now)
    await database.usedTransfers.add({ transferId: payload.transferId, receivedAt: now })
    if (player) await database.player.update('local', { maxObservedClockAt: now })
    return card
  })
}

export async function sendFragments(amount: number, friendId: string, database = db) {
  if (!Number.isSafeInteger(amount) || amount < 1 || amount > MAX_FRAGMENT_TRANSFER) throw new Error('Le montant du transfert est invalide.')
  const identity = await ensureIdentity(database), friend = await database.friends.get(friendId)
  if (!friend) throw new Error('Le contact du destinataire est introuvable.')
  const { payload, code } = await signFragmentTransfer(identity, friend, amount)
  const row = { kind: 'fragments' as const, transferId: payload.transferId, amount, recipientId: friendId, recipientLabel: friend.label, code, createdAt: Date.now(), status: 'generated' as const }
  await database.transaction('rw', [database.player, database.outbox, database.identity, database.friends, database.accountState], async () => {
    await assertAccountActive(database)
    const currentFriend = await database.friends.get(friendId), currentIdentity = await database.identity.get('local')
    if (currentFriend?.fingerprint !== friend.fingerprint || !sameSigningIdentity(currentIdentity, identity)) throw new Error('Le contact ou l’identité a changé pendant le transfert.')
    const player = await database.player.get('local')
    if (!player || amount > player.fragments) throw new Error('Solde insuffisant.')
    await database.player.update('local', { fragments: player.fragments - amount })
    await database.outbox.add(row)
  })
  return row
}

export async function receiveFragments(code: string, database = db) {
  const identity = await ensureIdentity(database)
  const payload = await verifyFragmentTransfer(code, identity, await database.friends.toArray())
  return database.transaction('rw', [database.player, database.usedTransfers, database.identity, database.accountState], async () => {
    await assertAccountActive(database)
    if (!sameSigningIdentity(await database.identity.get('local'), identity)) throw new Error('L’identité locale a changé.')
    if (await database.usedTransfers.get(payload.transferId)) throw new Error('Ce code a déjà été utilisé.')
    const player = await database.player.get('local')
    if (!player || !Number.isSafeInteger(player.fragments + payload.amount)) throw new Error('Le solde de fragments est invalide.')
    const now = Math.max(Date.now(), player.maxObservedClockAt)
    assertTransferNotExpired(payload.issuedAt, now)
    await database.player.update('local', { fragments: player.fragments + payload.amount, maxObservedClockAt: now })
    await database.usedTransfers.add({ transferId: payload.transferId, receivedAt: now })
    return { amount: payload.amount, senderId: payload.senderId, balance: player.fragments + payload.amount }
  })
}

function sameSigningIdentity(current: LocalIdentityRow | undefined, expected: LocalIdentityRow) {
  return current?.playerUuid === expected.playerUuid && current.signingPublicJwk.x === expected.signingPublicJwk.x && current.signingPublicJwk.y === expected.signingPublicJwk.y
}

export type Received = { kind: 'card'; card: Card } | { kind: 'fragments'; amount: number; senderId: string; balance: number }
export async function receiveCode(code: string, database = db): Promise<Received> {
  const text = code.trim()
  if (text.startsWith('TR2.')) return { kind: 'card', card: await receiveTransfer(text, database) }
  if (text.startsWith('TF1.')) return { kind: 'fragments', ...await receiveFragments(text, database) }
  throw new Error('Code de transfert non reconnu.')
}

export async function renameFriend(playerUuid: string, label: string, database = db) {
  const name = label.trim()
  if (!name || name.length > 80) throw new Error('Le nom doit contenir entre 1 et 80 caractères.')
  await database.transaction('rw', [database.friends, database.accountState], async () => {
    await assertAccountActive(database)
    if (!await database.friends.update(playerUuid, { label: name })) throw new Error('Cet ami est introuvable.')
  })
}
export async function removeFriend(playerUuid: string, database = db) {
  await database.transaction('rw', [database.friends, database.accountState], async () => {
    await assertAccountActive(database)
    await database.friends.delete(playerUuid)
  })
}
