import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Dexie } from 'dexie'
import { BizaveDatabase } from './database'
import { advanceReveal, buyBooster, duplicateDrops, finishOpening, initializeDatabase, openBooster as openConfiguredBooster, recycleDrops, refreshRecharge } from './services'
import { fixtureBoosters } from '../test-fixtures'
import { getRecycleFragments, uuid, variantKey } from '../game/engine'
import { FREE_PACK_RECHARGE_MS } from '../game/config'
import { cardById } from '../data/cards'
import { boosters as publishedBoosters } from '../data/boosters'
import type { CardDropRow } from '../game/types'

let db: BizaveDatabase
const openBooster = (id: string, database = db, now = Date.now()) => openConfiguredBooster(id, database, now, fixtureBoosters)
beforeEach(async () => { db = new BizaveDatabase(`test-${uuid()}`); await initializeDatabase(db, 0) })
afterEach(async () => { await db.delete() })
async function drop(overrides: Partial<CardDropRow> = {}): Promise<CardDropRow> {
  const row: CardDropRow = { dropId: uuid(), cardId: 't-classique', finish: 'normal', artVariant: 'standard', status: 'owned', acquiredAt: 0, updatedAt: 0, ...overrides }
  await db.drops.add(row)
  await db.discoveries.put({ cardId: row.cardId, finish: row.finish, artVariant: row.artVariant, key: variantKey(row), firstDiscoveredAt: 0 })
  return row
}
describe('ouvertures transactionnelles', () => {
  it('persiste le débit, les 5 exemplaires, découvertes et résultats ensemble', async () => {
    const record = await openBooster('eclats', db, 10)
    expect(await db.drops.count()).toBe(5)
    expect((await db.player.get('local'))?.freePackStock).toBe(4)
    expect((await db.player.get('local'))?.nextFreePackAt).toBe(10 + FREE_PACK_RECHARGE_MS)
    expect((await db.openings.get(record.id))?.results).toEqual(record.results)
    for (const c of record.results) { expect(c.artVariant).toBeTruthy(); expect(await db.discoveries.get(variantKey(c))).toBeDefined() }
    db.close(); await db.open()
    expect((await db.openings.get(record.id))?.results).toEqual(record.results)
  })
  it('reprend la même ouverture après rafraîchissement, sans débit ni reroll', async () => {
    const record = await openBooster('eclats', db, 10)
    await advanceReveal(record.id, db); await advanceReveal(record.id, db)
    const resumed = await openConfiguredBooster('nocturne', db, 20, [{ ...fixtureBoosters[1], title: 'Nouveau titre', access: { type: 'shop', price: 90 } }])
    expect(resumed.id).toBe(record.id); expect(resumed.results).toEqual(record.results); expect(resumed.revealedCount).toBe(2)
    expect((await db.player.get('local'))?.freePackStock).toBe(4)
    expect(await db.drops.count()).toBe(5)
  })
  it('deux connexions ne dépensent pas le dernier crédit deux fois', async () => {
    await db.player.update('local', { freePackStock: 1, nextFreePackAt: 600_000 })
    const second = new BizaveDatabase(db.name); await second.open()
    try {
      const results = await Promise.all([openBooster('eclats', db, 0), openBooster('eclats', second, 0)])
      expect(results[0].id).toBe(results[1].id)
      expect(await db.drops.count()).toBe(5)
      expect((await db.player.get('local'))?.freePackStock).toBe(0)
      await finishOpening(results[0].id, db)
      await expect(openBooster('eclats', second, 1)).rejects.toThrow(/épuisé/)
    } finally { second.close() }
  })
  it('l’achat débite 60, puis l’ouverture respecte son pool sans second paiement ni crédit gratuit', async () => {
    await db.player.update('local', { fragments: 100, freePackStock: 3, nextFreePackAt: 300_000 })
    await buyBooster('nocturne', db, 10_000, fixtureBoosters)
    expect(await db.drops.count()).toBe(0)
    expect(await db.openings.count()).toBe(0)
    expect((await db.boosterStock.get('nocturne'))?.quantity).toBe(1)
    const result = await openBooster('nocturne', db, 20_000)
    const player = await db.player.get('local')
    expect(player?.fragments).toBe(40); expect(player?.freePackStock).toBe(3); expect(player?.nextFreePackAt).toBe(300_000)
    expect(result.results.every(c => cardById.get(c.cardId)?.collectionId === 'speciaux')).toBe(true)
    expect(result.payment).toBe('shop'); expect(result.fragmentsSpent).toBe(0)
    expect((await db.boosterStock.get('nocturne'))?.quantity).toBe(0)
  })
  it('un échec annule toutes les écritures et un solde insuffisant ne crée rien', async () => {
    await expect(buyBooster('nocturne', db, 0, fixtureBoosters)).rejects.toThrow(/fragments/)
    await expect(openBooster('nocturne', db, 0)).rejects.toThrow(/possédez/)
    expect(await db.drops.count()).toBe(0); expect(await db.openings.count()).toBe(0)
    const fail = () => { throw new Error('Erreur de stockage simulée') }
    db.openings.hook('creating', fail)
    await expect(openBooster('eclats', db, 0)).rejects.toThrow(/simulée/)
    db.openings.hook('creating').unsubscribe(fail)
    expect(await db.drops.count()).toBe(0); expect(await db.discoveries.count()).toBe(0); expect((await db.player.get('local'))?.freePackStock).toBe(5)
  })
  it('recharge au retour, conserve la progression et résiste au recul de l’horloge', async () => {
    await db.player.update('local', { freePackStock: 0, nextFreePackAt: 600_000 })
    expect((await refreshRecharge(db, 9 * 60_000)).freePackStock).toBe(0)
    expect((await refreshRecharge(db, 25 * 60_000)).freePackStock).toBe(2)
    const result = await openBooster('eclats', db, 24 * 60_000)
    expect(result.openedAt).toBe(25 * 60_000)
    expect((await db.player.get('local'))?.nextFreePackAt).toBe(30 * 60_000)
    expect((await refreshRecharge(db, 3 * 86400_000)).freePackStock).toBe(5)
    expect((await db.player.get('local'))?.nextFreePackAt).toBeNull()
  })
})
describe('recyclage', () => {
  it('protège la dernière copie de chacune des six variantes et conserve les découvertes', async () => {
    const first = await drop(), second = await drop({ acquiredAt: 1 }), shiny = await drop({ finish: 'glossy' }), full = await drop({ artVariant: 'fullArt' })
    expect(duplicateDrops(await db.drops.toArray()).map(d => d.dropId)).toEqual([second.dropId])
    await expect(recycleDrops([shiny.dropId], false, db)).rejects.toThrow(/dernière/)
    await expect(recycleDrops([full.dropId], false, db)).rejects.toThrow(/dernière/)
    expect(await recycleDrops([second.dropId], false, db)).toBe(1)
    expect((await db.drops.get(first.dropId))?.status).toBe('owned')
    expect((await db.drops.get(second.dropId))?.status).toBe('recycled')
    expect(await db.discoveries.count()).toBe(3)
    expect(await db.recycling.count()).toBe(1)
    expect(await recycleDrops([shiny.dropId], true, db)).toBe(2)
    expect(await db.discoveries.count()).toBe(3)
  })
  it('prévisualisation et crédit correspondent, une carte détruite ne rapporte plus rien', async () => {
    const card = await drop({ cardId: 't-bizarre', finish: 'alternative', artVariant: 'fullArt' })
    expect(await recycleDrops([card.dropId], true, db)).toBe(getRecycleFragments('legendary', 'alternative', 'fullArt'))
    expect((await db.player.get('local'))?.fragments).toBe(115)
    await expect(recycleDrops([card.dropId], true, db)).rejects.toThrow(/disponible/)
    expect((await db.player.get('local'))?.fragments).toBe(115)
  })
  it('deux recyclages concurrents ne créditent pas deux fois', async () => {
    const card = await drop()
    const results = await Promise.allSettled([recycleDrops([card.dropId], true, db), recycleDrops([card.dropId], true, db)])
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1)
    expect((await db.player.get('local'))?.fragments).toBe(1)
  })
})
describe('stocks de boosters et boutique', () => {
  const buy = (id = 'nocturne', database = db, time = 0, definitions = fixtureBoosters) => buyBooster(id, database, time, definitions)
  it('partage un seul stock et une seule échéance entre tous les gratuits', async () => {
    const definitions = [...fixtureBoosters, { ...fixtureBoosters[0], id: 'autre-gratuit' }]
    const first = await openConfiguredBooster('eclats', db, 10, definitions)
    await finishOpening(first.id, db)
    const second = await openConfiguredBooster('autre-gratuit', db, 20, definitions)
    expect((await db.player.get('local'))?.freePackStock).toBe(3)
    expect((await db.player.get('local'))?.nextFreePackAt).toBe(10 + FREE_PACK_RECHARGE_MS)
    expect((await refreshRecharge(db, 10 + FREE_PACK_RECHARGE_MS)).freePackStock).toBe(4)
    expect(second.boosterTitle).toBe(fixtureBoosters[0].title)
  })
  it('cumule et persiste les paquets achetés sans créer de cartes ni toucher au stock gratuit', async () => {
    await db.player.update('local', { fragments: 180, freePackStock: 2, nextFreePackAt: 600_000 })
    await buy(); await buy()
    db.close(); await db.open()
    expect((await db.boosterStock.get('nocturne'))?.quantity).toBe(2)
    expect(await db.boosterPurchases.count()).toBe(2)
    expect(await db.drops.count()).toBe(0); expect(await db.openings.count()).toBe(0)
    expect(await db.player.get('local')).toMatchObject({ fragments: 60, freePackStock: 2, nextFreePackAt: 600_000 })
    await refreshRecharge(db, 3 * 86400_000)
    expect((await db.boosterStock.get('nocturne'))?.quantity).toBe(2)
  })
  it('sérialise deux achats concurrents sans solde négatif', async () => {
    await db.player.update('local', { fragments: 60 })
    const second = new BizaveDatabase(db.name); await second.open()
    try {
      const results = await Promise.allSettled([buy(), buy('nocturne', second)])
      expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
      expect((await db.player.get('local'))?.fragments).toBe(0)
      expect((await db.boosterStock.get('nocturne'))?.quantity).toBe(1)
      expect(await db.boosterPurchases.count()).toBe(1)
    } finally { second.close() }
  })
  it('annule solde, stock et historique ensemble si l’achat échoue', async () => {
    await db.player.update('local', { fragments: 100 })
    const fail = () => { throw new Error('Échec achat simulé') }
    db.boosterPurchases.hook('creating', fail)
    await expect(buy()).rejects.toThrow(/simulé/)
    db.boosterPurchases.hook('creating').unsubscribe(fail)
    expect((await db.player.get('local'))?.fragments).toBe(100)
    expect(await db.boosterStock.count()).toBe(0)
    expect(await db.boosterPurchases.count()).toBe(0)
  })
  it('consomme une seule unité achetée, reprend la dernière ouverture et ne redébite pas les fragments', async () => {
    await db.player.update('local', { fragments: 60 })
    await buy()
    const [first, second] = await Promise.all([openBooster('nocturne', db, 10), openBooster('nocturne', db, 10)])
    expect(first.id).toBe(second.id)
    expect((await db.boosterStock.get('nocturne'))?.quantity).toBe(0)
    expect(await db.player.get('local')).toMatchObject({ fragments: 0, freePackStock: 5, nextFreePackAt: null })
    db.close(); await db.open()
    const resumed = await openBooster('nocturne', db, 20)
    expect(resumed).toEqual(first)
    expect(resumed.boosterTitle).toBe(fixtureBoosters[1].title)
    await finishOpening(first.id, db)
    await expect(openBooster('nocturne', db, 21)).rejects.toThrow(/possédez/)
    expect(await db.drops.count()).toBe(first.results.length)
  })
  it('restaure le paquet acheté et toutes les données si son ouverture échoue', async () => {
    await db.player.update('local', { fragments: 60 })
    await buy()
    const fail = () => { throw new Error('Échec ouverture simulé') }
    db.openings.hook('creating', fail)
    await expect(openBooster('nocturne')).rejects.toThrow(/simulé/)
    db.openings.hook('creating').unsubscribe(fail)
    expect((await db.boosterStock.get('nocturne'))?.quantity).toBe(1)
    expect((await db.player.get('local'))?.fragments).toBe(0)
    expect(await db.drops.count()).toBe(0); expect(await db.discoveries.count()).toBe(0)
  })
  it('refuse les achats gratuits, désactivés ou retirés, mais laisse ouvrir les paquets déjà achetés', async () => {
    await db.player.update('local', { fragments: 200 })
    await expect(buy('eclats')).rejects.toThrow(/boutique/)
    await expect(buy('absent')).rejects.toThrow(/boutique/)
    await expect(buy('nocturne', db, 0, [{ ...fixtureBoosters[1], enabled: false }])).rejects.toThrow(/boutique/)
    await buy()
    const definitions = [{ ...fixtureBoosters[1], access: { type: 'shop' as const, price: 60, listed: false }, cardsPerPack: 3 }]
    await expect(buy('nocturne', db, 0, definitions)).rejects.toThrow(/boutique/)
    const result = await openConfiguredBooster('nocturne', db, 1, definitions)
    expect(result.results).toHaveLength(3)
    expect((await db.player.get('local'))?.fragments).toBe(140)
  })
})
describe('migrations et archives', () => {
  it('ajoute le registre des cadeaux à une partie du schéma 5 sans changer ses données', async () => {
    const name = `migration-v5-${uuid()}`, old = new Dexie(name)
    const stores = Object.fromEntries(db.tables.filter(table => table.name !== 'usedGiftCodes').map(table => [table.name, [table.schema.primKey.src, ...table.schema.indexes.map(index => index.src)].join(', ')]))
    old.version(5).stores(stores)
    const player = { id: 'local', fragments: 73, freePackStock: 2, nextFreePackAt: 600_000, maxObservedClockAt: 100, schemaVersion: 5 }
    const stock = { boosterId: 'phantom-blood', quantity: 7, updatedAt: 100 }
    await old.table('player').add(player)
    await old.table('boosterStock').add(stock)
    old.close()
    const upgraded = new BizaveDatabase(name)
    try {
      await upgraded.open()
      expect(await upgraded.player.get('local')).toEqual({ ...player, schemaVersion: 6 })
      expect(await upgraded.boosterStock.get(stock.boosterId)).toEqual(stock)
      expect(await upgraded.usedGiftCodes.count()).toBe(0)
    } finally { await upgraded.delete() }
  })

  it('ajoute les stocks de paquets à une sauvegarde V2 sans toucher aux cartes, transferts ou échéances', async () => {
    const name = `migration-v2-${uuid()}`, old = new Dexie(name)
    old.version(2).stores({ drops: '&dropId, cardId, [cardId+finish+artVariant], finish, artVariant, status', discoveries: '&key, cardId, [cardId+finish+artVariant], artVariant', player: '&id', openings: '&id, openedAt, boosterId', recycling: '&id, createdAt', identity: '&id', friends: '&playerUuid', outbox: '&transferId, dropId, createdAt', usedTransfers: '&transferId', definitions: '&id' })
    const owned: CardDropRow = { dropId: uuid(), cardId: 't-classique', finish: 'glossy', artVariant: 'fullArt', status: 'owned', acquiredAt: 12, updatedAt: 12 }
    const player = { id: 'local', fragments: 73, freePackStock: 2, nextFreePackAt: 600_000, maxObservedClockAt: 100, schemaVersion: 2 }
    const outgoing = { transferId: uuid(), dropId: uuid(), recipientId: '1234-56-78', code: 'TR2.keep', createdAt: 11, status: 'generated' }
    const legacyOpening = { id: uuid(), boosterId: 'nocturne', openedAt: 12, payment: 'fragments', fragmentsSpent: 60, results: [{ dropId: owned.dropId, cardId: owned.cardId, finish: owned.finish, artVariant: owned.artVariant }], revealComplete: false, revealedCount: 1 }
    await old.table('player').put(player); await old.table('drops').put(owned); await old.table('outbox').put(outgoing)
    await old.table('openings').put(legacyOpening)
    old.close()
    const upgraded = new BizaveDatabase(name)
    try {
      await upgraded.open()
      expect(await upgraded.player.get('local')).toEqual({ ...player, schemaVersion: 6 })
      expect(await upgraded.drops.get(owned.dropId)).toEqual(owned)
      expect(await upgraded.outbox.get(outgoing.transferId)).toEqual(outgoing)
      expect(await upgraded.openings.get(legacyOpening.id)).toEqual(legacyOpening)
      expect(await upgraded.boosterStock.count()).toBe(0)
      expect(await upgraded.boosterPurchases.count()).toBe(0)
    } finally { await upgraded.delete() }
  })
  it('répare artVariant et les clés de découverte en gardant transferts, solde et historique', async () => {
    const name = `migration-${uuid()}`, old = new Dexie(name)
    old.version(1).stores({ drops: '&dropId, cardId, [cardId+finish+artVariant], finish, artVariant, status', discoveries: '&key, cardId, [cardId+finish+artVariant], artVariant', player: '&id', openings: '&id, openedAt, boosterId', recycling: '&id, createdAt', identity: '&id', friends: '&playerUuid', outbox: '&transferId, dropId, createdAt', usedTransfers: '&transferId', definitions: '&id' })
    await old.open()
    const dropId = uuid(), transferId = uuid()
    await old.table('drops').add({ dropId, cardId: 't-classique', finish: 'normal', status: 'owned', acquiredAt: 10, updatedAt: 10 })
    await old.table('discoveries').add({ key: 't-classique::normal', cardId: 't-classique', finish: 'normal', firstDiscoveredAt: 10 })
    await old.table('player').add({ id: 'local', fragments: 17, freePackStock: 3, nextFreePackAt: 600000, maxObservedClockAt: 10, schemaVersion: 1 })
    await old.table('usedTransfers').add({ transferId, receivedAt: 12 })
    await old.table('outbox').add({ transferId, dropId, recipientId: '1234-56-78', code: 'TR2.saved', createdAt: 10, status: 'generated' })
    await old.table('openings').add({ id: uuid(), boosterId: 'eclats', results: [{ dropId, cardId: 't-classique', finish: 'normal' }], revealComplete: false })
    old.close()
    const upgraded = new BizaveDatabase(name)
    try {
      await upgraded.open()
      expect((await upgraded.drops.get(dropId))?.artVariant).toBe('standard')
      expect(await upgraded.discoveries.get('t-classique::normal::standard')).toBeDefined()
      expect((await upgraded.player.get('local'))?.fragments).toBe(17)
      expect(await upgraded.usedTransfers.get(transferId)).toEqual({ transferId, receivedAt: 12 })
      expect((await upgraded.outbox.get(transferId))?.code).toBe('TR2.saved')
      expect((await upgraded.openings.toArray())[0].results[0].artVariant).toBe('standard')
    } finally { await upgraded.delete() }
  })
  it('garde les définitions retirées pour interpréter les exemplaires anciens', async () => {
    await db.definitions.put({ id: 'retired', title: 'Archive', description: '', rarity: 'rare', collectionId: 'old', artwork: { standard: '/old.svg', fullArt: '/old-full.svg' } })
    await initializeDatabase(db, 0)
    expect((await db.definitions.get('retired'))?.rarity).toBe('rare')
    expect(cardById.get('retired')?.rarity).toBe('rare')
  })
})

