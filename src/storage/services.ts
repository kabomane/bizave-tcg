import { cards, cardById, archivedCards } from '../data/cards'
import { boosters } from '../data/boosters'
import { christmasBooster, christmasCards, isChristmasEventActive } from '../data/christmas'
import { eventBoosters, isEventBoosterActive } from '../data/events'
import { FREE_PACK_CAPACITY, FREE_PACK_INITIAL_STOCK, FREE_PACK_RECHARGE_MS } from '../game/config'
import { shopOffer } from '../game/boosterAvailability'
import { consumeFreePack, drawPack, getRecycleFragments, settleFreePackRecharge, uuid, variantKey, validateConfiguration } from '../game/engine'
import type { BoosterDefinition, BoosterPurchaseRow, CardDefinition, CardDropRow, OpenRecord, PlayerStateRow } from '../game/types'
import { db, DATABASE_SCHEMA_VERSION } from './database'
import { assertAccountActive } from './accountGuard'
import { ensureInstallation } from './installation'
import { discover } from './discoveries'
import { pruneFavorites } from '../collection/favorites'
import { settleWeeklyShop } from './weeklyShop'
import { settleDailyShop } from './dailyShop'
import { priorWeeklyBoosters, WEEKLY_BOOSTER_ID } from '../game/weeklyShop'
import { fragmentPurchaseCost } from '../settings/development'

const purchasableBoosters: BoosterDefinition[] = [...boosters, christmasBooster, ...eventBoosters]

