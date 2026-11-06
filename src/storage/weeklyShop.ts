import { cards } from '../data/cards'
import { createWeeklyShop, SALES_CLOSE_MS, weeklyPeriod } from '../game/weeklyShop'
import { uuid, variantKey } from '../game/engine'
import { db, type BizaveDatabase } from './database'
import { assertAccountActive } from './accountGuard'

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
export async function buyWeeklyOffer(weekStart: number, offerId: 'booster' | string, database = db, now = Date.now()) {
  return database.transaction('rw', [database.player, database.weeklyShop, database.accountState, database.drops, database.discoveries], async () => {
    await assertAccountActive(database)
    const player = await database.player.get('local')
    if (!player) throw new Error('La sauvegarde locale est indisponible.')
    const time = Math.max(now, player.maxObservedClockAt)
    const shop = await database.weeklyShop.get('current')
    if (!shop || shop.weekStart !== weekStart || shop.weekStart !== weeklyPeriod(time).weekStart) throw new Error('La boutique a été renouvelée. Actualisez les offres.')
    const offer = shop.offers.find(o => o.id === offerId)
    const booster = offerId === 'booster'
    if (booster ? shop.booster.remaining < 1 : !offer || offer.sold) throw new Error('Cette offre est épuisée.')
    if (booster && time >= shop.rerollAt - SALES_CLOSE_MS) throw new Error('Les ventes du booster sont fermées avant le renouvellement.')
    const price = booster ? shop.booster.price : offer!.price
    if (player.fragments < price) throw new Error('Vous n’avez pas assez de fragments.')
    await database.player.put({ ...player, fragments: player.fragments - price, maxObservedClockAt: time })
    if (booster) { shop.booster.remaining--; shop.booster.owned++ }
    else {
      offer!.sold = true
      const card = { dropId: uuid(), cardId: offer!.cardId, finish: offer!.finish, artVariant: offer!.artVariant }
      await database.drops.add({ ...card, status: 'owned', acquiredAt: time, updatedAt: time, circulation: 'local' })
      const key = variantKey(card)
      if (!await database.discoveries.get(key)) await database.discoveries.add({ key, cardId: card.cardId, finish: card.finish, artVariant: card.artVariant, firstDiscoveredAt: time })
    }
    await database.weeklyShop.put(shop)
  })
}