describe('Memory Frame gratuit et acheté', () => {
  const id = 'phantom-blood'
  const open = (time = 0) => openConfiguredBooster(id, db, time, publishedBoosters)
  const buy = () => buyBooster(id, db, 0, publishedBoosters)
  it('vend une unité à 70 fragments, sans modifier le gratuit ni créer de cartes', async () => {
    await db.player.update('local', { fragments: 140 })
    const purchase = await buy()
    expect(purchase).toMatchObject({ boosterId: id, unitPrice: 70, fragmentsSpent: 70 })
    expect(await db.player.get('local')).toMatchObject({ fragments: 70, freePackStock: 5, nextFreePackAt: null })
    expect((await db.boosterStock.get(id))?.quantity).toBe(1)
    expect(await db.drops.count()).toBe(0)
    await buy()
    await expect(buy()).rejects.toThrow(/fragments/)
    expect((await db.boosterStock.get(id))?.quantity).toBe(2)
    expect(await db.boosterPurchases.count()).toBe(2)
  })
  it('consomme le gratuit en priorité et conserve la réserve achetée', async () => {
    await db.player.update('local', { fragments: 70 })
    await buy()
    const opening = await open(10)
    expect(opening.payment).toBe('free')
    expect(await db.player.get('local')).toMatchObject({ fragments: 0, freePackStock: 4, nextFreePackAt: 10 + FREE_PACK_RECHARGE_MS })
    expect((await db.boosterStock.get(id))?.quantity).toBe(1)
  })
  it('ouvre la réserve sans nouveau débit et garde le minuteur quand le gratuit est vide', async () => {
    await db.player.update('local', { fragments: 70, freePackStock: 0, nextFreePackAt: FREE_PACK_RECHARGE_MS })
    await buy()
    const opening = await open(10)
    expect(opening).toMatchObject({ payment: 'shop', fragmentsSpent: 0 })
    expect(opening.results).toHaveLength(5)
    expect(await db.player.get('local')).toMatchObject({ fragments: 0, freePackStock: 0, nextFreePackAt: FREE_PACK_RECHARGE_MS })
    expect((await db.boosterStock.get(id))?.quantity).toBe(0)
    db.close(); await db.open()
    expect((await open(20)).id).toBe(opening.id)
    await finishOpening(opening.id, db)
    await expect(open(30)).rejects.toThrow(/épuisé/)
    expect(await db.drops.count()).toBe(5)
  })
  it('applique une recharge arrivée à échéance avant de choisir la réserve', async () => {
    await db.player.update('local', { fragments: 70, freePackStock: 0, nextFreePackAt: FREE_PACK_RECHARGE_MS })
    await buy()
    expect((await open(FREE_PACK_RECHARGE_MS)).payment).toBe('free')
    expect((await db.boosterStock.get(id))?.quantity).toBe(1)
    expect(await db.player.get('local')).toMatchObject({ freePackStock: 0, nextFreePackAt: 2 * FREE_PACK_RECHARGE_MS })
  })
  it('annule la réserve et les cartes ensemble en cas d’échec de l’ouverture', async () => {
    await db.player.update('local', { fragments: 70, freePackStock: 0, nextFreePackAt: FREE_PACK_RECHARGE_MS })
    await buy()
    const fail = () => { throw new Error('Stockage interrompu') }
    db.openings.hook('creating', fail)
    await expect(open(10)).rejects.toThrow(/interrompu/)
    db.openings.hook('creating').unsubscribe(fail)
    expect((await db.boosterStock.get(id))?.quantity).toBe(1)
    expect(await db.drops.count()).toBe(0)
    expect(await db.discoveries.count()).toBe(0)
  })
})

