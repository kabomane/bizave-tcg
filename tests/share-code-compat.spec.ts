import { expect, test } from '@playwright/test'
import { base62, unbase62 } from '../src/encoding/base62'
import { UPDATE_VERSION } from '../src/data/update'
import fixture from '../src/collection/fixtures/snapshot-v3.json' with { type: 'json' }

const encoder = new TextEncoder(), decoder = new TextDecoder('utf-8', { fatal: true })
const cardDomain = 'BizaveTCG/CardTransfer/v2\n', fragmentDomain = 'BizaveTCG/FragmentTransfer/v1\n'

test('les quatre codes Base62 passent entre Node et le navigateur, par texte et fichier', async ({ page }) => {
  await page.addInitScript(version => localStorage.setItem('updated', String(version)), UPDATE_VERSION)
  await page.goto('/echanges')
  await expect(page.getByRole('heading', { name: 'Amis', exact: true })).toBeVisible()
  const recipientCode = await page.evaluate(async () => {
    const path = '/src/exchanges/services.ts'
    return (await import(path)).ownContact()
  })
  expect(recipientCode).toMatch(/^FR3\.[A-Za-z0-9]+$/)
  const recipient = JSON.parse(decoder.decode(unbase62(recipientCode.slice(4))))
  const keys = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])
  const senderId = recipient.playerUuid === '1234-56-78' ? '8765-43-21' : '1234-56-78'
  const contact = 'FR3.' + base62(encoder.encode(JSON.stringify({ version: 2, playerUuid: senderId, signingPublicJwk: await crypto.subtle.exportKey('jwk', keys.publicKey) })))
  const payload = {
    version: 2, transferId: crypto.randomUUID(), senderId, recipientId: recipient.playerUuid, issuedAt: Date.now(),
    dropId: crypto.randomUUID(), cardId: 't-classique', finish: 'normal', artVariant: 'standard',
  }
  const fragments = { version: 1, transferId: crypto.randomUUID(), senderId, recipientId: recipient.playerUuid, issuedAt: Date.now(), amount: 137 }
  async function signed(prefix: string, data: unknown, domain: string) {
    const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.privateKey, encoder.encode(domain + JSON.stringify(data)))
    return prefix + '.' + base62(encoder.encode(JSON.stringify({ payload: data, signature: Buffer.from(signature).toString('base64url') })))
  }
  const card = await signed('TR3', payload, cardDomain), fragmentCode = await signed('TF2', fragments, fragmentDomain)
  // Include leading zero bytes, every block boundary, all byte values and the
  // largest binary value fitting within the collection's text limit.
  const vectors = [0, 1, 2, 31, 32, 33, 63, 64, 65, 256, 24_382].map(length => {
    const bytes = Uint8Array.from({ length }, (_, i) => i < 3 ? 0 : (i * 73 + Math.floor(i / 256)) & 255)
    return { bytes: Array.from(bytes), code: base62(bytes) }
  })
  const output = await page.evaluate(async ({ contact, card, fragmentCode, fixture, vectors }) => {
    const servicePath = '/src/exchanges/services.ts', cryptoPath = '/src/exchanges/crypto.ts'
    const transferPath = '/src/exchanges/transferFile.ts', collectionPath = '/src/collection/collectionCrypto.ts'
    const collectionFilePath = '/src/collection/collectionFile.ts', codecPath = '/src/encoding/base62.ts'
    const dbPath = '/src/storage/database.ts'
    const services = await import(servicePath), protocol = await import(cryptoPath), transferFile = await import(transferPath)
    const collections = await import(collectionPath), collectionFiles = await import(collectionFilePath), codec = await import(codecPath)
    const { db } = await import(dbPath), identity = await services.ensureIdentity()
    await services.addContact(' \n' + contact + '\n ', 'Ami externe')
    const friend = await protocol.parseContactCode(contact)
    for (const vector of vectors) {
      if (codec.base62(new Uint8Array(vector.bytes)) !== vector.code || JSON.stringify(Array.from(codec.unbase62(vector.code))) !== JSON.stringify(vector.bytes)) throw new Error('Encodage différent entre plateformes.')
    }
    const cardFile = new File([transferFile.serializeTransferFile(card)], 'carte.btcg')
    const receivedCard = await services.receiveCode(await transferFile.readTransferFile(cardFile))
    const receivedFragments = await services.receiveCode(' \n' + fragmentCode + '\n ')
    const fragmentFile = new File([transferFile.serializeTransferFile(fragmentCode)], 'fragments.btcg')
    let replayRejected = false
    try { await services.receiveCode(await transferFile.readTransferFile(fragmentFile)) } catch { replayRejected = true }
    const fixtureContact = await protocol.parseContactCode('FR3.' + codec.base62(new TextEncoder().encode(JSON.stringify({ version: 2, playerUuid: fixture.senderId, signingPublicJwk: fixture.publicJwk }))))
    const collectionCode = fixture.vectors[0].code
    const collectionFile = new File([collectionFiles.collectionFileContents(collectionCode)], 'collection.btcg')
    const collection = await collections.verifyCollection(await collectionFiles.readCollectionFile(collectionFile), [fixtureContact])
    const ownCollection = await collections.signCollection(identity, collection.variants, 1_700_000_000)
    const sentCard = await protocol.signTransfer(identity, friend, { dropId: crypto.randomUUID(), cardId: 't-classique', finish: 'normal', artVariant: 'standard' })
    const sentFragments = await protocol.signFragmentTransfer(identity, friend, 19)
    return {
      receivedCard, receivedFragments, replayRejected, balance: (await db.player.get('local')).fragments,
      collection: collection.variants, ownCollection, card: sentCard.code, fragments: sentFragments.code,
    }
  }, { contact, card, fragmentCode, fixture, vectors })
  expect(output.receivedCard).toMatchObject({ kind: 'card', card: { dropId: payload.dropId, cardId: payload.cardId } })
  expect(output.receivedFragments).toMatchObject({ kind: 'fragments', senderId, amount: 137 })
  expect(output.balance).toBe(137)
  expect(output.replayRejected).toBe(true)
  expect(output.collection).toEqual(fixture.expected)
  expect(output.card).toMatch(/^TR3\.[A-Za-z0-9]+$/)
  expect(output.fragments).toMatch(/^TF2\.[A-Za-z0-9]+$/)
  expect(output.ownCollection).toMatch(/^CL2\.[A-Za-z0-9]+$/)
  const publicKey = await crypto.subtle.importKey('jwk', recipient.signingPublicJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
  for (const [code, domain] of [[output.card, cardDomain], [output.fragments, fragmentDomain]]) {
    const envelope = JSON.parse(decoder.decode(unbase62(code.slice(4))))
    const p = envelope.payload
    const canonical = code.startsWith('TR3.') ? {
      version: p.version, transferId: p.transferId, senderId: p.senderId, recipientId: p.recipientId, issuedAt: p.issuedAt,
      dropId: p.dropId, cardId: p.cardId, finish: p.finish, artVariant: p.artVariant,
    } : p
    expect(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, Buffer.from(envelope.signature, 'base64url'), encoder.encode(domain + JSON.stringify(canonical)))).toBe(true)
  }
  const collection = unbase62(output.ownCollection.slice(4))
  expect(await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, collection.slice(-64), new Uint8Array([...encoder.encode('BizaveTCG/CollectionSnapshot/v3\n'), ...collection.slice(0, -64)]))).toBe(true)
})
