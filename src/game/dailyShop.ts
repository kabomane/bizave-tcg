import { boosters } from '../data/boosters'
import { christmasBooster, christmasCards, isChristmasEventActive } from '../data/christmas'
import { DEFAULT_ART_VARIANT_RATES, DEFAULT_FINISH_RATES, DEFAULT_RARITY_RATES } from './config'
import { resolveBoosterPool, secureRandom, weightedPick } from './engine'
import { shopOffer } from './boosterAvailability'
import { parisMidnight, parisParts, redistributeRates, showcasePrice, type WeeklyOffer } from './weeklyShop'
import type { BoosterDefinition, CardDefinition, Rarity } from './types'

type Rng = () => number
export type DailyCategory = 'classic' | 'special' | 'event'
export type DailyEntry = { id: string; category: DailyCategory; weight: number; unitPrice: number }
export type DailyShopRow = {
  id: 'current'; dayStart: number; renewAt: number
  bundle: { boosterId: string; category: DailyCategory; quantity: number; unitPrice: number; discountPercent: number; normalPrice: number; price: number; purchased: boolean; owned: number }
  cards: WeeklyOffer[]
  rerollCount?: number
  priorBundles?: { boosterId: string; owned: number }[]
}
// Pending product decisions: events disabled until their global mass is approved;
// 0–3 cards provisionally uniform.
export const DAILY_EVENT_CATEGORY_WEIGHT = 0
export const DAILY_CARD_COUNT_WEIGHTS = { 0: 1, 1: 1, 2: 1, 3: 1 }
export const DAILY_BUNDLE_SIZE_WEIGHTS = { 5: 30, 6: 25, 7: 20, 8: 12, 9: 8, 10: 5 }
export const DAILY_SELECTION = [
  { id: 'phantom-blood', category: 'classic', weight: 1 },
  { id: 'anima-isekai', category: 'classic', weight: 1 },
  { id: 'rarity-only', category: 'special', weight: 20 },
  { id: 'epico-stellari', category: 'special', weight: 5 },
  { id: 'legenda-completa', category: 'special', weight: 1 },
  { id: christmasBooster.id, category: 'event', weight: 1 },
] as const
export const DAILY_CARD_RATES = { rarity: DEFAULT_RARITY_RATES, finish: DEFAULT_FINISH_RATES, illustration: DEFAULT_ART_VARIANT_RATES }
export function dailyDefinition(id: string): BoosterDefinition | undefined {
  return [...boosters, christmasBooster].find(b => b.id === id)
}
export function dailyPeriod(now: number) {
  const p = parisParts(now), date = Date.UTC(p.year, p.month - 1, p.day)
  return { dayStart: parisMidnight(date), renewAt: parisMidnight(date + 86400_000) }
}
export function pickWeighted<T extends string>(items: readonly { id: T; weight: number }[], rng: Rng = secureRandom): T {
  if (!items.length || new Set(items.map(i => i.id)).size !== items.length || items.some(i => !Number.isFinite(i.weight) || i.weight <= 0)) throw new Error('Configuration pondérée invalide.')
  return weightedPick(Object.fromEntries(items.map(i => [i.id, i.weight])) as Record<T, number>, rng)
}
export function eligibleDailyEntries(catalogue: CardDefinition[], eventActive = isChristmasEventActive()): DailyEntry[] {
  return DAILY_SELECTION.flatMap(entry => {
    const definition = dailyDefinition(entry.id), price = definition && shopOffer(definition)?.price
    if (!definition?.enabled || !price || (entry.category === 'event' && !eventActive)) return []
    const pool = resolveBoosterPool(definition, entry.category === 'event' ? christmasCards : catalogue)
    if (!pool.length) return []
    return [{ ...entry, unitPrice: price }]
  })
}
export function rollDailyBundle(entries: DailyEntry[], eventWeight: number = DAILY_EVENT_CATEGORY_WEIGHT, rng: Rng = secureRandom): DailyShopRow['bundle'] {
  if (!Number.isFinite(eventWeight) || eventWeight < 0 || eventWeight > 896) throw new Error('Poids événementiel invalide.')
  if (!entries.some(e => e.category === 'classic') || !entries.some(e => e.category === 'special')) throw new Error('Catalogue journalier incomplet.')
  const event = entries.some(e => e.category === 'event') ? eventWeight : 0
  const category = pickWeighted<DailyCategory>([{ id: 'classic', weight: 896 - event }, { id: 'special', weight: 104 }, { id: 'event', weight: event }].filter(e => e.weight > 0) as { id: DailyCategory; weight: number }[], rng)
  const boosterId = pickWeighted(entries.filter(e => e.category === category), rng)
  const { unitPrice } = entries.find(e => e.id === boosterId)!
  const quantity = Number(weightedPick(DAILY_BUNDLE_SIZE_WEIGHTS, rng))
  const discountPercent = 5 + Math.floor(rng() * 16), normalPrice = quantity * unitPrice
  const price = Math.round(normalPrice * (100 - discountPercent) / 100)
  if (!Number.isSafeInteger(price) || price <= 0) throw new Error('Prix journalier invalide.')
  return { boosterId, category, quantity, unitPrice, discountPercent, normalPrice, price, purchased: false, owned: 0 }
}
export function rollDailyCards(catalogue: CardDefinition[], rng: Rng = secureRandom): WeeklyOffer[] {
  const available = catalogue.filter(c => !c.promoNumber && !c.eventId), offers: WeeklyOffer[] = []
  const count = Math.min(Number(weightedPick(DAILY_CARD_COUNT_WEIGHTS, rng)), available.length)
  for (let i = 0; i < count; i++) {
    const rarities = (Object.keys(DEFAULT_RARITY_RATES) as Rarity[]).filter(r => available.some(c => c.rarity === r))
    const rarity = weightedPick(redistributeRates(DEFAULT_RARITY_RATES, rarities), rng)
    const choices = available.filter(c => c.rarity === rarity)
    const cardId = weightedPick(Object.fromEntries(choices.map(c => [c.id, c.weight ?? 1])), rng)
    const finish = weightedPick(DEFAULT_FINISH_RATES, rng), artVariant = weightedPick(DEFAULT_ART_VARIANT_RATES, rng)
    offers.push({ id: String(i), cardId, finish, artVariant, price: showcasePrice(rarity, finish, artVariant, rng), sold: false })
    available.splice(available.findIndex(c => c.id === cardId), 1)
  }
  return offers
}
export function createDailyShop(catalogue: CardDefinition[], now: number, rng: Rng = secureRandom): DailyShopRow {
  return { id: 'current', ...dailyPeriod(now), bundle: rollDailyBundle(eligibleDailyEntries(catalogue), DAILY_EVENT_CATEGORY_WEIGHT, rng), cards: rollDailyCards(catalogue, rng) }
}
export function validDailyShop(value: unknown, catalogue: CardDefinition[]): value is DailyShopRow {
  try {
    if (!value || typeof value !== 'object') return false
    const row = value as DailyShopRow, b = row.bundle
    const integer = (n: number) => Number.isSafeInteger(n) && n >= 0
    if (row.id !== 'current' || !integer(row.dayStart) || dailyPeriod(row.dayStart).dayStart !== row.dayStart || dailyPeriod(row.dayStart).renewAt !== row.renewAt) return false
    if (row.rerollCount !== undefined && (!integer(row.rerollCount) || row.rerollCount < 1)) return false
    if (row.priorBundles !== undefined && (!Array.isArray(row.priorBundles) || row.priorBundles.length > (row.rerollCount ?? 0) || row.priorBundles.some(b => !DAILY_SELECTION.some(e => e.id === b.boosterId) || !integer(b.owned) || b.owned < 1 || b.owned > 10))) return false
    const entry = DAILY_SELECTION.find(e => e.id === b.boosterId && e.category === b.category)
    const definition = entry && dailyDefinition(entry.id)
    if (!definition || shopOffer(definition)?.price !== b.unitPrice) return false
    if (![b.quantity, b.discountPercent, b.normalPrice, b.price, b.owned].every(integer) || b.quantity < 5 || b.quantity > 10 || b.discountPercent < 5 || b.discountPercent > 20) return false
    if (b.normalPrice !== b.quantity * b.unitPrice || b.price !== Math.round(b.normalPrice * (100 - b.discountPercent) / 100) || typeof b.purchased !== 'boolean' || b.owned > b.quantity || (!b.purchased && b.owned !== 0)) return false
    if (!Array.isArray(row.cards) || row.cards.length > 3 || new Set(row.cards.map(o => o.cardId)).size !== row.cards.length) return false
    return row.cards.every((o, i) => o.id === String(i) && catalogue.some(c => c.id === o.cardId && !c.promoNumber && !c.eventId) && Object.hasOwn(DEFAULT_FINISH_RATES, o.finish) && Object.hasOwn(DEFAULT_ART_VARIANT_RATES, o.artVariant) && integer(o.price) && o.price > 0 && o.price % 10 === 0 && typeof o.sold === 'boolean')
  } catch { return false }
}
