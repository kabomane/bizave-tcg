import { db, type BizaveDatabase } from '../storage/database'
import { discover } from '../storage/services'
import { createContactCode, decryptTransfer, encryptTransfer, generateIdentity, parseContactCode } from './crypto'

export async function ensureIdentity(database = db) {
  const existing = await database.identity.get('local')
  if (existing) return existing
  // A missing identity after prior transfers indicates lost keys, never silently regenerate.
  if (await database.outbox.count() || await database.usedTransfers.count() || await database.friends.count() || await database.drops.where('status').equals('outgoing').count()) throw new Error('Les clés locales ont été perdues. Les anciens échanges ne peuvent pas être restaurés.')
  const generated = await generateIdentity()
  return database.transaction('rw', [database.identity, database.friends], async () => {
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
  return database.transaction('rw', database.friends, async () => {
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
  const { payload, code } = await encryptTransfer(identity, friend, drop)
  const row = { transferId: payload.transferId, dropId, recipientId: friendId, code, recipientLabel: friend.label, createdAt: Date.now(), status: 'generated' as const }
  await database.transaction('rw', [database.drops, database.outbox, database.identity, database.friends], async () => {
    const current = await database.drops.get(dropId)
    const currentFriend = await database.friends.get(friendId)
    const currentIdentity = await database.identity.get('local')
    if (currentFriend?.fingerprint !== friend.fingerprint || currentIdentity?.playerUuid !== identity.playerUuid) throw new Error('Le contact ou l’identité a changé pendant le transfert.')
    if (!current || current.status !== 'owned' || current.cardId !== drop.cardId || current.finish !== drop.finish || current.artVariant !== drop.artVariant) throw new Error('La carte a déjà été envoyée ou recyclée.')
    await database.drops.update(dropId, { status: 'outgoing', updatedAt: row.createdAt })
    await database.outbox.add(row)
  })
  return row
}
export async function receiveTransfer(code: string, database: BizaveDatabase = db) {
  const identity = await ensureIdentity(database)
  const payload = await decryptTransfer(code, identity, await database.friends.toArray())
  return database.transaction('rw', [database.drops, database.discoveries, database.usedTransfers, database.identity], async () => {
    if ((await database.identity.get('local'))?.playerUuid !== identity.playerUuid) throw new Error('L’identité locale a changé.')
    if (await database.usedTransfers.get(payload.transferId)) throw new Error('Ce code a déjà été utilisé.')
    const existing = await database.drops.get(payload.dropId)
    if (existing?.status === 'owned') throw new Error('Cet exemplaire est déjà dans votre collection.')
    if (existing?.status === 'recycled') throw new Error('Cet exemplaire a été recyclé et ne peut pas revenir.')
    if (existing && (existing.cardId !== payload.cardId || existing.finish !== payload.finish || existing.artVariant !== payload.artVariant)) throw new Error('Les caractéristiques de la carte ont été altérées.')
    const now = Date.now()
    const card = { dropId: payload.dropId, cardId: payload.cardId, finish: payload.finish, artVariant: payload.artVariant }
    await database.drops.put({ ...card, status: 'owned', acquiredAt: existing?.acquiredAt ?? now, updatedAt: now })
    await discover(database, card, now)
    await database.usedTransfers.add({ transferId: payload.transferId, receivedAt: now })
    return card
  })
}

export const OUTBOX_RETENTION_MS = 24 * 60 * 60 * 1000
/** Removes local copies only. Signed transfers and ownership records remain intact. */
export async function pruneOutbox(database = db, now = Date.now()) {
  return database.outbox.where('createdAt').belowOrEqual(now - OUTBOX_RETENTION_MS).delete()
}
export async function renameFriend(playerUuid: string, label: string, database = db) {
  const name = label.trim()
  if (!name || name.length > 80) throw new Error('Le nom doit contenir entre 1 et 80 caractères.')
  if (!await database.friends.update(playerUuid, { label: name })) throw new Error('Cet ami est introuvable.')
}
export async function removeFriend(playerUuid: string, database = db) {
  await database.friends.delete(playerUuid)
}
