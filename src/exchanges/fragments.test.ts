import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BizaveDatabase } from '../storage/database'
import { initializeDatabase } from '../storage/services'
import { uuid } from '../game/engine'
import { addContact, ensureIdentity, ownContact, receiveCode, receiveFragments, sendFragments } from './services'
import { base64url, canonicalFragmentPayload, signFragmentTransfer, signTransfer, unbase64url, validateFragmentPayload, verifyFragmentTransfer, verifyTransfer } from './crypto'
import { parseTransferFile, readTransferFile, serializeTransferFile } from './transferFile'
import { pruneOutbox, OUTBOX_RETENTION_MS } from './outbox'

let a: BizaveDatabase, b: BizaveDatabase, c: BizaveDatabase
beforeEach(async () => {
  a = new BizaveDatabase(uuid()); b = new BizaveDatabase(uuid()); c = new BizaveDatabase(uuid())
  await Promise.all([initializeDatabase(a), initializeDatabase(b), initializeDatabase(c)])
  await addContact(await ownContact(b), 'Nana', a)
  await addContact(await ownContact(a), 'Eli', b)
  await a.player.update('local', { fragments: 300 })
})
afterEach(async () => { vi.restoreAllMocks(); await Promise.all([a.delete(), b.delete(), c.delete()]) })

describe('protocole TF1', () => {
  it.each(['card', 'fragments'])('refuse un code ou fichier %s après 24 h sans crédit ni consommation', async kind => {
    const identity = await ensureIdentity(a), friend = (await a.friends.toArray())[0]
    const transfer = kind === 'card'
      ? await signTransfer(identity, friend, { dropId: uuid(), cardId: 't-classique', finish: 'normal', artVariant: 'standard' })
      : await signFragmentTransfer(identity, friend, 80)
    const fileCode = parseTransferFile(serializeTransferFile(transfer.code))
    vi.spyOn(Date, 'now').mockReturnValue(transfer.payload.issuedAt + 25 * 60 * 60 * 1000)
    await expect(receiveCode(transfer.code, b)).rejects.toThrow(/expiré/)
    await expect(receiveCode(fileCode, b)).rejects.toThrow(/expiré/)
    expect((await b.player.get('local'))?.fragments).toBe(0)
    expect(await b.drops.count()).toBe(0)
    expect(await b.usedTransfers.count()).toBe(0)
  })
  it('signe six champs dans un domaine distinct, avec aller-retour .btcg', async () => {
    const identity = await ensureIdentity(a), friend = (await a.friends.toArray())[0]
    const { code, payload } = await signFragmentTransfer(identity, friend, 137)
    expect(new TextDecoder().decode(canonicalFragmentPayload(payload))).toBe('BizaveTCG/FragmentTransfer/v1\n' + JSON.stringify(payload))
    expect(Object.keys(payload)).toHaveLength(6)
    expect(await verifyFragmentTransfer(code, await ensureIdentity(b), await b.friends.toArray())).toEqual(payload)
    const file = new File([serializeTransferFile(code)], 'fragments.btcg')
    expect(parseTransferFile(await file.text())).toBe(code)
    expect(await readTransferFile(file)).toBe(code)
  })
  it('refuse altération, destinataire incorrect, expéditeur inconnu et substitution TR2/TF1', async () => {
    const identity = await ensureIdentity(a), friend = (await a.friends.toArray())[0]
    const { code, payload } = await signFragmentTransfer(identity, friend, 80)
    const envelope = JSON.parse(new TextDecoder().decode(unbase64url(code.slice(4))))
    envelope.payload.amount++
    const tampered = 'TF1.' + base64url(new TextEncoder().encode(JSON.stringify(envelope)))
    await expect(receiveCode(tampered, b)).rejects.toThrow(/signature/)
    await expect(receiveCode(code, c)).rejects.toThrow(/contact/)
    await addContact(await ownContact(a), 'Eli', c)
    await expect(receiveCode(code, c)).rejects.toThrow(/autre joueur/)
    const card = await signTransfer(identity, friend, { dropId: uuid(), cardId: 't-classique', finish: 'normal', artVariant: 'standard' })
    await expect(verifyFragmentTransfer(card.code, await ensureIdentity(b), await b.friends.toArray())).rejects.toThrow()
    await expect(verifyTransfer(code, await ensureIdentity(b), await b.friends.toArray())).rejects.toThrow()
    await expect(receiveCode(card.code.replace('TR2.', 'TF1.'), b)).rejects.toThrow()
    await expect(receiveCode(code.replace('TF1.', 'TR2.'), b)).rejects.toThrow()
    for (const patch of [{ amount: 0 }, { amount: -1 }, { amount: 1.5 }, { amount: Number.MAX_SAFE_INTEGER }, { amount: 1_000_001 }, { version: 2 }, { senderId: 'invalid' }, { transferId: 'invalid' }, { issuedAt: -1 }, { extra: 1 }]) expect(() => validateFragmentPayload({ ...payload, ...patch })).toThrow()
    expect(await b.usedTransfers.count()).toBe(0)
    expect((await b.player.get('local'))?.fragments).toBe(0)
    await expect(receiveCode('FR2.anything', b)).rejects.toThrow('Code de transfert non reconnu.')
  })
})

