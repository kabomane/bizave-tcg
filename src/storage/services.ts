import { cards, cardById, archivedCards } from '../data/cards'
import { boosters } from '../data/boosters'
import { FREE_PACK_CAPACITY, FREE_PACK_INITIAL_STOCK, FREE_PACK_RECHARGE_MS } from '../game/config'
import { shopOffer } from '../game/boosterAvailability'
import { consumeFreePack, drawPack, getRecycleFragments, settleFreePackRecharge, uuid, variantKey, validateConfiguration } from '../game/engine'
import type { BoosterPurchaseRow, Card, CardDefinition, CardDropRow, OpenRecord, PlayerStateRow } from '../game/types'
import { db, type BizaveDatabase } from './database'

export async function initializeDatabase(database = db, now = Date.now()) {
  validateConfiguration(cards, boosters)
  await database.transaction('rw', [database.player, database.definitions], async () => {
    const previous = new Map((await database.definitions.toArray()).map(c => [c.id, c]))
    for (const card of [...cards, ...archivedCards]) if (previous.has(card.id) && previous.get(card.id)!.rarity !== card.rarity) throw new Error(`Configuration : la rareté de ${card.id} est immuable après publication.`)
    if (!await database.player.get('local')) await database.player.add({ id: 'local', fragments: 0, freePackStock: FREE_PACK_INITIAL_STOCK, nextFreePackAt: FREE_PACK_INITIAL_STOCK < FREE_PACK_CAPACITY ? now + FREE_PACK_RECHARGE_MS : null, maxObservedClockAt: now, schemaVersion: 3 })
    await database.definitions.bulkPut([...cards, ...archivedCards])
  })
  // Archived snapshots are never deleted; removed models still have a definition.
  for (const definition of await database.definitions.toArray()) if (!cardById.has(definition.id)) cardById.set(definition.id, definition)
  await refreshRecharge(database, now)
}
function observedTime(player: PlayerStateRow, now: number) { return Math.max(now, player.maxObservedClockAt ?? now) }
export async function refreshRecharge(database = db, now = Date.now()) {
  return database.transaction('rw', database.player, async () => {
    const raw = await database.player.get('local')
    if (!raw) throw new Error('La sauvegarde locale est indisponible.')
    const time = observedTime(raw, now)
    const next = { ...settleFreePackRecharge(raw, time), maxObservedClockAt: time }
    if (raw.freePackStock !== next.freePackStock || raw.nextFreePackAt !== next.nextFreePackAt || time - raw.maxObservedClockAt > 60_000) await database.player.put(next)
    return next
  })
}
export async function discover(database: BizaveDatabase, card: Card, now: number) {
  const key = variantKey(card)
  if (!await database.discoveries.get(key)) await database.discoveries.add({ key, cardId: card.cardId, finish: card.finish, artVariant: card.artVariant, firstDiscoveredAt: now })
}
export async function buyBooster(boosterId: string, database = db, now = Date.now(), boosterDefinitions = boosters) {
  const booster = boosterDefinitions.find(b => b.id === boosterId && b.enabled)
  const offer = booster && shopOffer(booster)
  if (!booster || !offer || offer.listed === false) throw new Error('Ce booster n’est pas disponible en boutique.')
  const price = offer.price
  if (!Number.isSafeInteger(price) || price <= 0) throw new Error('Le prix de ce booster est invalide.')
  return database.transaction('rw', [database.player, database.boosterStock, database.boosterPurchases], async () => {
    const player = await database.player.get('local')
    if (!player) throw new Error('La sauvegarde locale est indisponible.')
    if (player.fragments < price) throw new Error('Vous n’avez pas assez de fragments.')
    const quantity = (await database.boosterStock.get(boosterId))?.quantity ?? 0
    if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity === Number.MAX_SAFE_INTEGER) throw new Error('Le stock de ce booster est incohérent.')
    const time = observedTime(player, now)
    const purchase: BoosterPurchaseRow = { id: uuid(), boosterId, boosterTitle: booster.title, unitPrice: price, fragmentsSpent: price, createdAt: time }
    await database.player.put({ ...player, fragments: player.fragments - price, maxObservedClockAt: time })
    await database.boosterStock.put({ boosterId, quantity: quantity + 1, updatedAt: time })
    await database.boosterPurchases.add(purchase)
    return purchase
  })
}
export async function openBooster(boosterId: string, database = db, now = Date.now(), boosterDefinitions = boosters) {
  const booster = boosterDefinitions.find(b => b.id === boosterId && b.enabled)
  if (!booster) throw new Error('Ce booster est indisponible.')
  return database.transaction('rw', [database.player, database.drops, database.discoveries, database.openings, database.boosterStock], async () => {
    // A committed but unrevealed opening takes precedence: refresh never rerolls.
    const pending = (await database.openings.toArray()).find(o => !o.revealComplete)
    if (pending) return pending
    const raw = await database.player.get('local')
    if (!raw) throw new Error('La sauvegarde locale est indisponible.')
    const time = observedTime(raw, now)
    let player = { ...settleFreePackRecharge(raw, time), maxObservedClockAt: time }
    let payment: OpenRecord['payment'] = 'shop'
    if (booster.access.type === 'free' && player.freePackStock > 0) {
      player = consumeFreePack(player, time)
      payment = 'free'
    }
    else {
      const stock = await database.boosterStock.get(boosterId)
      if (!stock || !Number.isSafeInteger(stock.quantity) || stock.quantity < 1) throw new Error(booster.access.type === 'free' ? 'Le stock gratuit est épuisé.' : 'Vous ne possédez aucun exemplaire de ce booster. Retrouvez-le en boutique.')
      await database.boosterStock.put({ ...stock, quantity: stock.quantity - 1, updatedAt: time })
    }
    const results = drawPack(booster, cards)
    const record: OpenRecord = { id: uuid(), boosterId, boosterTitle: booster.title, openedAt: time, payment, fragmentsSpent: 0, results, revealComplete: false, revealedCount: 0 }
    await database.player.put(player)
    await database.drops.bulkAdd(results.map(c => ({ ...c, status: 'owned' as const, acquiredAt: time, updatedAt: time })))
    for (const card of results) await discover(database, card, time)
    await database.openings.add(record)
    return record
  })
}
export async function advanceReveal(id: string, database = db) {
  return database.transaction('rw', database.openings, async () => {
    const opening = await database.openings.get(id)
    if (!opening) throw new Error('Cette ouverture est introuvable.')
    const revealedCount = Math.min(opening.results.length, opening.revealedCount + 1)
    await database.openings.update(id, { revealedCount })
  })
}
export async function finishOpening(id: string, database = db) {
  return database.transaction('rw', database.openings, async () => {
    const record = await database.openings.get(id)
    if (!record) throw new Error('Cette ouverture est introuvable.')
    await database.openings.update(id, { revealComplete: true, revealedCount: record.results.length })
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
export async function recycleDrops(ids: string[], allowLastCopy = false, database = db, now = Date.now()) {
  if (!ids.length || new Set(ids).size !== ids.length) throw new Error('Sélection de recyclage invalide.')
  return database.transaction('rw', [database.player, database.drops, database.recycling, database.definitions], async () => {
    const inventory = await database.drops.where('status').equals('owned').toArray()
    const selected = ids.map(id => inventory.find(d => d.dropId === id))
    if (selected.some(d => !d)) throw new Error('Une carte sélectionnée n’est plus disponible.')
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
    for (const id of ids) await database.drops.update(id, { status: 'recycled', updatedAt: now })
    await database.recycling.add({ id: uuid(), createdAt: now, dropIds: ids, fragmentsGained: gain })
    return gain
  })
}
