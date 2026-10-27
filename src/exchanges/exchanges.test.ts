import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BizaveDatabase } from '../storage/database'
import { initializeDatabase, recycleDrops } from '../storage/services'
import { uuid } from '../game/engine'
import { addContact, ensureIdentity, ownContact, receiveTransfer, sendTransfer, renameFriend, removeFriend } from './services'
import { pruneOutbox, OUTBOX_RETENTION_MS } from './outbox'
import { base64url, canonicalPayload, createContactCode, verifyTransfer, signTransfer, generateIdentity, parseContactCode, PLAYER_UUID_PATTERN, unbase64url, portableIdentity, importPortableIdentity } from './crypto'
import type { FriendContactRow } from '../game/types'
import { parseTransferFile, serializeTransferFile } from './transferFile'

let a: BizaveDatabase, b: BizaveDatabase, c: BizaveDatabase
beforeEach(async () => {
  a = new BizaveDatabase(`a-${uuid()}`); b = new BizaveDatabase(`b-${uuid()}`); c = new BizaveDatabase(`c-${uuid()}`)
  await Promise.all([initializeDatabase(a), initializeDatabase(b), initializeDatabase(c)])
})
afterEach(async () => { await Promise.all([a.delete(), b.delete(), c.delete()]) })
async function connect(left: BizaveDatabase, right: BizaveDatabase) {
  await addContact(await ownContact(right), 'Ami', left)
  await addContact(await ownContact(left), 'Ami', right)
}
async function addDrop(database = a) {
  const drop = { dropId: uuid(), cardId: 't-bizarre', finish: 'alternative' as const, artVariant: 'fullArt' as const, status: 'owned' as const, acquiredAt: Date.now(), updatedAt: Date.now() }
  await database.drops.add(drop)
  return drop
}
describe('identité et contacts', () => {
  it('génère une seule paire de signature transférable, indépendante des 8 chiffres', async () => {
    const first = await ensureIdentity(a), second = await ensureIdentity(b)
    expect(first.playerUuid).toMatch(PLAYER_UUID_PATTERN)
    expect(first.signingPrivateKey.extractable).toBe(true)
    expect(first).not.toHaveProperty('encryptionPrivateKey')
    expect(first).not.toHaveProperty('encryptionPublicJwk')
    expect((await crypto.subtle.exportKey('jwk', first.signingPrivateKey)).d).toBeTruthy()
    expect(first.signingPublicJwk.x).not.toBe(second.signingPublicJwk.x)
    expect(createContactCode(first)).not.toContain('private')
    a.close(); await a.open()
    const restored = await ensureIdentity(a)
    expect(restored.playerUuid).toBe(first.playerUuid)
    expect(restored.signingPublicJwk).toEqual(first.signingPublicJwk)
    const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, restored.signingPrivateKey, new Uint8Array([1]))
    expect(signature.byteLength).toBe(64)
  })
  it('ajoute un contact unilatéralement, idempotent, sans clé privée ni acceptation', async () => {
    const code = await ownContact(a)
    const friend = await addContact(code, 'Alice', b)
    expect(await a.friends.count()).toBe(0); expect(await b.friends.count()).toBe(1)
    await addContact(code, '', b)
    expect(await b.friends.count()).toBe(1)
    expect((await b.friends.get(friend.playerUuid))?.label).toBe('Alice')
    const decoded = JSON.parse(new TextDecoder().decode(unbase64url(code.slice(4))))
    expect(decoded.signingPublicJwk.d).toBeUndefined()
    expect(Object.keys(decoded).sort()).toEqual(['playerUuid', 'signingPublicJwk', 'version'])
    await expect(addContact(code, '', a)).rejects.toThrow(/vous-même/)
  })
  it('importe les clés portables avec la métadonnée ES256 de Firefox et refuse un autre algorithme', async () => {
    const identity = await generateIdentity(), portable = await portableIdentity(identity)
    portable.signingPrivateJwk.alg = 'ES256'; portable.signingPublicJwk.alg = 'ES256'
    const imported = await importPortableIdentity(portable)
    expect(createContactCode(imported)).toBe(createContactCode(identity))
    expect(imported.signingPrivateKey.extractable).toBe(true)
    portable.signingPrivateJwk.alg = 'ES384'
    await expect(importPortableIdentity(portable)).rejects.toThrow(/privée/)
  })
  it('accepte les zéros initiaux et bloque les conflits UUID / clés', async () => {
    const identity = { ...await generateIdentity(), playerUuid: '0000-00-01' }
    const contact = await parseContactCode(createContactCode(identity))
    expect(contact.playerUuid).toBe('0000-00-01')
    await addContact(createContactCode(identity), '', b)
    const other = { ...await generateIdentity(), playerUuid: identity.playerUuid }
    await expect(addContact(createContactCode(other), '', b)).rejects.toThrow(/Conflit/)
    expect((await b.friends.get(identity.playerUuid))?.signingPublicJwk.x).toBe(identity.signingPublicJwk.x)
  })
  it('refuse formats invalides, courbes inconnues et matériel privé', async () => {
    for (const code of ['FR1.abc', 'TR1.abc', 'TR2.abc', 'FR2.', 'FR2.***', 'FR2.' + 'x'.repeat(13000)]) await expect(parseContactCode(code)).rejects.toThrow()
    const data = JSON.parse(new TextDecoder().decode(unbase64url((await ownContact(a)).slice(4))))
    for (const modified of [{ ...data, playerUuid: '12345678' }, { ...data, version: 1 }, { ...data, signingPublicJwk: { ...data.signingPublicJwk, d: 'secret' } }, { ...data, signingPublicJwk: { ...data.signingPublicJwk, crv: 'P-384' } }]) await expect(parseContactCode(`FR2.${base64url(new TextEncoder().encode(JSON.stringify(modified)))}`)).rejects.toThrow()
  })
  it('ne régénère pas silencieusement une identité perdue après des échanges', async () => {
    await b.usedTransfers.add({ transferId: uuid(), receivedAt: Date.now() })
    await expect(ensureIdentity(b)).rejects.toThrow(/perdues/)
    expect(await b.identity.count()).toBe(0)
  })
})
describe('protocole TR2', () => {
  it('signe les données lisibles ; aucune clé dans l’enveloppe du transfert', async () => {
    await connect(a, b)
    const drop = await addDrop(), identity = await ensureIdentity(a), friend = (await a.friends.toArray())[0]
    const first = await signTransfer(identity, friend, drop), second = await signTransfer(identity, friend, drop)
    const envelope = JSON.parse(new TextDecoder().decode(unbase64url(first.code.slice(4))))
    expect(Object.keys(envelope).sort()).toEqual(['payload', 'signature'])
    expect(envelope.payload.senderId).toBe(identity.playerUuid)
    expect(envelope.payload.recipientId).toBe(friend.playerUuid)
    expect(envelope.payload.cardId).toBe(drop.cardId)
    expect(JSON.stringify(envelope)).not.toContain(identity.signingPublicJwk.x)
    const secondEnvelope = JSON.parse(new TextDecoder().decode(unbase64url(second.code.slice(4))))
    expect(envelope.payload.transferId).not.toBe(secondEnvelope.payload.transferId)
    const decoded = await verifyTransfer(first.code, await ensureIdentity(b), await b.friends.toArray())
    expect(decoded).toEqual(first.payload); expect(decoded.artVariant).toBe('fullArt')
  })
  it('la signature couvre artVariant et toutes les propriétés de la carte', async () => {
    await connect(a, b)
    const identity = await ensureIdentity(a), friend = (await a.friends.toArray())[0]
    const { payload } = await signTransfer(identity, friend, await addDrop())
    const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, identity.signingPrivateKey, canonicalPayload(payload))
    const publicKey = await crypto.subtle.importKey('jwk', identity.signingPublicJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
    expect(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, signature, canonicalPayload(payload))).toBe(true)
    for (const changed of [{ ...payload, artVariant: 'standard' as const }, { ...payload, finish: 'normal' as const }, { ...payload, cardId: 't-classique' }, { ...payload, dropId: uuid() }]) expect(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, signature, canonicalPayload(changed))).toBe(false)
  })
  it('refuse destinataire incorrect, contact manquant et texte altéré sans modifier le stockage', async () => {
    await connect(a, b)
    const transfer = await sendTransfer((await addDrop()).dropId, (await ensureIdentity(b)).playerUuid, a)
    await expect(receiveTransfer(transfer.code, c)).rejects.toThrow(/contact/)
    await addContact(await ownContact(a), '', c)
    await expect(receiveTransfer(transfer.code, c)).rejects.toThrow(/autre joueur/)
    const data = JSON.parse(new TextDecoder().decode(unbase64url(transfer.code.slice(4))))
    for (const changed of [{ ...data, payload: { ...data.payload, finish: 'normal' } }, { ...data, payload: { ...data.payload, recipientId: (await ensureIdentity(c)).playerUuid } }, { ...data, signature: (data.signature.startsWith('A') ? 'B' : 'A') + data.signature.slice(1) }]) {
      await expect(receiveTransfer(`TR2.${base64url(new TextEncoder().encode(JSON.stringify(changed)))}`, b)).rejects.toThrow()
    }
    expect(await b.drops.count()).toBe(0); expect(await b.usedTransfers.count()).toBe(0)
  })
  it('refuse une signature faite avec une clé ne correspondant pas au contact', async () => {
    await connect(a, b)
    const identity = await ensureIdentity(a), different = await generateIdentity()
    const { code } = await signTransfer({ ...identity, signingPrivateKey: different.signingPrivateKey }, (await a.friends.toArray())[0], await addDrop())
    await expect(receiveTransfer(code, b)).rejects.toThrow(/signature/)
  })
  it('refuse C se présentant comme A, même si C connaît son ID et joint sa propre clé', async () => {
    await connect(a, b)
    const aIdentity = await ensureIdentity(a), cIdentity = await ensureIdentity(c), friend = (await a.friends.toArray())[0]
    const impostor = { ...cIdentity, playerUuid: aIdentity.playerUuid }
    await expect(addContact(createContactCode(impostor), 'A', b)).rejects.toThrow(/Conflit/)
    const forged = await signTransfer(impostor, friend, await addDrop())
    await expect(receiveTransfer(forged.code, b)).rejects.toThrow(/signature/)
    const envelope = JSON.parse(new TextDecoder().decode(unbase64url(forged.code.slice(4))))
    envelope.publicKey = cIdentity.signingPublicJwk
    await expect(receiveTransfer(`TR2.${base64url(new TextEncoder().encode(JSON.stringify(envelope)))}`, b)).rejects.toThrow()
    expect(await b.drops.count()).toBe(0)
    expect(await b.usedTransfers.count()).toBe(0)
    expect((await b.friends.get(aIdentity.playerUuid))?.signingPublicJwk).toEqual(aIdentity.signingPublicJwk)
  })

  it('rejette le protocole chiffré abandonné et toute altération des champs signés', async () => {
    await connect(a, b)
    const transfer = await sendTransfer((await addDrop()).dropId, (await ensureIdentity(b)).playerUuid, a)
    await expect(receiveTransfer(transfer.code.replace('TR2.', 'TR1.'), b)).rejects.toThrow()
    const envelope = JSON.parse(new TextDecoder().decode(unbase64url(transfer.code.slice(4))))
    for (const patch of [{ transferId: uuid() }, { dropId: uuid() }, { issuedAt: envelope.payload.issuedAt + 1 }, { artVariant: 'standard' }, { version: 1 }, { senderId: (await ensureIdentity(c)).playerUuid }]) {
      const changed = { ...envelope, payload: { ...envelope.payload, ...patch } }
      await expect(receiveTransfer(`TR2.${base64url(new TextEncoder().encode(JSON.stringify(changed)))}`, b)).rejects.toThrow()
    }
    expect(await b.drops.count()).toBe(0)
    expect(await b.usedTransfers.count()).toBe(0)
  })
  it('une perte de Web Crypto fournit une erreur explicite', async () => {
    vi.stubGlobal('crypto', { subtle: undefined })
    try { await expect(generateIdentity()).rejects.toThrow('Les échanges nécessitent une connexion HTTPS et Web Crypto.') }
    finally { vi.unstubAllGlobals() }
  })
})
describe('transferts IndexedDB et antirejeu', () => {
  it('échange un fichier .btcg avec les mêmes contrôles de destinataire, intégrité et antirejeu', async () => {
    await connect(a, b)
    await addContact(await ownContact(a), 'Expéditeur', c)
    const drop = await addDrop()
    const transfer = await sendTransfer(drop.dropId, (await ensureIdentity(b)).playerUuid, a)
    const file = serializeTransferFile(transfer.code)
    await expect(receiveTransfer(parseTransferFile(file), c)).rejects.toThrow(/autre joueur/)
    const envelope = JSON.parse(new TextDecoder().decode(unbase64url(transfer.code.slice(4))))
    envelope.payload.cardId = 't-classique'
    const tampered = serializeTransferFile(`TR2.${base64url(new TextEncoder().encode(JSON.stringify(envelope)))}`)
    await expect(receiveTransfer(parseTransferFile(tampered), b)).rejects.toThrow()
    expect(await b.drops.count()).toBe(0)
    await expect(receiveTransfer(parseTransferFile(file), b)).resolves.toMatchObject({ dropId: drop.dropId, finish: drop.finish, artVariant: drop.artVariant })
    await expect(receiveTransfer(transfer.code, b)).rejects.toThrow(/déjà été utilisé/)
    expect(await a.outbox.count()).toBe(1)
    expect((await a.drops.get(drop.dropId))?.status).toBe('outgoing')
  })
  it('envoi atomique ; récupère le code après fermeture et refuse un second envoi', async () => {
    await connect(a, b)
    const drop = await addDrop(), recipient = (await ensureIdentity(b)).playerUuid
    const result = await sendTransfer(drop.dropId, recipient, a)
    expect((await a.drops.get(drop.dropId))?.status).toBe('outgoing')
    a.close(); await a.open()
    expect((await a.outbox.get(result.transferId))?.code).toBe(result.code)
    await expect(sendTransfer(drop.dropId, recipient, a)).rejects.toThrow(/disponible/)
    await expect(recycleDrops([drop.dropId], true, a)).rejects.toThrow(/disponible/)
  })
  it('envoi concurrent : exactement une création réussit', async () => {
    await connect(a, b)
    const drop = await addDrop(), recipient = (await ensureIdentity(b)).playerUuid
    const results = await Promise.allSettled([sendTransfer(drop.dropId, recipient, a), sendTransfer(drop.dropId, recipient, a)])
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1)
    expect(await a.outbox.count()).toBe(1)
  })
  it('réception concurrente : une seule écriture et registre limité au transferId', async () => {
    await connect(a, b)
    const drop = await addDrop(), result = await sendTransfer(drop.dropId, (await ensureIdentity(b)).playerUuid, a)
    const outcomes = await Promise.allSettled([receiveTransfer(result.code, b), receiveTransfer(result.code, b)])
    expect(outcomes.filter(r => r.status === 'fulfilled')).toHaveLength(1)
    expect(await b.drops.count()).toBe(1); expect(await b.discoveries.count()).toBe(1)
    const used = (await b.usedTransfers.toArray())[0]
    expect(Object.keys(used).sort()).toEqual(['receivedAt', 'transferId'])
    expect((await b.drops.get(drop.dropId))?.artVariant).toBe('fullArt')
  })
  it('autorise A→B→C→B→A avec même drop et nouveau transferId ; les anciens codes restent refusés', async () => {
    await connect(a, b); await connect(b, c)
    const drop = await addDrop(), aid = (await ensureIdentity(a)).playerUuid, bid = (await ensureIdentity(b)).playerUuid, cid = (await ensureIdentity(c)).playerUuid
    const t1 = await sendTransfer(drop.dropId, bid, a); await receiveTransfer(t1.code, b)
    const t2 = await sendTransfer(drop.dropId, cid, b); await receiveTransfer(t2.code, c)
    const t3 = await sendTransfer(drop.dropId, bid, c); await receiveTransfer(t3.code, b)
    await expect(receiveTransfer(t1.code, b)).rejects.toThrow(/déjà été utilisé/)
    const t4 = await sendTransfer(drop.dropId, aid, b); await receiveTransfer(t4.code, a)
    const returned = await a.drops.get(drop.dropId)
    expect(returned?.status).toBe('owned'); expect(returned?.finish).toBe(drop.finish); expect(returned?.artVariant).toBe(drop.artVariant)
    expect(new Set([t1, t2, t3, t4].map(t => t.transferId)).size).toBe(4)
    await expect(receiveTransfer(t1.code, b)).rejects.toThrow(/déjà été utilisé/)
    expect(await b.usedTransfers.count()).toBe(2)
  })
  it('refuse le retour d’une carte détruite ou d’une variante altérée', async () => {
    await connect(a, b)
    const drop = await addDrop(), identity = await ensureIdentity(a), friend = (await a.friends.toArray())[0]
    const first = await sendTransfer(drop.dropId, (await ensureIdentity(b)).playerUuid, a); await receiveTransfer(first.code, b)
    await recycleDrops([drop.dropId], true, b)
    const forged = await signTransfer(identity, friend, drop)
    await expect(receiveTransfer(forged.code, b)).rejects.toThrow(/recyclé/)
    await expect(receiveTransfer(first.code, b)).rejects.toThrow(/déjà été utilisé/)
    // An outgoing local row is reactivated only if all immutable fields agree.
    await b.drops.update(drop.dropId, { status: 'outgoing' })
    const changed = await signTransfer(identity, friend, { ...drop, artVariant: 'standard' })
    await expect(receiveTransfer(changed.code, b)).rejects.toThrow(/altérées/)
    expect(await b.usedTransfers.count()).toBe(1)
  })
  it('une erreur de stockage annule le statut outgoing et la boîte d’envoi ensemble', async () => {
    await connect(a, b)
    const drop = await addDrop(), recipient = (await ensureIdentity(b)).playerUuid
    const fail = () => { throw new Error('Échec simulé') }
    a.outbox.hook('creating', fail)
    await expect(sendTransfer(drop.dropId, recipient, a)).rejects.toThrow(/simulé/)
    a.outbox.hook('creating').unsubscribe(fail)
    expect((await a.drops.get(drop.dropId))?.status).toBe('owned'); expect(await a.outbox.count()).toBe(0)
  })
  it('refuse tout transfert vers soi-même', async () => {
    const identity = await ensureIdentity(a)
    const self: FriendContactRow = { playerUuid: identity.playerUuid, signingPublicJwk: identity.signingPublicJwk, fingerprint: '', addedAt: 0 }
    await expect(signTransfer(identity, self, await addDrop())).rejects.toThrow(/vous-même/)
  })
})