describe('solde et antirejeu', () => {
  it('débite exactement à la création et crédite une seule fois via le répartiteur', async () => {
    const row = await sendFragments(137, (await ensureIdentity(b)).playerUuid, a)
    expect(row).toMatchObject({ kind: 'fragments', amount: 137, recipientLabel: 'Nana' })
    expect((await a.player.get('local'))?.fragments).toBe(163)
    expect(await a.outbox.get(row.transferId)).toEqual(row)
    expect(await receiveCode(row.code, b)).toEqual({ kind: 'fragments', amount: 137, senderId: (await ensureIdentity(a)).playerUuid })
    await expect(receiveFragments(row.code, b)).rejects.toThrow('Ce code a déjà été utilisé.')
    expect((await b.player.get('local'))?.fragments).toBe(137)
    expect(await b.usedTransfers.count()).toBe(1)
    await pruneOutbox(a, row.createdAt + OUTBOX_RETENTION_MS)
    expect(await a.outbox.count()).toBe(0)
    expect((await a.player.get('local'))?.fragments).toBe(163)
  })
  it('refuse montants invalides et solde insuffisant sans débit', async () => {
    const recipient = (await ensureIdentity(b)).playerUuid
    for (const amount of [0, -1, 1.2, NaN, Infinity, 1_000_001]) await expect(sendFragments(amount, recipient, a)).rejects.toThrow(/montant/)
    await expect(sendFragments(301, recipient, a)).rejects.toThrow('Solde insuffisant.')
    expect((await a.player.get('local'))?.fragments).toBe(300)
    expect(await a.outbox.count()).toBe(0)
  })
  it('sérialise les envois et réceptions concurrents', async () => {
    const recipient = (await ensureIdentity(b)).playerUuid
    const sends = await Promise.allSettled([sendFragments(200, recipient, a), sendFragments(200, recipient, a)])
    expect(sends.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    expect((await a.player.get('local'))?.fragments).toBe(100)
    const row = (await a.outbox.toArray())[0]
    const receives = await Promise.allSettled([receiveFragments(row.code, b), receiveFragments(row.code, b)])
    expect(receives.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    expect((await b.player.get('local'))?.fragments).toBe(200)
  })
  it('annule débit et crédit si une écriture échoue', async () => {
    const fail = () => { throw new Error('Échec simulé') }, recipient = (await ensureIdentity(b)).playerUuid
    a.outbox.hook('creating', fail)
    await expect(sendFragments(50, recipient, a)).rejects.toThrow(/simulé/)
    a.outbox.hook('creating').unsubscribe(fail)
    expect((await a.player.get('local'))?.fragments).toBe(300)
    const row = await sendFragments(50, recipient, a)
    b.usedTransfers.hook('creating', fail)
    await expect(receiveFragments(row.code, b)).rejects.toThrow(/simulé/)
    b.usedTransfers.hook('creating').unsubscribe(fail)
    expect((await b.player.get('local'))?.fragments).toBe(0)
    expect(await b.usedTransfers.count()).toBe(0)
  })
  it('revérifie le verrou dans la transaction, même après signature', async () => {
    const recipient = (await ensureIdentity(b)).playerUuid
    const pending = sendFragments(50, recipient, a)
    await a.accountState.put({ id: 'local', status: 'exported', transferId: uuid(), recipientId: recipient, file: 'locked' })
    await expect(pending).rejects.toThrow(/transférée/)
    expect((await a.player.get('local'))?.fragments).toBe(300)
    expect(await a.outbox.count()).toBe(0)
    await a.accountState.clear()
    const row = await sendFragments(50, recipient, a)
    await b.accountState.put({ id: 'local', status: 'exported', transferId: uuid(), recipientId: recipient, file: 'locked' })
    await expect(receiveFragments(row.code, b)).rejects.toThrow(/transférée/)
    expect((await b.player.get('local'))?.fragments).toBe(0)
  })
})

it('migre les envois v9 en cartes sans modifier leurs codes ou leur solde', async () => {
  const name = uuid(), legacy = new Dexie(name)
  const schema = Object.fromEntries(a.tables.map(table => [table.name, [table.schema.primKey.src, ...table.schema.indexes.map(index => index.src)].join(',')]))
  legacy.version(9).stores(schema)
  const old = { transferId: uuid(), dropId: uuid(), recipientId: '1234-56-78', code: 'TR2.keep', createdAt: 5, status: 'generated' }
  await legacy.table('outbox').add(old)
  await legacy.table('player').put({ ...(await a.player.get('local'))!, schemaVersion: 9 })
  await legacy.table('version').put({ id: 'local', schemaVersion: 9, ready: true })
  legacy.close()
  const migrated = new BizaveDatabase(name)
  try {
    await migrated.open()
    expect(await migrated.outbox.get(old.transferId)).toEqual({ ...old, kind: 'card' })
    expect(await migrated.player.get('local')).toMatchObject({ fragments: 300, schemaVersion: 10 })
    expect(await migrated.versionInfo.get('local')).toEqual({ id: 'local', schemaVersion: 10, ready: true })
  } finally { await migrated.delete() }
})
