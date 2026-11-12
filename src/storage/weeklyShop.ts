import { createDailyShop } from '../game/dailyShop'
import { settleDailyShop } from './dailyShop'
import { cards } from '../data/cards'
import { createWeeklyShop, rerollWeeklyOffers, rollFragmentReward, SALES_CLOSE_MS, WEEKLY_REROLL_PRICE, weeklyPeriod, weeklyRerollCount } from '../game/weeklyShop'
import type { WeeklyBonusKind } from '../game/types'
import { uuid } from '../game/engine'
import { db, type BizaveDatabase } from './database'
import { assertAccountActive } from './accountGuard'
import { discover } from './discoveries'
import { fragmentPurchaseCost } from '../settings/development'

/** Caller holds the weeklyShop write lock; old weeks are fully overwritten. */
export async function settleWeeklyShop(database: BizaveDatabase, now: number, create = false) {
  const current = await database.weeklyShop.get('current')
  if (!current && !create) return undefined
  if (current && current.weekStart === weeklyPeriod(now).weekStart) return current
  const next = createWeeklyShop(cards, now)
  await database.weeklyShop.put(next)
  return next
}
export async function refreshWeeklyShop(database = db, now = Date.now()) {
  return database.transaction('rw', [database.player, database.weeklyShop, database.accountState], async () => {
    await assertAccountActive(database)
    const player = await database.player.get('local')
    if (!player) throw new Error('La sauvegarde locale est indisponible.')
    const time = Math.max(now, player.maxObservedClockAt)
    await database.player.update('local', { maxObservedClockAt: time })
    return (await settleWeeklyShop(database, time, true))!
  })
}
async function readActiveWeeklyShop(database: BizaveDatabase, weekStart: number, now: number) {
  await assertAccountActive(database)
  const player = await database.player.get('local')
  if (!player) throw new Error('La sauvegarde locale est indisponible.')
  const time = Math.max(now, player.maxObservedClockAt)
  const shop = await database.weeklyShop.get('current')
  if (!shop || shop.weekStart !== weekStart || shop.weekStart !== weeklyPeriod(time).weekStart) throw new Error('La boutique a été renouvelée. Actualisez les offres.')
  return { player, shop, time }
}

export async function buyWeeklyOffer(weekStart: number, offerId: string, database = db, now = Date.now(), expectedRerollCount = 0) {
  return database.transaction('rw', [database.player, database.weeklyShop, database.accountState, database.drops, database.discoveries], async () => {
    const { player, shop, time } = await readActiveWeeklyShop(database, weekStart, now)
    if (weeklyRerollCount(shop) !== expectedRerollCount) throw new Error('La boutique a été renouvelée. Actualisez les offres.')
    const offer = shop.offers.find(o => o.id === offerId)
    const booster = offerId === 'booster'
    if (booster ? shop.booster.remaining < 1 : !offer || offer.sold) throw new Error('Cette offre est épuisée.')
    if (booster && time >= shop.rerollAt - SALES_CLOSE_MS) throw new Error('Les ventes du booster sont fermées avant le renouvellement.')
    const price = fragmentPurchaseCost(booster ? shop.booster.price : offer!.price)
    if (player.fragments < price) throw new Error('Vous n’avez pas assez de fragments.')
    await database.player.put({ ...player, fragments: player.fragments - price, maxObservedClockAt: time })
    if (booster) { shop.booster.remaining--; shop.booster.owned++ }
    else {
      offer!.sold = true
      const card = { dropId: uuid(), cardId: offer!.cardId, finish: offer!.finish, artVariant: offer!.artVariant }
      await database.drops.add({ ...card, status: 'owned', acquiredAt: time, updatedAt: time, circulation: 'local' })
      await discover(database, card, time)
    }
    await database.weeklyShop.put(shop)
  })
}

export async function claimWeeklyBonus(weekStart: number, kind: WeeklyBonusKind, database = db, now = Date.now(), expectedRerollPrice?: number) {
  return database.transaction('rw', [database.player, database.weeklyShop, database.dailyShop, database.accountState], async () => {
    const { player, shop, time } = await readActiveWeeklyShop(database, weekStart, now)
    const credits = player.weeklyBonusCredits?.[kind] ?? 0
    if (kind === 'reroll') {
      const price = credits > 0 ? 0 : WEEKLY_REROLL_PRICE
      if (price > 0 && shop.rerollUsed) throw new Error('Le reroll de la semaine a déjà été utilisé.')
      if (expectedRerollPrice !== undefined && price !== expectedRerollPrice) throw new Error('Le prix du reroll a changé. Réessayez.')
      const cost = fragmentPurchaseCost(price)
      if (player.fragments < cost) throw new Error('Vous n’avez pas assez de fragments.')
      const next = rerollWeeklyOffers(shop, cards)
      if (price > 0) next.rerollUsed = true
      else player.weeklyBonusCredits = { ...player.weeklyBonusCredits, reroll: credits - 1 }
      const daily = await settleDailyShop(database, time, true)
      const nextDaily = createDailyShop(cards, time)
      nextDaily.rerollCount = (daily!.rerollCount ?? 0) + 1
      nextDaily.priorBundles = [...(daily!.priorBundles ?? []), ...(daily!.bundle.owned > 0 ? [{ boosterId: daily!.bundle.boosterId, owned: daily!.bundle.owned }] : [])]
      await database.dailyShop.put(nextDaily)
      await database.weeklyShop.put(next)
      await database.player.put({ ...player, fragments: player.fragments - cost, maxObservedClockAt: time })
      return undefined
    }
    if (shop.fragmentsClaimed && credits === 0) throw new Error('La carte fragments a déjà été réclamée.')
    const amount = rollFragmentReward()
    const fragments = player.fragments + amount
    if (!Number.isSafeInteger(fragments)) throw new Error('Le solde de fragments est trop élevé.')
    if (shop.fragmentsClaimed) player.weeklyBonusCredits = { ...player.weeklyBonusCredits, fragments: credits - 1 }
    else await database.weeklyShop.put({ ...shop, fragmentsClaimed: true })
    await database.player.put({ ...player, fragments, maxObservedClockAt: time })
    return amount
  })
}
