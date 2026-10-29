import { DEFAULT_ART_VARIANT_RATES, DEFAULT_FINISH_RATES, DEFAULT_RARITY_RATES, RECYCLE_BASE_FRAGMENTS, FINISH_MULTIPLIER_TENTHS, ART_MULTIPLIER_TENTHS, FREE_PACK_CAPACITY, FREE_PACK_RECHARGE_MS } from './config'
import type { ArtVariant, BoosterDefinition, Card, CardDefinition, Finish, Rarity } from './types'
import { shopOffer } from './boosterAvailability'
import { resolveBoosterRates, validateRates } from './boosterRates'
export { validateRates } from './boosterRates'
type Rng = () => number
export const secureRandom: Rng = () => crypto.getRandomValues(new Uint32Array(1))[0] / 2 ** 32
export function uuid(): string {
  const b = crypto.getRandomValues(new Uint8Array(16))
  b[6] = (b[6] & 15) | 64; b[8] = (b[8] & 63) | 128
  const h = [...b].map(n => n.toString(16).padStart(2, '0')).join('')
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`
}
export function weightedPick<T extends string>(rates: Record<T, number>, rng: Rng): T {
  const random = rng()
  if (!Number.isFinite(random) || random < 0 || random >= 1) throw new Error('Source aléatoire invalide.')
  const entries = Object.entries(rates) as [T, number][]
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0)
  let cumulative = 0
  for (const [key, weight] of entries) { cumulative += weight; if (random < cumulative / total) return key }
  throw new Error('Configuration : aucun résultat éligible.')
}
type PoolEntry = { card: CardDefinition; weight: number }
export function resolveBoosterPool(booster: BoosterDefinition, catalogue: CardDefinition[]): PoolEntry[] {
  const result = new Map<string, PoolEntry>()
  for (const source of booster.sources) {
    const multiplier = source.multiplier ?? 1
    if (!Number.isFinite(multiplier) || multiplier <= 0) throw new Error('Configuration : multiplicateur invalide.')
    if (source.type === 'cards' && source.cardIds.some(id => !catalogue.some(c => c.id === id))) throw new Error('Configuration : carte inconnue dans le pool.')
    if (source.type === 'rarities' && (!source.rarities.length || source.rarities.some(rarity => !Object.hasOwn(DEFAULT_RARITY_RATES, rarity)))) throw new Error('Configuration : raretés inconnues dans le pool.')
    const subset = catalogue.filter(c => source.type === 'collection' ? c.collectionId === source.collectionId && !source.excludeCardIds?.includes(c.id) : source.type === 'rarities' ? source.rarities.includes(c.rarity) : source.cardIds.includes(c.id))
    if (source.type === 'collection' && !catalogue.some(c => c.collectionId === source.collectionId)) throw new Error('Configuration : collection inconnue.')
    for (const card of subset) result.set(card.id, { card, weight: (result.get(card.id)?.weight ?? 0) + (card.weight ?? 1) * multiplier })
  }
  return [...result.values()]
}
export function validateConfiguration(catalogue: CardDefinition[], boosterList: BoosterDefinition[]) {
  ;[DEFAULT_RARITY_RATES, DEFAULT_FINISH_RATES, DEFAULT_ART_VARIANT_RATES].forEach(validateRates)
  if (new Set(catalogue.map(c => c.id)).size !== catalogue.length) throw new Error('Configuration : identifiant de carte en double.')
  if (new Set(boosterList.map(b => b.id)).size !== boosterList.length) throw new Error('Configuration : identifiant de booster en double.')
  for (const card of catalogue) {
    if (!card.id || !card.title || !(card.rarity in DEFAULT_RARITY_RATES) || !card.artwork.standard?.trim() || !card.artwork.fullArt?.trim() || !Number.isFinite(card.weight ?? 1) || (card.weight ?? 1) <= 0) throw new Error(`Configuration : carte invalide (${card.id}).`)
  }
  for (const booster of boosterList) {
    if (!/^[a-z0-9][a-z0-9-]{0,79}$/.test(booster.id) || !booster.title.trim() || !Number.isFinite(booster.order)) throw new Error(`Configuration : booster invalide (${booster.id}).`)
    const offer = shopOffer(booster)
    if (!Number.isInteger(booster.cardsPerPack) || booster.cardsPerPack < 1 || (offer && (!Number.isSafeInteger(offer.price) || offer.price <= 0))) throw new Error(`Configuration : booster invalide (${booster.id}).`)
    const pool = resolveBoosterPool(booster, catalogue)
    const rates = resolveBoosterRates(booster)
    for (const rarity of Object.keys(rates.rarity) as Rarity[]) if (rates.rarity[rarity] > 0 && !pool.some(p => p.card.rarity === rarity)) throw new Error(`Configuration : rareté ${rarity} vide dans ${booster.id}.`)
  }
}
export function drawPack(booster: BoosterDefinition, catalogue: CardDefinition[], rng: Rng = secureRandom): Card[] {
  const pool = resolveBoosterPool(booster, catalogue)
  const rates = resolveBoosterRates(booster)
  return Array.from({ length: booster.cardsPerPack }, () => {
    const rarity = weightedPick(rates.rarity, rng)
    const finish = weightedPick(rates.finish, rng)
    const artVariant = weightedPick(rates.illustration, rng)
    const weights = Object.fromEntries(pool.filter(p => p.card.rarity === rarity).map(p => [p.card.id, p.weight]))
    const cardId = weightedPick(weights, rng)
    return { dropId: uuid(), cardId, finish, artVariant }
  })
}
export const variantKey = (card: { cardId: string; finish: Finish; artVariant: ArtVariant }) => `${card.cardId}::${card.finish}::${card.artVariant}`
export function getRecycleFragments(rarity: Rarity, finish: Finish, artVariant: ArtVariant) {
  return Math.floor(RECYCLE_BASE_FRAGMENTS[rarity] * FINISH_MULTIPLIER_TENTHS[finish] * ART_MULTIPLIER_TENTHS[artVariant] / 100)
}
type FreePackState = { freePackStock: number; nextFreePackAt: number | null }
export function settleFreePackRecharge<T extends FreePackState>(state: T, now: number): T {
  if (!Number.isInteger(state.freePackStock) || state.freePackStock < 0 || state.freePackStock > FREE_PACK_CAPACITY || (state.freePackStock < FREE_PACK_CAPACITY && (state.nextFreePackAt === null || !Number.isFinite(state.nextFreePackAt)))) throw new Error('Stock gratuit incohérent.')
  if (state.freePackStock === FREE_PACK_CAPACITY) return { ...state, nextFreePackAt: null }
  if (now < state.nextFreePackAt!) return { ...state }
  const elapsed = 1 + Math.floor((now - state.nextFreePackAt!) / FREE_PACK_RECHARGE_MS)
  const freePackStock = Math.min(FREE_PACK_CAPACITY, state.freePackStock + elapsed)
  return { ...state, freePackStock, nextFreePackAt: freePackStock === FREE_PACK_CAPACITY ? null : state.nextFreePackAt! + elapsed * FREE_PACK_RECHARGE_MS }
}
export function consumeFreePack<T extends FreePackState>(raw: T, now: number): T {
  const state = settleFreePackRecharge(raw, now)
  if (!state.freePackStock) throw new Error('Le stock gratuit est épuisé.')
  return { ...state, freePackStock: state.freePackStock - 1, nextFreePackAt: state.freePackStock === FREE_PACK_CAPACITY ? now + FREE_PACK_RECHARGE_MS : state.nextFreePackAt }
}
