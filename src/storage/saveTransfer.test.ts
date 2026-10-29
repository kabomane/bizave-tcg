import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import Dexie from 'dexie'
import { BizaveDatabase } from './database'
import { initializeDatabase, openBooster, refreshRecharge, recycleDrops } from './services'
import { canonicalSavePayload, deleteAccount, exportSave, importSave, parseSaveFile, readSaveFile, SAVE_TABLES, MAX_SAVE_FILE_BYTES } from './saveTransfer'
import { addContact, ensureIdentity, ownContact, removeFriend, renameFriend, receiveTransfer, sendTransfer } from '../exchanges/services'
import { generateIdentity, base64url, createContactCode, parseContactCode } from '../exchanges/crypto'
import { pruneOutbox } from '../exchanges/outbox'
import { DEFAULT_PREFERENCES } from '../settings/preferences'
import { ensureInstallation } from './installation'
import { uuid, variantKey } from '../game/engine'

let source: BizaveDatabase, target: BizaveDatabase
beforeEach(async () => {
  source = new BizaveDatabase('source-' + uuid()); target = new BizaveDatabase('target-' + uuid())
  await Promise.all([initializeDatabase(source), initializeDatabase(target)])
  await Promise.all([ensureIdentity(source), ensureIdentity(target)])
})
afterEach(async () => { vi.restoreAllMocks(); await Promise.all([source.delete(), target.delete()]) })
async function seed() {
  const now = Date.now()
  const drops = ['owned', 'outgoing', 'recycled'].map(status => ({ dropId: uuid(), cardId: 't-classique', finish: 'glossy' as const, artVariant: 'fullArt' as const, status: status as 'owned', acquiredAt: now, updatedAt: now }))
  await source.drops.bulkAdd(drops)
  await source.discoveries.add({ ...drops[0], key: variantKey(drops[0]), firstDiscoveredAt: now })
  await source.player.update('local', { fragments: 273, freePackStock: 2, nextFreePackAt: now + 600_000 })
  await source.openings.add({ id: uuid(), boosterId: 'phantom-blood', openedAt: now, payment: 'free', fragmentsSpent: 0, results: [drops[0]], revealComplete: false, revealedCount: 0 })
  await source.recycling.add({ id: uuid(), dropIds: [drops[2].dropId], createdAt: now, fragmentsGained: 7 })
  await source.boosterStock.add({ boosterId: 'phantom-blood', quantity: 3, updatedAt: now })
  await source.boosterPurchases.add({ id: uuid(), boosterId: 'phantom-blood', boosterTitle: 'Phantom Blood', unitPrice: 70, fragmentsSpent: 70, createdAt: now })
  await source.outbox.add({ transferId: uuid(), dropId: drops[1].dropId, recipientId: (await ensureIdentity(target)).playerUuid, code: 'TR2.YWJj', status: 'generated', createdAt: now })
  await source.usedTransfers.add({ transferId: uuid(), receivedAt: now })
  await source.usedSaveTransfers.add({ transferId: uuid(), receivedAt: now })
  await source.usedGiftCodes.add({ codeHash: 'a'.repeat(64), redeemedAt: now })
  await addContact(await ownContact(target), 'Destination', source)
  const friend = await generateIdentity()
  await source.friends.add({ ...await parseContactCode(createContactCode(friend)), label: 'Ami conservé' })
  return drops
}
const exportToTarget = async () => exportSave((await ensureInstallation(target)).installationId, DEFAULT_PREFERENCES, source)

