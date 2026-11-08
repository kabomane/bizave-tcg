import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { BizaveDatabase } from './database'
import { buyWeeklyOffer, claimWeeklyBonus, refreshWeeklyShop } from './weeklyShop'
import { finishOpening, initializeDatabase, openBooster, refreshRecharge } from './services'
import { SALES_CLOSE_MS, WEEKLY_BOOSTER_ID, WEEKLY_REROLL_PRICE } from '../game/weeklyShop'
import { cards } from '../data/cards'
import { resolveBoosterPool, uuid } from '../game/engine'
import { exportSave, importSave, parseSaveFile } from './saveTransfer'
import { ensureInstallation } from './installation'
import { DEFAULT_PREFERENCES } from '../settings/preferences'

let db: BizaveDatabase
const now = Date.parse('2026-11-06T12:00:00Z')
beforeEach(async () => { db = new BizaveDatabase('weekly-' + uuid()); await initializeDatabase(db, now); await db.player.update('local', { fragments: 100_000 }) })
afterEach(async () => { await db.delete() })
describe('boutique hebdomadaire persistante', () => {
  it('réclame chaque bonus une fois, renouvelle le stock épuisé et ouvre les anciens boosters en premier', async () => {
    const shop = await refreshWeeklyShop(db, now)
    const common = cards.find(card => card.rarity === 'common')!
    shop.booster.definition.sources = [{ type: 'cards', cardIds: [common.id] }]
    shop.booster.definition.rates = { rarity: { common: 100, uncommon: 0, rare: 0, epic: 0, legendary: 0 } }
    shop.booster.stock = shop.booster.remaining = 1
    await db.weeklyShop.put(shop)
    const offer = shop.offers[0]
    await buyWeeklyOffer(shop.weekStart, 'booster', db, now)
    expect((await db.weeklyShop.get('current'))?.booster.remaining).toBe(0)
    await buyWeeklyOffer(shop.weekStart, offer.id, db, now)

    const second = new BizaveDatabase(db.name)
    await second.open()
    try {
      const [gift, duplicateGift] = await Promise.allSettled([
        claimWeeklyBonus(shop.weekStart, 'fragments', db, now),
        claimWeeklyBonus(shop.weekStart, 'fragments', second, now),
      ])
      const rewards = [gift, duplicateGift].flatMap(result => result.status === 'fulfilled' ? [result.value!] : [])
      expect(rewards).toHaveLength(1)
      expect(rewards[0]).toBeGreaterThanOrEqual(10)
      expect(rewards[0]).toBeLessThanOrEqual(300)
      expect(rewards[0] % 10).toBe(0)

      const rerolls = await Promise.allSettled([
        claimWeeklyBonus(shop.weekStart, 'reroll', db, now),
        claimWeeklyBonus(shop.weekStart, 'reroll', second, now),
      ])
      expect(rerolls.filter(result => result.status === 'fulfilled')).toHaveLength(1)
      const updated = (await db.weeklyShop.get('current'))!
      expect(updated).toMatchObject({ rerollUsed: true, rerollCount: 1, fragmentsClaimed: true, booster: { remaining: updated.booster.stock, owned: 0 }, priorBoosters: [{ owned: 1, definition: shop.booster.definition }] })
      expect(updated.booster.stock).toBeGreaterThanOrEqual(1)
      expect(updated.booster.stock).toBeLessThanOrEqual(4)
      expect(updated.booster.definition.sources).not.toEqual(shop.booster.definition.sources)
      expect(updated.offers.every(card => !card.sold)).toBe(true)
      expect(await db.drops.count()).toBe(1)
      expect((await db.player.get('local'))?.fragments).toBe(100_000 - shop.booster.price - offer.price - WEEKLY_REROLL_PRICE + rewards[0])
      await expect(buyWeeklyOffer(shop.weekStart, offer.id, db, now)).rejects.toThrow('renouvelée')
      await buyWeeklyOffer(shop.weekStart, updated.offers[0].id, db, now, 1)
      await buyWeeklyOffer(shop.weekStart, 'booster', db, now, 1)
      const opening = await openBooster(WEEKLY_BOOSTER_ID, db, now)
      expect(opening.results.map(card => card.cardId)).toEqual(Array(5).fill(common.id))
      const afterOpening = (await db.weeklyShop.get('current'))!
      expect(afterOpening.priorBoosters).toBeUndefined()
      expect(afterOpening.booster).toMatchObject({ owned: 1, remaining: updated.booster.stock - 1 })
      await finishOpening(opening.id, db)
      const newOpening = await openBooster(WEEKLY_BOOSTER_ID, db, now)
      const newPool = new Set(resolveBoosterPool(updated.booster.definition, cards).map(({ card }) => card.id))
      expect(newOpening.results.every(card => newPool.has(card.cardId))).toBe(true)
      expect((await db.weeklyShop.get('current'))?.booster.owned).toBe(0)
      const next = await refreshWeeklyShop(db, shop.rerollAt)
      expect(next.fragmentsClaimed).toBeUndefined()
      expect(next.rerollUsed).toBeUndefined()
      expect(await db.weeklyShop.count()).toBe(1)
    } finally { second.close() }
  })
  it('ne génère rien avant la première visite, puis conserve le même tirage au rechargement', async () => {
    expect(await db.weeklyShop.count()).toBe(0)
    const first = await refreshWeeklyShop(db, now)
    db.close(); await db.open()
    expect(await refreshWeeklyShop(db, now + 1000)).toEqual(first)
    expect(await db.weeklyShop.count()).toBe(1)
  })
  it('conserve les pools de plusieurs rerolls, dont un ancien lot issu d’une sauvegarde', async () => {
    const shop = await refreshWeeklyShop(db, now)
    const [first, second, third] = cards.filter(card => card.rarity === 'common')
    const definitionFor = (cardId: string) => ({
      ...shop.booster.definition,
      sources: [{ type: 'cards' as const, cardIds: [cardId] }],
      rates: { rarity: { common: 100, uncommon: 0, rare: 0, epic: 0, legendary: 0 } },
    })
    await db.weeklyShop.put({
      ...shop,
      rerollUsed: true,
      priorBooster: { definition: definitionFor(first.id), owned: 1 },
      booster: { ...shop.booster, definition: definitionFor(second.id), owned: 1, remaining: shop.booster.stock - 1 },
    })
    await db.player.update('local', { weeklyBonusCredits: { reroll: 2 } })
    await claimWeeklyBonus(shop.weekStart, 'reroll', db, now, 0)
    const refreshed = (await db.weeklyShop.get('current'))!
    expect(refreshed.rerollCount).toBe(2)
    await expect(buyWeeklyOffer(shop.weekStart, 'booster', db, now, 1)).rejects.toThrow(/renouvelée/)
    refreshed.booster.definition = definitionFor(third.id)
    // Keep the offer's displayed price aligned with its stored definition.
    refreshed.booster.definition.access = { type: 'shop', price: refreshed.booster.price, listed: false }
    await db.weeklyShop.put(refreshed)
    await buyWeeklyOffer(shop.weekStart, 'booster', db, now, 2)
    await claimWeeklyBonus(shop.weekStart, 'reroll', db, now, 0)
    expect((await db.weeklyShop.get('current'))?.priorBoosters).toHaveLength(3)
    for (const card of [first, second, third]) {
      const opening = await openBooster(WEEKLY_BOOSTER_ID, db, now)
      expect(opening.results.map(drop => drop.cardId)).toEqual(Array(5).fill(card.id))
      await finishOpening(opening.id, db)
    }
    expect((await db.weeklyShop.get('current'))?.priorBoosters).toBeUndefined()
  })
  it('sérialise deux achats de la même carte entre deux connexions', async () => {
    const shop = await refreshWeeklyShop(db, now), offer = shop.offers[0]
    const second = new BizaveDatabase(db.name); await second.open()
    try {
      const results = await Promise.allSettled([buyWeeklyOffer(shop.weekStart, offer.id, db, now), buyWeeklyOffer(shop.weekStart, offer.id, second, now)])
      expect(results.filter(r => r.status === 'fulfilled')).toHaveLength(1)
      expect((await db.player.get('local'))?.fragments).toBe(100_000 - offer.price)
      expect(await db.drops.count()).toBe(1)
      expect(await db.discoveries.count()).toBe(1)
      expect((await db.weeklyShop.get('current'))?.offers[0].sold).toBe(true)
      expect(await db.boosterPurchases.count()).toBe(0)
    } finally { second.close() }
  })
  it('annule le débit et la vente si l’attribution de la carte échoue', async () => {
    const shop = await refreshWeeklyShop(db, now)
    const fail = () => { throw new Error('Échec simulé') }
    db.drops.hook('creating', fail)
    await expect(buyWeeklyOffer(shop.weekStart, shop.offers[0].id, db, now)).rejects.toThrow('simulé')
    db.drops.hook('creating').unsubscribe(fail)
    expect((await db.player.get('local'))?.fragments).toBe(100_000)
    expect(await db.weeklyShop.get('current')).toEqual(shop)
  })
  it('limite le stock du booster et reprend une ouverture sans seconde consommation', async () => {
    const shop = await refreshWeeklyShop(db, now)
    const buys = await Promise.allSettled(Array.from({ length: shop.booster.stock + 2 }, () => buyWeeklyOffer(shop.weekStart, 'booster', db, now)))
    expect(buys.filter(r => r.status === 'fulfilled')).toHaveLength(shop.booster.stock)
    expect((await db.player.get('local'))?.fragments).toBe(100_000 - shop.booster.stock * shop.booster.price)
    const [first, second] = await Promise.all([openBooster(WEEKLY_BOOSTER_ID, db, now), openBooster(WEEKLY_BOOSTER_ID, db, now)])
    expect(second).toEqual(first)
    expect(await db.drops.count()).toBe(5)
    expect((await db.weeklyShop.get('current'))?.booster.owned).toBe(shop.booster.stock - 1)
    expect(await db.boosterStock.count()).toBe(0)
    await finishOpening(first.id, db)
    expect(await db.openings.count()).toBe(0)
  })
  it('ferme les ventes deux heures avant, autorise encore l’ouverture et refuse les offres expirées', async () => {
    const shop = await refreshWeeklyShop(db, now)
    await buyWeeklyOffer(shop.weekStart, 'booster', db, now)
    await expect(buyWeeklyOffer(shop.weekStart, 'booster', db, shop.rerollAt - SALES_CLOSE_MS)).rejects.toThrow(/fermées|épuisée/)
    const opened = await openBooster(WEEKLY_BOOSTER_ID, db, shop.rerollAt - 1)
    await finishOpening(opened.id, db)
    await expect(openBooster(WEEKLY_BOOSTER_ID, db, shop.rerollAt)).rejects.toThrow('expiré')
    await expect(buyWeeklyOffer(shop.weekStart, shop.offers[0].id, db, shop.rerollAt)).rejects.toThrow('renouvelée')
  })
  it('remplace la semaine entière en gardant les cartes et une ouverture déjà commencée', async () => {
    const shop = await refreshWeeklyShop(db, now)
    await buyWeeklyOffer(shop.weekStart, 'booster', db, now)
    await buyWeeklyOffer(shop.weekStart, shop.offers[0].id, db, now)
    const pending = await openBooster(WEEKLY_BOOSTER_ID, db, now)
    await refreshRecharge(db, shop.rerollAt)
    const next = (await db.weeklyShop.get('current'))!
    expect(next.weekStart).toBe(shop.rerollAt)
    expect(next.booster.owned).toBe(0)
    expect(next.offers.every(o => !o.sold)).toBe(true)
    expect(await db.weeklyShop.count()).toBe(1)
    expect(await db.drops.count()).toBe(6)
    expect(await openBooster(WEEKLY_BOOSTER_ID, db, shop.rerollAt)).toEqual(pending)
    await finishOpening(pending.id, db)
    for (let i = 1; i <= 20; i++) await refreshWeeklyShop(db, shop.rerollAt + i * 7 * 86400_000)
    expect(await db.weeklyShop.count()).toBe(1)
    expect(await db.boosterPurchases.count()).toBe(0)
    expect(await db.openings.count()).toBe(0)
  })
  it('n’efface pas la boutique si sa nouvelle génération ne peut pas être sauvegardée', async () => {
    const shop = await refreshWeeklyShop(db, now)
    const fail = () => { throw new Error('Stockage indisponible') }
    db.weeklyShop.hook('updating', fail)
    await expect(refreshWeeklyShop(db, shop.rerollAt)).rejects.toThrow('indisponible')
    db.weeklyShop.hook('updating').unsubscribe(fail)
    expect(await db.weeklyShop.get('current')).toEqual(shop)
  })
  it('transfère les offres et les quantités restantes sans offrir un nouveau tirage', async () => {
    // Export uses the real clock; put this fixture in its current calendar week.
    const time = Date.now(), shop = await refreshWeeklyShop(db, time)
    const purchaseTime = Math.min(time, shop.rerollAt - SALES_CLOSE_MS - 1)
    await db.player.update('local', { maxObservedClockAt: purchaseTime })
    await buyWeeklyOffer(shop.weekStart, 'booster', db, purchaseTime)
    await buyWeeklyOffer(shop.weekStart, shop.offers[0].id, db, purchaseTime)
    await claimWeeklyBonus(shop.weekStart, 'fragments', db, purchaseTime)
    await claimWeeklyBonus(shop.weekStart, 'reroll', db, purchaseTime)
    const state = (await db.weeklyShop.get('current'))!
    expect(state.booster.remaining).toBe(state.booster.stock)
    expect(state.priorBoosters?.[0].owned).toBe(1)
    const target = new BizaveDatabase('weekly-target-' + uuid())
    try {
      await initializeDatabase(target, time)
      const contents = await exportSave((await ensureInstallation(target)).installationId, DEFAULT_PREFERENCES, db)
      expect((await parseSaveFile(contents)).payload.tables.weeklyShop).toEqual([state])
      await importSave(contents, target)
      expect(await target.weeklyShop.get('current')).toEqual(state)
      expect(await target.drops.count()).toBe(1)
    } finally { await target.delete() }
  })
})