export async function initializeDatabase(database = db, now = Date.now()) {
  validateConfiguration(cards, [...boosters, ...eventBoosters])
  validateConfiguration(christmasCards, [christmasBooster])
  const active = await database.transaction('rw', [database.player, database.definitions, database.accountState, database.versionInfo], async () => {
    await database.versionInfo.put({ id: 'local', schemaVersion: DATABASE_SCHEMA_VERSION, ready: true })
    if ((await database.accountState.get('local'))?.status === 'exported') return false
    const previous = new Map((await database.definitions.toArray()).map(c => [c.id, c]))
    for (const card of [...cards, ...archivedCards]) if (previous.has(card.id) && previous.get(card.id)!.rarity !== card.rarity) throw new Error(`Configuration : la rareté de ${card.id} est immuable après publication.`)
    if (!await database.player.get('local')) await database.player.add({ id: 'local', fragments: 0, freePackStock: FREE_PACK_INITIAL_STOCK, nextFreePackAt: FREE_PACK_INITIAL_STOCK < FREE_PACK_CAPACITY ? now + FREE_PACK_RECHARGE_MS : null, maxObservedClockAt: now, schemaVersion: DATABASE_SCHEMA_VERSION })
    await database.definitions.bulkPut([...cards, ...archivedCards])
    return true
  })
  if (!active) return
  await database.openings.filter(opening => opening.revealComplete === true).delete()
  // Archived snapshots are never deleted; removed models still have a definition.
  for (const definition of await database.definitions.toArray()) if (!cardById.has(definition.id)) cardById.set(definition.id, definition)
  try { await ensureInstallation(database); await refreshRecharge(database, now) }
  catch (error) {
    // Another tab may export between initialization and recharge. Let AccountGate show its file.
    if ((await database.accountState.get('local'))?.status !== 'exported') throw error
  }
}
function observedTime(player: PlayerStateRow, now: number) { return Math.max(now, player.maxObservedClockAt ?? now) }
export async function refreshRecharge(database = db, now = Date.now()) {
  return database.transaction('rw', [database.player, database.accountState, database.weeklyShop, database.dailyShop], async () => {
    await assertAccountActive(database)
    const raw = await database.player.get('local')
    if (!raw) throw new Error('La sauvegarde locale est indisponible.')
    const time = observedTime(raw, now)
    await settleWeeklyShop(database, time)
    await settleDailyShop(database, time)
    const next = { ...settleFreePackRecharge(raw, time), maxObservedClockAt: time }
    if (raw.freePackStock !== next.freePackStock || raw.nextFreePackAt !== next.nextFreePackAt || time - raw.maxObservedClockAt > 60_000) await database.player.put(next)
    return next
  })
}
export async function buyBooster(boosterId: string, database = db, now = Date.now(), boosterDefinitions = purchasableBoosters) {
  const booster = boosterDefinitions.find(b => b.id === boosterId && b.enabled && !b.dailyOnly)
  const offer = booster && shopOffer(booster)
  if (!booster || !offer || offer.listed === false) throw new Error('Ce booster n’est pas disponible en boutique.')
  const price = offer.price
  if (!Number.isSafeInteger(price) || price <= 0) throw new Error('Le prix de ce booster est invalide.')
  return database.transaction('rw', [database.player, database.boosterStock, database.accountState], async () => {
    await assertAccountActive(database)
    if (boosterId === christmasBooster.id && !isChristmasEventActive()) throw new Error('Ce booster n’est pas disponible en boutique.')
    if (eventBoosters.some(event => event.id === boosterId) && !isEventBoosterActive(boosterId)) throw new Error('Ce booster n’est pas disponible en boutique.')
    const player = await database.player.get('local')
    if (!player) throw new Error('La sauvegarde locale est indisponible.')
    const fragmentsSpent = fragmentPurchaseCost(price)
    if (player.fragments < fragmentsSpent) throw new Error('Vous n’avez pas assez de fragments.')
    const quantity = (await database.boosterStock.get(boosterId))?.quantity ?? 0
    if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity === Number.MAX_SAFE_INTEGER) throw new Error('Le stock de ce booster est incohérent.')
    const time = observedTime(player, now)
    const purchase: BoosterPurchaseRow = { id: uuid(), boosterId, boosterTitle: booster.title, unitPrice: price, fragmentsSpent, createdAt: time }
    await database.player.put({ ...player, fragments: player.fragments - fragmentsSpent, maxObservedClockAt: time })
    await database.boosterStock.put({ boosterId, quantity: quantity + 1, updatedAt: time })
    return purchase
  })
}
export async function openBooster(boosterId: string, database = db, now = Date.now(), boosterDefinitions = purchasableBoosters) {
  return database.transaction('rw', [database.player, database.drops, database.discoveries, database.openings, database.boosterStock, database.accountState, database.weeklyShop], async () => {
    await assertAccountActive(database)
    // A committed but unrevealed opening takes precedence: refresh never rerolls.
    const pending = await database.openings.filter(opening => !opening.revealComplete).first()
    if (pending) return pending
    if (boosterId === christmasBooster.id && !isChristmasEventActive()) throw new Error('Ce booster est indisponible.')
    if (eventBoosters.some(event => event.id === boosterId) && !isEventBoosterActive(boosterId)) throw new Error('Ce booster est indisponible.')
    const raw = await database.player.get('local')
    if (!raw) throw new Error('La sauvegarde locale est indisponible.')
    const time = observedTime(raw, now)
    const weekly = boosterId === WEEKLY_BOOSTER_ID ? await database.weeklyShop.get('current') : undefined
    if (weekly && time >= weekly.rerollAt) throw new Error('Ce booster de la semaine a expiré.')
    const prior = weekly ? priorWeeklyBoosters(weekly)[0] : undefined
    const booster = prior?.definition ?? weekly?.booster.definition ?? boosterDefinitions.find(b => b.id === boosterId && b.enabled && !b.dailyOnly)
    if (!booster) throw new Error('Ce booster est indisponible.')
    let player = { ...settleFreePackRecharge(raw, time), maxObservedClockAt: time }
    let payment: OpenRecord['payment'] = 'shop'
    if (weekly) {
      if (prior) {
        prior.owned--
        if (prior.owned === 0) {
          weekly.priorBoosters?.shift()
          if (!weekly.priorBoosters?.length) delete weekly.priorBoosters
          delete weekly.priorBooster
        }
      } else {
        if (weekly.booster.owned < 1) throw new Error('Vous ne possédez aucun exemplaire de ce booster.')
        weekly.booster.owned--
      }
      await database.weeklyShop.put(weekly)
    }
    else if (booster.access.type === 'free' && player.freePackStock > 0) {
      player = consumeFreePack(player, time)
      payment = 'free'
    }
    else {
      const stock = await database.boosterStock.get(boosterId)
      if (!stock || !Number.isSafeInteger(stock.quantity) || stock.quantity < 1) throw new Error(booster.access.type === 'free' ? 'Le stock gratuit est épuisé.' : 'Vous ne possédez aucun exemplaire de ce booster. Retrouvez-le en boutique.')
      await database.boosterStock.put({ ...stock, quantity: stock.quantity - 1, updatedAt: time })
    }
    const temporary = booster.id === christmasBooster.id
    const results = drawPack(booster, temporary ? christmasCards : cards)
    const record: OpenRecord = { id: uuid(), boosterId, boosterTitle: booster.title, boosterColors: { ...booster.artwork.colors }, openedAt: time, payment, fragmentsSpent: 0, results, revealComplete: false, revealedCount: 0 }
    await database.player.put(player)
    if (!temporary) {
      await database.drops.bulkAdd(results.map(c => ({ ...c, status: 'owned' as const, acquiredAt: time, updatedAt: time, circulation: 'local' as const })))
      for (const card of results) await discover(database, card, time)
    }
    await database.openings.add(record)
    return record
  })
}
export async function advanceReveal(id: string, database = db) {
  return database.transaction('rw', [database.openings, database.accountState], async () => {
    await assertAccountActive(database)
    const opening = await database.openings.get(id)
    if (!opening) throw new Error('Cette ouverture est introuvable.')
    const revealedCount = Math.min(opening.results.length, opening.revealedCount + 1)
    await database.openings.update(id, { revealedCount })
  })
}
export async function finishOpening(id: string, database = db) {
  return database.transaction('rw', [database.openings, database.accountState], async () => {
    await assertAccountActive(database)
    const record = await database.openings.get(id)
    if (!record) throw new Error('Cette ouverture est introuvable.')
    await database.openings.delete(id)
  })
}
export function duplicateDrops(drops: CardDropRow[]) {
  const seen = new Set<string>()
  return drops.filter(d => d.status === 'owned').sort((a, b) => a.acquiredAt - b.acquiredAt || a.dropId.localeCompare(b.dropId)).filter(d => {
    const key = variantKey(d)
    if (seen.has(key)) return true
    seen.add(key); return false
  })
}
export async function recycleDrops(ids: string[], allowLastCopy = false, database = db, protectFavorites = false) {
  if (!ids.length || new Set(ids).size !== ids.length) throw new Error('Sélection de recyclage invalide.')
  return database.transaction('rw', [database.player, database.drops, database.recycledCards, database.definitions, database.accountState, database.favorites], async () => {
    await assertAccountActive(database)
    const inventory = await database.drops.where('status').equals('owned').toArray()
    const byId = new Map(inventory.map(drop => [drop.dropId, drop]))
    const selected = ids.map(id => byId.get(id))
    if (selected.some(d => !d)) throw new Error('Une carte sélectionnée n’est plus disponible.')
    if (protectFavorites) {
      const favorites = new Set((await database.favorites.toArray()).map(row => row.key))
      if ((selected as CardDropRow[]).some(drop => favorites.has(variantKey(drop)))) throw new Error('Une carte sélectionnée est favorite et ne peut pas être recyclée dans l’Atelier.')
    }
    const safe = new Set(duplicateDrops(inventory).map(d => d.dropId))
    if (!allowLastCopy && ids.some(id => !safe.has(id))) throw new Error('Confirmez le recyclage de la dernière copie de cette variante.')
    const definitions = new Map((await database.definitions.toArray()).map(c => [c.id, c]))
    let gain = 0
    for (const drop of selected as CardDropRow[]) {
      const definition: CardDefinition | undefined = cardById.get(drop.cardId) ?? definitions.get(drop.cardId)
      if (!definition) throw new Error('La définition de cette carte est introuvable.')
      gain += getRecycleFragments(definition.rarity, drop.finish, drop.artVariant)
    }
    const player = await database.player.get('local')
    if (!player) throw new Error('La sauvegarde locale est indisponible.')
    await database.player.put({ ...player, fragments: player.fragments + gain })
    await database.recycledCards.bulkPut((selected as CardDropRow[]).filter(drop => drop.circulation !== 'local').map(drop => ({ dropId: drop.dropId })))
    await database.drops.bulkDelete(ids)
    await pruneFavorites(database)
    return gain
  })
}