describe('migration de sauvegarde', () => {
  it('B continue à envoyer des cartes à A avant et après sa migration, sans refaire le contact', async () => {
    const friend = new BizaveDatabase('friend-' + uuid())
    try {
      await initializeDatabase(friend)
      await addContact(await ownContact(friend), 'B', source)
      await addContact(await ownContact(source), 'A', friend)
      const aid = (await ensureIdentity(source)).playerUuid, bid = (await ensureIdentity(friend)).playerUuid
      const pinned = await friend.friends.get(aid)
      const makeCard = async () => {
        const drop = { dropId: uuid(), cardId: 't-classique', finish: 'normal' as const, artVariant: 'standard' as const, status: 'owned' as const, acquiredAt: Date.now(), updatedAt: Date.now() }
        await friend.drops.add(drop)
        return drop
      }
      const before = await sendTransfer((await makeCard()).dropId, aid, friend)
      await importSave(await exportToTarget(), target)
      const after = await sendTransfer((await makeCard()).dropId, aid, friend)
      await expect(receiveTransfer(before.code, target)).resolves.toMatchObject({ dropId: before.dropId })
      await expect(receiveTransfer(after.code, target)).resolves.toMatchObject({ dropId: after.dropId })
      expect(await friend.friends.get(aid)).toEqual(pinned)
      expect((await ensureIdentity(target)).playerUuid).toBe(aid)
      const returned = await sendTransfer(before.dropId, bid, target)
      await expect(receiveTransfer(returned.code, friend)).resolves.toMatchObject({ dropId: before.dropId })
      await expect(receiveTransfer(before.code, target)).rejects.toThrow(/déjà été utilisé/)
      // The imported private key remains transferable for the next move.
      const next = new BizaveDatabase('next-' + uuid())
      try {
        await initializeDatabase(next)
        const file = await exportSave((await ensureInstallation(next)).installationId, DEFAULT_PREFERENCES, target)
        await importSave(file, next)
        expect((await ensureIdentity(next)).playerUuid).toBe(aid)
        await expect(receiveTransfer(after.code, next)).rejects.toThrow(/déjà été utilisé/)
      } finally { await next.delete() }
    } finally { await friend.delete() }
  })

  it('déplace toute la partie et son identité, garde l’installation cible et fusionne les registres', async () => {
    await seed()
    const sourceIdentity = await ensureIdentity(source), targetInstallation = await ensureInstallation(target)
    const previousSave = { transferId: uuid(), receivedAt: 1 }, previousCard = { transferId: uuid(), receivedAt: 2 }
    await target.usedSaveTransfers.add(previousSave); await target.usedTransfers.add(previousCard)
    const previousGift = { codeHash: 'b'.repeat(64), redeemedAt: 3 }
    await target.usedGiftCodes.add(previousGift)
    const contents = await exportSave(targetInstallation.installationId, { ...DEFAULT_PREFERENCES, theme: 'dark' }, source)
    const prepared = await parseSaveFile(contents)
    expect(prepared.payload.preferences.theme).toBe('dark')
    expect(prepared.payload.identity.signingPrivateJwk.d).toBeTruthy(); expect(contents).not.toContain('encryptionPrivateKey')
    await importSave(contents, target)
    const identity = await ensureIdentity(target)
    expect(identity.playerUuid).toBe(sourceIdentity.playerUuid)
    expect(identity.signingPublicJwk).toEqual(sourceIdentity.signingPublicJwk)
    expect(await ensureInstallation(target)).toEqual(targetInstallation)
    expect(identity.signingPrivateKey.extractable).toBe(true)
    for (const name of SAVE_TABLES.filter(n => !['friends', 'usedTransfers', 'usedSaveTransfers', 'usedGiftCodes'].includes(n))) expect(await target.table(name).toArray(), name).toEqual(prepared.payload.tables[name])
    expect(await target.usedGiftCodes.count()).toBe(2)
    expect(await target.usedGiftCodes.get(previousGift.codeHash)).toEqual(previousGift)
    expect(await target.usedGiftCodes.get('a'.repeat(64))).toEqual(prepared.payload.tables.usedGiftCodes![0])
    expect(await target.friends.count()).toBe(2)
    expect(await target.friends.get(identity.playerUuid)).toBeUndefined()
    expect(await target.usedTransfers.count()).toBe(2)
    expect(await target.usedTransfers.get(previousCard.transferId)).toEqual(previousCard)
    expect(await target.usedSaveTransfers.count()).toBe(3)
    expect(await target.usedSaveTransfers.get(previousSave.transferId)).toEqual(previousSave)
    expect(await target.usedSaveTransfers.get(prepared.payload.transferId)).toBeDefined()
    expect(await target.accountState.get('local')).toMatchObject({ status: 'active', preferences: { theme: 'dark' } })
    await expect(importSave(contents, target)).rejects.toThrow(/déjà été importée/)
    expect(await target.drops.count()).toBe(2)
    expect(await target.recycledCards.count()).toBe(1)
  })

  it('ne laisse sur la source que le fichier téléchargeable, y compris après redémarrage et depuis une autre connexion', async () => {
    const drops = await seed(), contents = await exportToTarget()
    source.close(); await source.open(); await initializeDatabase(source)
    for (const table of source.tables.filter(t => !['accountState', 'version'].includes(t.name))) expect(await table.count(), table.name).toBe(0)
    expect(await source.accountState.get('local')).toMatchObject({ status: 'exported', file: contents })
    const second = new BizaveDatabase(source.name)
    try {
      await expect(ensureIdentity(second)).rejects.toThrow(/transférée/)
      await expect(refreshRecharge(second)).rejects.toThrow(/transférée/)
      await expect(openBooster('phantom-blood', second)).rejects.toThrow(/transférée/)
      await expect(recycleDrops([drops[0].dropId], true, second)).rejects.toThrow(/transférée/)
      await expect(renameFriend('1234-56-78', 'Nom', second)).rejects.toThrow(/transférée/)
      await expect(removeFriend('1234-56-78', second)).rejects.toThrow(/transférée/)
      expect(await pruneOutbox(second)).toBe(0)
      await expect(exportSave('1234-56-78', DEFAULT_PREFERENCES, second)).rejects.toThrow(/transférée/)
    } finally { second.close() }
    expect((await source.accountState.get('local'))?.status).toBe('exported')
  })

  it('refuse la mauvaise destination et les fichiers altérés sans changer la cible', async () => {
    await seed()
    const contents = await exportToTarget(), pristine = await target.player.get('local')
    const third = new BizaveDatabase('third-' + uuid())
    try { await initializeDatabase(third); await expect(importSave(contents, third)).rejects.toThrow(/autre appareil/); expect(await third.drops.count()).toBe(0) } finally { await third.delete() }
    const envelope = JSON.parse(contents)
    envelope.payload = envelope.payload.replace('273', '999')
    await expect(importSave(JSON.stringify(envelope), target)).rejects.toThrow(/signature/)
    await expect(parseSaveFile(JSON.stringify({ format: 'bizave-tcg-transfer', version: 1, code: 'TR2.YWJj' }))).rejects.toThrow(/pas un transfert de carte/)
    expect(await target.player.get('local')).toEqual(pristine)
    expect(await target.usedSaveTransfers.count()).toBe(0)
  })

  it('termine le démarrage sur la page de téléchargement si un autre onglet exporte pendant l’initialisation', async () => {
    await seed()
    const originalRead = source.definitions.toArray.bind(source.definitions)
    let exported = false
    vi.spyOn(source.definitions, 'toArray').mockImplementation(() => originalRead().then(async rows => {
      if (!Dexie.currentTransaction && !exported) { exported = true; await exportToTarget() }
      return rows
    }))
    await expect(initializeDatabase(source)).resolves.toBeUndefined()
    expect(exported).toBe(true)
    expect((await source.accountState.get('local'))?.status).toBe('exported')
    expect(await source.player.count()).toBe(0)
  })

  it('valide les données signées et les limites du fichier avant toute importation', async () => {
    const identity = await ensureIdentity(source), contents = await exportToTarget()
    const envelope = JSON.parse(contents), payload = JSON.parse(envelope.payload)
    payload.tables.player[0].fragments = -10
    envelope.payload = JSON.stringify(payload)
    envelope.signature = base64url(new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, identity.signingPrivateKey, canonicalSavePayload(envelope.payload))))
    await expect(importSave(JSON.stringify(envelope), target)).rejects.toThrow(/invalide ou incompatible/)
    await expect(readSaveFile({ name: 'save.txt', size: 1 } as File)).rejects.toThrow(/fichier .btcg/)
    await expect(readSaveFile({ name: 'save.btcg', size: MAX_SAVE_FILE_BYTES + 1 } as File)).rejects.toThrow(/25 Mo/)
    expect((await target.player.get('local'))?.fragments).toBe(0)
  })

  it('conserve la source si la signature ou la persistance du fichier échoue', async () => {
    await seed()
    const original = await source.drops.toArray()
    const spy = vi.spyOn(crypto.subtle, 'sign').mockRejectedValueOnce(new Error('Signature indisponible'))
    await expect(exportToTarget()).rejects.toThrow(/Signature indisponible/)
    spy.mockRestore()
    expect(await source.drops.toArray()).toEqual(original)
    const corruptSignature = vi.spyOn(crypto.subtle, 'sign').mockResolvedValueOnce(new Uint8Array(64).buffer)
    await expect(exportToTarget()).rejects.toThrow(/signature/)
    corruptSignature.mockRestore()
    expect(await source.drops.toArray()).toEqual(original)
    const fail = () => { throw new Error('Stockage plein') }
    source.accountState.hook('creating', fail)
    await expect(exportToTarget()).rejects.toThrow(/Stockage plein/)
    source.accountState.hook('creating').unsubscribe(fail)
    expect(await source.drops.toArray()).toEqual(original)
    expect(await source.identity.get('local')).toBeDefined()
    expect(await source.accountState.count()).toBe(0)
  })

  it('annule intégralement un import si son registre ne peut pas être enregistré', async () => {
    await seed()
    await target.player.update('local', { fragments: 42 })
    const contents = await exportToTarget(), before = await target.player.get('local')
    const fail = () => { throw new Error('Registre indisponible') }
    target.usedSaveTransfers.hook('creating', fail)
    await expect(importSave(contents, target)).rejects.toThrow(/Registre indisponible/)
    target.usedSaveTransfers.hook('creating').unsubscribe(fail)
    expect(await target.player.get('local')).toEqual(before)
    expect(await target.drops.count()).toBe(0)
    expect(await target.usedSaveTransfers.count()).toBe(0)
    await importSave(contents, target)
    expect(await target.drops.count()).toBe(2)
    expect(await target.recycledCards.count()).toBe(1)
  })

  it('importe encore les fichiers du schéma 5 en gardant le registre de cadeaux du destinataire', async () => {
    const identity = await ensureIdentity(source)
    const envelope = JSON.parse(await exportToTarget())
    const payload = JSON.parse(envelope.payload)
    payload.schemaVersion = 5; payload.tables.player[0].schemaVersion = 5
    delete payload.tables.recycledCards
    delete payload.tables.favorites
    delete payload.tables.usedGiftCodes
    envelope.payload = JSON.stringify(payload)
    envelope.signature = base64url(new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, identity.signingPrivateKey, canonicalSavePayload(envelope.payload))))
    const gift = { codeHash: 'c'.repeat(64), redeemedAt: 1 }
    await target.usedGiftCodes.add(gift)
    await importSave(JSON.stringify(envelope), target)
    expect((await target.player.get('local'))?.schemaVersion).toBe(9)
    expect(await target.usedGiftCodes.toArray()).toEqual([gift])
    await expect(exportSave('1234-56-78', DEFAULT_PREFERENCES, target)).resolves.toBeTypeOf('string')
  })

  it.each([7, 8])('importe un fichier du schéma %s et initialise la métadonnée locale actuelle', async schemaVersion => {
    const identity = await ensureIdentity(source)
    const envelope = JSON.parse(await exportToTarget())
    const payload = JSON.parse(envelope.payload)
    payload.schemaVersion = schemaVersion; payload.tables.player[0].schemaVersion = schemaVersion
    if (schemaVersion === 7) delete payload.tables.recycledCards
    envelope.payload = JSON.stringify(payload)
    envelope.signature = base64url(new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, identity.signingPrivateKey, canonicalSavePayload(envelope.payload))))
    await importSave(JSON.stringify(envelope), target)
    expect(await target.versionInfo.get('local')).toEqual({ id: 'local', schemaVersion: 9, ready: true })
  })

  it('rejette un registre de cadeaux mal formé, dupliqué ou manquant dans un fichier récent', async () => {
    const identity = await ensureIdentity(source)
    const original = JSON.parse(await exportToTarget())
    for (const rows of [[{ codeHash: 'incorrect', redeemedAt: 1 }], [{ codeHash: 'd'.repeat(64), redeemedAt: -1 }], Array(2).fill({ codeHash: 'd'.repeat(64), redeemedAt: 1 }), undefined]) {
      const payload = JSON.parse(original.payload)
      payload.tables.usedGiftCodes = rows
      const serialized = JSON.stringify(payload)
      const signature = base64url(new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, identity.signingPrivateKey, canonicalSavePayload(serialized))))
      await expect(importSave(JSON.stringify({ ...original, payload: serialized, signature }), target)).rejects.toThrow(/invalide ou incompatible/)
    }
    expect(await target.usedGiftCodes.count()).toBe(0)
  })

  it('sérialise deux imports concurrents et ne consomme le fichier qu’une fois', async () => {
    await seed()
    const contents = await exportToTarget(), second = new BizaveDatabase(target.name)
    try {
      const results = await Promise.allSettled([importSave(contents, target), importSave(contents, second)])
      expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1)
      expect(results.filter(r => r.status === 'rejected')).toHaveLength(1)
      expect(await target.drops.count()).toBe(2)
    expect(await target.recycledCards.count()).toBe(1)
    } finally { second.close() }
  })

  it('refuse un ID invalide ou identique avant d’effacer la source', async () => {
    await seed()
    await expect(exportSave('bad-id', DEFAULT_PREFERENCES, source)).rejects.toThrow(/format/)
    await expect(exportSave((await ensureInstallation(source)).installationId, DEFAULT_PREFERENCES, source)).rejects.toThrow(/différent/)
    expect(await source.drops.count()).toBe(3)
    expect(await source.accountState.count()).toBe(0)
  })
})

