import { base62 } from '../src/encoding/base62'
import { expect, test } from '@playwright/test'
import { COLLECTION_BODY_MODES, encodePayload } from '../src/collection/snapshotCodec'

test('les six formats signés hors navigateur se vérifient dans chaque moteur', async ({ page }) => {
  const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  const publicJwk = await crypto.subtle.exportKey('jwk', keys.publicKey)
  const senderId = '1234-56-78', issuedAt = 1_700_000_000
  const contact = 'FR3.' + base62(new TextEncoder().encode(JSON.stringify({ version: 2, playerUuid: senderId, signingPublicJwk: publicJwk })))
  const entries = [{ number: 1, variant: 0, quantity: 10, favorite: true }, { number: 3, variant: 5, quantity: 1_000_000, favorite: false }]
  const codes = await Promise.all(COLLECTION_BODY_MODES.map(async bodyMode => {
    const payload = encodePayload({ senderId, issuedAt, registryVersion: 1, cardSlots: 5, bodyMode }, entries)
    const message = new Uint8Array([...new TextEncoder().encode('BizaveTCG/CollectionSnapshot/v3\n'), ...payload])
    const signature = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.privateKey, message))
    return 'CL2.' + base62(new Uint8Array([...payload, ...signature]))
  }))
  await page.goto('/echanges')
  await expect(page.getByRole('heading', { name: 'Amis', exact: true })).toBeVisible()
  const snapshots = await page.evaluate(async ({ codes, contact }) => {
    const cryptoPath = '/src/exchanges/crypto.ts', collectionPath = '/src/collection/collectionCrypto.ts'
    const { parseContactCode } = await import(cryptoPath), { verifyCollection } = await import(collectionPath)
    const friend = await parseContactCode(contact)
    return Promise.all(codes.map(code => verifyCollection(code, [friend])))
  }, { codes, contact })
  expect(snapshots).toHaveLength(6)
  for (const snapshot of snapshots) {
    expect(snapshot).toMatchObject({ senderId, issuedAt })
    expect(snapshot.variants).toEqual([
      { cardId: 't-classique', finish: 'normal', artVariant: 'standard', quantity: 10, favorite: true },
      { cardId: 't-etudiant', finish: 'alternative', artVariant: 'fullArt', quantity: 1_000_000, favorite: false },
    ])
  }
})

for (const mode of [0x82, 0x83]) test(`format ${mode} : fichier, consultation et mémoire après rechargement`, async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto('/echanges')
  await expect(page.getByRole('heading', { name: 'Amis', exact: true })).toBeVisible()
  const snapshot = await page.evaluate(async mode => {
    const cryptoPath = '/src/exchanges/crypto.ts', collectionPath = '/src/collection/collectionCrypto.ts', servicesPath = '/src/exchanges/services.ts'
    const registryPath = '/src/collection/registry.ts', variantsPath = '/src/collection/collectionSnapshot.ts', codecPath = '/src/collection/snapshotCodec.ts'
    const settingsPath = '/src/settings/useSettings.ts', databasePath = '/src/storage/database.ts'
    const { generateIdentity, createContactCode } = await import(cryptoPath), { addContact } = await import(servicesPath)
    const { signCollection } = await import(collectionPath), { collectionCardSlots } = await import(registryPath)
    const { fromNumericVariants } = await import(variantsPath), { parseEnvelope } = await import(codecPath)
    const { db } = await import(databasePath)
    const identity = await generateIdentity()
    await addContact(createContactCode(identity), 'Formats')
    ;(await import(settingsPath)).updateSettings({ rememberCollections: true, sharedCollectionDisplay: { sort: 'name', direction: 'asc', groupBy: 'card', duplicates: 'hide', pileCover: 'rarest' } })
    const entries = mode === 0x82
      ? Array.from({ length: 200 }, (_, i) => ({ number: i + 1, variant: 0, quantity: 1, favorite: i === 0 }))
      : Array.from({ length: collectionCardSlots * 6 }, (_, p) => ({ number: Math.floor(p / 6) + 1, variant: p % 6, quantity: 2, favorite: p === 0 }))
    const code = await signCollection(identity, fromNumericVariants(entries), 1_700_000_000)
    const state = JSON.stringify(await Promise.all(['drops', 'discoveries', 'favorites', 'outbox', 'usedTransfers', 'player'].map(name => db.table(name).toArray())))
    return { code, mode: parseEnvelope(code).bodyMode, senderId: identity.playerUuid, state, total: entries.length * (mode === 0x82 ? 1 : 2) }
  }, mode)
  expect(snapshot.mode).toBe(mode)
  await page.getByRole('button', { name: 'Voir la fiche de Formats', exact: true }).click()
  await page.getByRole('button', { name: 'Recevoir sa collection', exact: true }).click()
  const receiving = page.getByRole('dialog', { name: 'Recevoir la collection de Formats', exact: true })
  await receiving.getByLabel('Fichier de collection .btcg', { exact: true }).setInputFiles({ name: 'collection.btcg', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ format: 'bizave-tcg-collection', version: 1, code: snapshot.code })) })
  await receiving.getByRole('button', { name: 'Recevoir', exact: true }).click()
  const viewer = page.getByRole('dialog', { name: 'Collection de Formats', exact: true })
  await expect(viewer).toBeVisible()
  await expect(viewer.locator('.title-with-count > span')).toHaveText(String(snapshot.total))
  await viewer.getByRole('button', { name: 'Fermer', exact: true }).click()
  await page.reload()
  await page.getByRole('button', { name: 'Voir la fiche de Formats', exact: true }).click()
  await page.getByRole('button', { name: 'Voir la collection', exact: true }).click()
  await expect(viewer).toBeVisible()
  const after = await page.evaluate(async senderId => {
    const path = '/src/storage/database.ts', { db } = await import(path)
    return {
      code: JSON.parse(localStorage.getItem('bizave.collectionMemory.v1.' + senderId)!).code,
      state: JSON.stringify(await Promise.all(['drops', 'discoveries', 'favorites', 'outbox', 'usedTransfers', 'player'].map(name => db.table(name).toArray()))),
    }
  }, snapshot.senderId)
  expect(after.code).toBe(snapshot.code)
  expect(after.state).toBe(snapshot.state)
})
