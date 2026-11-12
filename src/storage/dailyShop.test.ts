import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cards } from '../data/cards'
import { createDailyShop, rollDailyBundle, eligibleDailyEntries, rollDailyCards } from '../game/dailyShop'
import { uuid } from '../game/engine'
import { buyDailyBundle, buyDailyCard, openDailyBooster, refreshDailyShop } from './dailyShop'
import { BizaveDatabase } from './database'
import { buyBooster, finishOpening, initializeDatabase, refreshRecharge } from './services'
import { claimWeeklyBonus, refreshWeeklyShop } from './weeklyShop'
import { exportSave, importSave, parseSaveFile } from './saveTransfer'
import { ensureInstallation } from './installation'
import { DEFAULT_PREFERENCES } from '../settings/preferences'
import Dexie from 'dexie'
import { redeemGiftCode } from '../gifts/services'
import { giftCodeByHash } from '../gifts/catalogue'
import { hashGiftCode } from '../gifts/format'
import { openBooster } from './services'

let db: BizaveDatabase
const now = Date.parse('2026-11-12T12:00:00Z')
beforeEach(async () => { db = new BizaveDatabase('daily-' + uuid()); await initializeDatabase(db, now); await db.player.update('local', { fragments: 100000 }); await db.dailyShop.put(createDailyShop(cards, now, () => 0)) })
afterEach(async () => { vi.useRealTimers(); await db.delete() })
it('persiste une seule offre, résiste à deux onglets et ne journalise aucun achat', async () => {
  const original = await refreshDailyShop(db, now)
  expect(await refreshDailyShop(db, now + 1000)).toEqual(original)
  const second = new BizaveDatabase(db.name); await second.open()
  try {
    const results = await Promise.allSettled([buyDailyBundle(original.dayStart, db, now), buyDailyBundle(original.dayStart, second, now)])
    expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1)
    expect((await db.player.get('local'))!.fragments).toBe(100000 - original.bundle.price)
    expect((await db.dailyShop.get('current'))!.bundle).toMatchObject({ owned: original.bundle.quantity, purchased: true })
    expect(await db.boosterStock.count()).toBe(0)
    expect(await db.boosterPurchases.count()).toBe(0)
    await refreshDailyShop(db, original.renewAt + 5 * 86400_000)
    expect(await db.dailyShop.count()).toBe(1)
    await expect(buyDailyBundle(original.dayStart, db, original.renewAt)).rejects.toThrow('renouvelée')
  } finally { second.close() }
})
it('ouvre le stock journalier classique sans toucher aux stocks gratuit et permanent', async () => {
  const shop = (await db.dailyShop.get('current'))!
  await buyBooster('phantom-blood', db, now)
  await buyDailyBundle(shop.dayStart, db, now)
  const player = await db.player.get('local'), stock = await db.boosterStock.toArray()
  const opening = await openDailyBooster(shop.dayStart, shop.bundle.boosterId, db, now)
  expect(opening).toMatchObject({ boosterId: 'phantom-blood', payment: 'shop', revealedCount: 0 })
  expect(opening.results).toHaveLength(5)
  expect(await db.player.get('local')).toEqual(player)
  expect(await db.boosterStock.toArray()).toEqual(stock)
  expect((await db.dailyShop.get('current'))!.bundle.owned).toBe(shop.bundle.quantity - 1)
  expect(await db.drops.count()).toBe(5)
  await refreshRecharge(db, shop.renewAt)
  expect((await db.dailyShop.get('current'))!.bundle.owned).toBe(0)
  expect(await openDailyBooster(shop.dayStart, shop.bundle.boosterId, db, shop.renewAt)).toEqual(opening)
  expect(await db.drops.count()).toBe(5)
  await finishOpening(opening.id, db)
  await expect(openDailyBooster(shop.dayStart, shop.bundle.boosterId, db, shop.renewAt)).rejects.toThrow('renouvelée')
})
it('attribue chaque carte une seule fois et les conserve après minuit', async () => {
  const shop = (await db.dailyShop.get('current'))!
  let first = true
  shop.cards = rollDailyCards(cards, () => { if (first) { first = false; return .99 } return 0 })
  await db.dailyShop.put(shop)
  const results = await Promise.allSettled([buyDailyCard(shop.dayStart, '0', db, now), buyDailyCard(shop.dayStart, '0', db, now)])
  expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1)
  expect(await db.drops.count()).toBe(1)
  expect(await db.discoveries.count()).toBe(1)
  await refreshDailyShop(db, shop.renewAt)
  expect(await db.drops.count()).toBe(1)
  expect(await db.discoveries.count()).toBe(1)
})
it('annule débit et vente si une écriture échoue, refuse les fonds insuffisants et le compte exporté', async () => {
  const shop = (await db.dailyShop.get('current'))!
  await db.player.update('local', { fragments: 0 })
  await expect(buyDailyBundle(shop.dayStart, db, now)).rejects.toThrow('fragments')
  await db.player.update('local', { fragments: 100000 })
  const fail = () => { throw new Error('Écriture impossible') }
  db.dailyShop.hook('updating', fail)
  await expect(buyDailyBundle(shop.dayStart, db, now)).rejects.toThrow('Écriture impossible')
  db.dailyShop.hook('updating').unsubscribe(fail)
  expect((await db.player.get('local'))!.fragments).toBe(100000)
  expect(await db.dailyShop.get('current')).toEqual(shop)
  await db.accountState.put({ id: 'local', status: 'exported', transferId: uuid(), recipientId: '1234-56-78', file: '' })
  await expect(buyDailyBundle(shop.dayStart, db, now)).rejects.toThrow()
})
it('renouvelle le quotidien au reroll, conserve les packs achetés et refuse les anciennes offres', async () => {
  const shop = (await db.dailyShop.get('current'))!, weekly = await refreshWeeklyShop(db, now)
  await buyDailyBundle(shop.dayStart, db, now)
  await claimWeeklyBonus(weekly.weekStart, 'reroll', db, now)
  const rerolled = await refreshDailyShop(db, now - 86400_000)
  expect(rerolled).toMatchObject({ dayStart: shop.dayStart, renewAt: shop.renewAt, rerollCount: 1, priorBundles: [{ boosterId: shop.bundle.boosterId, owned: shop.bundle.quantity }] })
  await expect(buyDailyBundle(shop.dayStart, db, now)).rejects.toThrow('renouvelée')
  await openDailyBooster(shop.dayStart, shop.bundle.boosterId, db, now)
  expect((await db.dailyShop.get('current'))!.priorBundles![0].owned).toBe(shop.bundle.quantity - 1)
  await refreshDailyShop(db, shop.renewAt)
  const next = (await db.dailyShop.get('current'))!
  expect(await refreshDailyShop(db, now)).toEqual(next)
})
it('ferme le lot exactement deux heures avant minuit, mais autorise les cartes et les ouvertures', async () => {
  const shop = (await db.dailyShop.get('current'))!
  shop.cards = createDailyShop(cards, now, () => .5).cards
  await db.dailyShop.put(shop)
  await expect(buyDailyBundle(shop.dayStart, db, shop.renewAt - 7200000)).rejects.toThrow('fermées')
  await buyDailyCard(shop.dayStart, '0', db, shop.renewAt - 7200000)
  expect(await db.drops.count()).toBe(1)
})
it('respecte les cartes temporaires de Noël même après désactivation de l’événement', async () => {
  const shop = (await db.dailyShop.get('current'))!
  shop.bundle = rollDailyBundle(eligibleDailyEntries(cards, true), 896, () => .99)
  await db.dailyShop.put(shop)
  await buyDailyBundle(shop.dayStart, db, now)
  const opening = await openDailyBooster(shop.dayStart, 'christmas-gift', db, now)
  expect(opening.results).toHaveLength(1)
  expect(opening.results[0]).toMatchObject({ finish: 'normal', artVariant: 'standard' })
  expect(await db.drops.count()).toBe(0)
  expect(await db.discoveries.count()).toBe(0)
})
it('transfère le lot courant et renouvelle un import expiré sans perdre l’ouverture engagée', async () => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(now)
  const target = new BizaveDatabase('daily-target-' + uuid())
  try {
    await initializeDatabase(target, now)
    const shop = (await db.dailyShop.get('current'))!
    await buyDailyBundle(shop.dayStart, db, now)
    const opening = await openDailyBooster(shop.dayStart, shop.bundle.boosterId, db, now)
    const file = await exportSave((await ensureInstallation(target)).installationId, DEFAULT_PREFERENCES, db)
    expect((await parseSaveFile(file)).payload.tables.dailyShop![0].bundle.owned).toBe(shop.bundle.quantity - 1)
    expect(await db.dailyShop.count()).toBe(0)
    vi.setSystemTime(shop.renewAt)
    await importSave(file, target)
    expect((await target.dailyShop.get('current'))!.bundle.owned).toBe(0)
    expect(await target.openings.get(opening.id)).toEqual(opening)
    expect(await target.drops.count()).toBe(5)
  } finally { await target.delete() }
})
it('réserve legenda completa au quotidien, y compris pour les cadeaux et les stocks ordinaires', async () => {
  await expect(buyBooster('legenda-completa', db, now)).rejects.toThrow('boutique')
  await db.boosterStock.put({ boosterId: 'legenda-completa', quantity: 1, updatedAt: now })
  await expect(openBooster('legenda-completa', db, now)).rejects.toThrow('indisponible')
  const code = 'ZZZZ-ZZZZ-ZZZZ-ZZZZ', hash = await hashGiftCode(code)
  giftCodeByHash.set(hash, { codeHash: hash, issuedAt: now - 1000, expiresAt: now + 1000, reward: { type: 'booster', boosterId: 'legenda-completa', quantity: 1 } })
  try { await expect(redeemGiftCode(code, db, now)).rejects.toThrow('indisponible') } finally { giftCodeByHash.delete(hash) }
  expect((await db.player.get('local'))!.fragments).toBe(100000)
})
it('transfère la journée en cours avec son stock, son prix et ses cartes vendues', async () => {
  vi.useFakeTimers({ toFake: ['Date'] }); vi.setSystemTime(now)
  const target = new BizaveDatabase('daily-current-' + uuid())
  try {
    await initializeDatabase(target, now)
    const original = await refreshDailyShop(db, now)
    original.cards = createDailyShop(cards, now, () => .5).cards
    await db.dailyShop.put(original)
    await buyDailyCard(original.dayStart, '0', db, now)
    await buyDailyBundle(original.dayStart, db, now)
    const expected = await db.dailyShop.get('current')
    const file = await exportSave((await ensureInstallation(target)).installationId, DEFAULT_PREFERENCES, db)
    await importSave(file, target)
    expect(await target.dailyShop.get('current')).toEqual(expected)
    await expect(buyDailyBundle(original.dayStart, target, now)).rejects.toThrow('déjà')
  } finally { await target.delete() }
})
it('migre une partie du schéma 12 sans remise à zéro ni création rétroactive de boutique', async () => {
  const name = 'daily-migration-' + uuid(), legacy = new Dexie(name)
  legacy.version(12).stores(Object.fromEntries(db.tables.filter(t => t.name !== 'dailyShop').map(t => [t.name, [t.schema.primKey.src, ...t.schema.indexes.map(i => i.src)].join(',')])))
  const player = { ...(await db.player.get('local'))!, schemaVersion: 12 }
  await legacy.table('player').put(player)
  await legacy.table('boosterStock').put({ boosterId: 'anima-isekai', quantity: 3, updatedAt: now })
  legacy.close()
  const upgraded = new BizaveDatabase(name)
  try {
    await initializeDatabase(upgraded, now)
    expect(await upgraded.player.get('local')).toEqual({ ...player, schemaVersion: 13 })
    expect((await upgraded.boosterStock.get('anima-isekai'))!.quantity).toBe(3)
    expect(await upgraded.dailyShop.count()).toBe(0)
    await refreshDailyShop(upgraded, now)
    expect(await upgraded.dailyShop.count()).toBe(1)
  } finally { await upgraded.delete() }
})