describe('suppression du compte', () => {
  it('réinitialise chaque table, les options, l’ID et les clés', async () => {
    await seed()
    const before = await ensureIdentity(source)
    await deleteAccount(source)
    const after = await ensureIdentity(source)
    expect(after.playerUuid).not.toBe(before.playerUuid)
    expect(after.signingPublicJwk).not.toEqual(before.signingPublicJwk)
    expect(await source.player.get('local')).toMatchObject({ freePackStock: 5, fragments: 0, nextFreePackAt: null, schemaVersion: 9 })
    for (const table of source.tables.filter(t => !['player', 'identity', 'definitions', 'accountState', 'installation', 'version'].includes(t.name))) expect(await table.count(), table.name).toBe(0)
    expect(await source.accountState.get('local')).toEqual({ id: 'local', status: 'active', preferences: DEFAULT_PREFERENCES })
  })

  it('efface aussi un fichier en attente et ne réutilise pas l’identité supprimée', async () => {
    await seed(); await exportToTarget()
    await deleteAccount(source); await initializeDatabase(source)
    expect(await source.accountState.get('local')).toMatchObject({ status: 'active' })
    expect(await source.accountState.get('local')).not.toHaveProperty('file')
    expect((await source.player.get('local'))?.freePackStock).toBe(5)
  })
})