describe('gestion des amis et conservation des envois', () => {
  it('renomme un ami sans modifier ses clés, puis le supprime sans toucher au transfert', async () => {
    await connect(a, b)
    const friend = (await a.friends.toArray())[0]
    const outgoing = await sendTransfer((await addDrop()).dropId, friend.playerUuid, a)
    await renameFriend(friend.playerUuid, '  Nouveau nom  ', a)
    expect(await a.friends.get(friend.playerUuid)).toEqual({ ...friend, label: 'Nouveau nom' })
    await expect(renameFriend(friend.playerUuid, '   ', a)).rejects.toThrow(/nom/)
    await removeFriend(friend.playerUuid, a)
    expect(await a.friends.count()).toBe(0)
    expect((await a.outbox.get(outgoing.transferId))?.code).toBe(outgoing.code)
    await expect(receiveTransfer(outgoing.code, b)).resolves.toMatchObject({ dropId: outgoing.dropId })
  })
  it('supprime à 24 h exactement les copies locales et conserve les cartes, codes reçus et envois récents', async () => {
    await connect(a, b)
    const outgoing = await sendTransfer((await addDrop()).dropId, (await ensureIdentity(b)).playerUuid, a)
    await a.outbox.add({ ...outgoing, transferId: uuid(), createdAt: outgoing.createdAt + 1 })
    expect(await pruneOutbox(a, outgoing.createdAt + OUTBOX_RETENTION_MS - 1)).toBe(0)
    expect(await pruneOutbox(a, outgoing.createdAt + OUTBOX_RETENTION_MS)).toBe(1)
    expect(await a.outbox.count()).toBe(1)
    expect((await a.drops.get(outgoing.dropId))?.status).toBe('outgoing')
    await receiveTransfer(outgoing.code, b)
    expect(await b.usedTransfers.count()).toBe(1)
    await pruneOutbox(b, outgoing.createdAt + OUTBOX_RETENTION_MS)
    expect(await b.usedTransfers.count()).toBe(1)
    await expect(receiveTransfer(outgoing.code, b)).rejects.toThrow(/déjà été utilisé/)
  })
  it('ne recrée pas une identité après nettoyage des envois et suppression de tous les amis', async () => {
    await connect(a, b)
    const outgoing = await sendTransfer((await addDrop()).dropId, (await ensureIdentity(b)).playerUuid, a)
    await pruneOutbox(a, outgoing.createdAt + OUTBOX_RETENTION_MS)
    await a.friends.clear(); await a.identity.clear()
    await expect(ensureIdentity(a)).rejects.toThrow(/perdues/)
  })
})