describe('Anima Isekai exclusif à la boutique', () => {
  it('refuse le gratuit, débite 50 fragments puis ouvre cinq cartes de son pool sans autre dépense', async () => {
    const id = 'anima-isekai'
    await expect(openConfiguredBooster(id, db, 0, publishedBoosters)).rejects.toThrow(/aucun exemplaire/)
    await db.player.update('local', { fragments: 49 })
    await expect(buyBooster(id, db, 0, publishedBoosters)).rejects.toThrow(/fragments/)
    expect(await db.boosterPurchases.count()).toBe(0)
    await db.player.update('local', { fragments: 50 })
    const purchase = await buyBooster(id, db, 0, publishedBoosters)
    expect(purchase).toMatchObject({ boosterId: id, boosterTitle: 'Anima Isekai', unitPrice: 50, fragmentsSpent: 50 })
    expect(await db.drops.count()).toBe(0)
    expect((await db.boosterStock.get(id))?.quantity).toBe(1)
    const opening = await openConfiguredBooster(id, db, 10, publishedBoosters)
    expect(opening).toMatchObject({ payment: 'shop', fragmentsSpent: 0, boosterTitle: 'Anima Isekai' })
    expect(opening.results).toHaveLength(5)
    const source = publishedBoosters.find(booster => booster.id === id)!.sources[0]
    if (source.type !== 'cards') throw new Error('Pool explicite attendu')
    expect(opening.results.every(card => source.cardIds.includes(card.cardId))).toBe(true)
    expect(await db.player.get('local')).toMatchObject({ fragments: 0, freePackStock: 5, nextFreePackAt: null })
    expect((await db.boosterStock.get(id))?.quantity).toBe(0)
    await finishOpening(opening.id, db)
    await expect(openConfiguredBooster(id, db, 20, publishedBoosters)).rejects.toThrow(/aucun exemplaire/)
    expect(await db.drops.count()).toBe(5)
  })
})
