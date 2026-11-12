import { SALES_CLOSE_MS } from '../game/weeklyShop'
import { cards } from '../data/cards'
import { christmasBooster, christmasCards } from '../data/christmas'
import { createDailyShop, dailyDefinition, dailyPeriod, validDailyShop } from '../game/dailyShop'
import { drawPack, uuid } from '../game/engine'
import type { OpenRecord } from '../game/types'
import { fragmentPurchaseCost } from '../settings/development'
import { assertAccountActive } from './accountGuard'
import { db, type BizaveDatabase } from './database'
import { discover } from './discoveries'

/** Only current exists. Replacing it expires unopened stock, never pending results. */
export async function settleDailyShop(database: BizaveDatabase, now: number, create = false) {
  const current = await database.dailyShop.get('current')
  if (!current && !create) return undefined
  if (current && current.dayStart === dailyPeriod(now).dayStart && validDailyShop(current, cards)) return current
  const next = createDailyShop(cards, now)
  await database.dailyShop.put(next)
  return next
}
export async function refreshDailyShop(database = db, now = Date.now()) {
  return database.transaction('rw', [database.player, database.dailyShop, database.accountState], async () => {
    await assertAccountActive(database)
    const player = await database.player.get('local')
    if (!player) throw new Error('La sauvegarde locale est indisponible.')
    const time = Math.max(now, player.maxObservedClockAt)
    await database.player.update('local', { maxObservedClockAt: time })
    return (await settleDailyShop(database, time, true))!
  })
}
async function readActiveDailyShop(database: BizaveDatabase, dayStart: number, now: number) {
  await assertAccountActive(database)
  const player = await database.player.get('local')
  if (!player) throw new Error('La sauvegarde locale est indisponible.')
  const time = Math.max(now, player.maxObservedClockAt), shop = await database.dailyShop.get('current')
  if (!shop || shop.dayStart !== dayStart || shop.dayStart !== dailyPeriod(time).dayStart) throw new Error('La boutique du jour a été renouvelée. Actualisez les offres.')
  if (!validDailyShop(shop, cards)) throw new Error('La boutique du jour est invalide. Actualisez les offres.')
  return { player, shop, time }
}
export async function buyDailyBundle(dayStart: number, database = db, now = Date.now(), expectedRerollCount = 0) {
  return database.transaction('rw', [database.player, database.dailyShop, database.accountState], async () => {
    const { player, shop, time } = await readActiveDailyShop(database, dayStart, now)
    if ((shop.rerollCount ?? 0) !== expectedRerollCount) throw new Error('La boutique du jour a été renouvelée. Actualisez les offres.')
    if (time >= shop.renewAt - SALES_CLOSE_MS) throw new Error('Les ventes du lot sont fermées avant le renouvellement.')
    if (shop.bundle.purchased) throw new Error('Ce lot a déjà été acheté.')
    const cost = fragmentPurchaseCost(shop.bundle.price)
    if (player.fragments < cost) throw new Error('Vous n’avez pas assez de fragments.')
    await database.player.put({ ...player, fragments: player.fragments - cost, maxObservedClockAt: time })
    shop.bundle.purchased = true; shop.bundle.owned = shop.bundle.quantity
    await database.dailyShop.put(shop)
  })
}
export async function buyDailyCard(dayStart: number, offerId: string, database = db, now = Date.now(), expectedRerollCount = 0) {
  return database.transaction('rw', [database.player, database.dailyShop, database.accountState, database.drops, database.discoveries], async () => {
    const { player, shop, time } = await readActiveDailyShop(database, dayStart, now)
    if ((shop.rerollCount ?? 0) !== expectedRerollCount) throw new Error('La boutique du jour a été renouvelée. Actualisez les offres.')
    const offer = shop.cards.find(o => o.id === offerId)
    if (!offer || offer.sold) throw new Error('Cette offre est épuisée.')
    const cost = fragmentPurchaseCost(offer.price)
    if (player.fragments < cost) throw new Error('Vous n’avez pas assez de fragments.')
    await database.player.put({ ...player, fragments: player.fragments - cost, maxObservedClockAt: time })
    const card = { dropId: uuid(), cardId: offer.cardId, finish: offer.finish, artVariant: offer.artVariant }
    await database.drops.add({ ...card, status: 'owned', acquiredAt: time, updatedAt: time, circulation: 'local' })
    await discover(database, card, time)
    offer.sold = true
    await database.dailyShop.put(shop)
  })
}
export async function openDailyBooster(dayStart: number, boosterId: string, database = db, now = Date.now()) {
  return database.transaction('rw', [database.player, database.dailyShop, database.accountState, database.drops, database.discoveries, database.openings], async () => {
    await assertAccountActive(database)
    const pending = await database.openings.filter(o => !o.revealComplete).first()
    if (pending) return pending
    const { player, shop, time } = await readActiveDailyShop(database, dayStart, now)
    const prior = shop.priorBundles?.find(b => b.boosterId === boosterId && b.owned > 0)
    if (!prior && (shop.bundle.boosterId !== boosterId || shop.bundle.owned < 1)) throw new Error('Vous ne possédez aucun exemplaire de ce lot.')
    // An active day is the eligibility snapshot. Its event packs retain their own
    // temporary-card rules until midnight even if event configuration changes.
    const booster = dailyDefinition(boosterId)!
    const temporary = boosterId === christmasBooster.id
    const results = drawPack(booster, temporary ? christmasCards : cards)
    const opening: OpenRecord = { id: uuid(), boosterId, boosterTitle: booster.title, boosterColors: { ...booster.artwork.colors }, openedAt: time, payment: 'shop', fragmentsSpent: 0, results, revealComplete: false, revealedCount: 0 }
    if (prior) { prior.owned--; shop.priorBundles = shop.priorBundles!.filter(b => b.owned > 0) }
    else shop.bundle.owned--
    await database.dailyShop.put(shop)
    await database.player.put({ ...player, maxObservedClockAt: time })
    if (!temporary) {
      await database.drops.bulkAdd(results.map(c => ({ ...c, status: 'owned' as const, acquiredAt: time, updatedAt: time, circulation: 'local' as const })))
      for (const card of results) await discover(database, card, time)
    }
    await database.openings.add(opening)
    return opening
  })
}
