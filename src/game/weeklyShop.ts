import { DEFAULT_ART_VARIANT_RATES, DEFAULT_FINISH_RATES, DEFAULT_RARITY_RATES, RECYCLE_BASE_FRAGMENTS, FINISH_MULTIPLIER_TENTHS, ART_MULTIPLIER_TENTHS } from './config'
import { secureRandom, weightedPick } from './engine'
import { resolveBoosterRates } from './boosterRates'
import type { ArtVariant, BoosterDefinition, CardDefinition, Finish, Rarity } from './types'

export const WEEKLY_BOOSTER_ID = 'weekly-mystery'
export const WEEKLY_BOOSTER_TITLE = 'lucky boost'
export const WEEKLY_BOOSTER_COLORS = { primary: '#446658', secondary: '#15271f', shine: '#e5d6aa', glow: '#8bad8a' }
export const SALES_CLOSE_MS = 2 * 60 * 60 * 1000
export const WEEKLY_REROLL_PRICE = 150
const MAX_WEEKLY_BOOSTER_STOCK = 4
export const WEEKLY_SHOWCASE_RATES = {
  rarity: { common: 30, uncommon: 25, rare: 20, epic: 13, legendary: 12 },
  finish: { normal: 70, glossy: 22, alternative: 8 },
  illustration: { standard: 85, fullArt: 15 },
} as const
type Rng = () => number
export type WeeklyOffer = { id: string; cardId: string; finish: Finish; artVariant: ArtVariant; price: number; sold: boolean }
type PriorWeeklyBooster = { definition: BoosterDefinition; owned: number }
export type WeeklyShopRow = {
  id: 'current'; weekStart: number; rerollAt: number
  booster: { definition: BoosterDefinition; price: number; stock: number; remaining: number; owned: number }
  offers: WeeklyOffer[]
  rerollUsed?: true
  rerollCount?: number
  fragmentsClaimed?: true
  priorBooster?: PriorWeeklyBooster // Saves created before gift rerolls.
  priorBoosters?: PriorWeeklyBooster[]
}

export function weeklyRerollCount(shop: WeeklyShopRow) {
  return shop.rerollCount ?? Number(!!shop.rerollUsed)
}
export function priorWeeklyBoosters(shop: WeeklyShopRow) {
  return shop.priorBoosters ?? (shop.priorBooster ? [shop.priorBooster] : [])
}

const parisDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' })
export function parisParts(time: number) {
  return Object.fromEntries(parisDate.formatToParts(time).filter(p => p.type !== 'literal').map(p => [p.type, Number(p.value)]))
}
export function parisMidnight(calendarDate: number) {
  let result = calendarDate
  for (let i = 0; i < 3; i++) {
    const p = parisParts(result)
    result += calendarDate - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  }
  return result
}
export function weeklyPeriod(now: number) {
  const p = parisParts(now), day = Date.UTC(p.year, p.month - 1, p.day)
  const monday = day - ((new Date(day).getUTCDay() + 6) % 7) * 86400_000
  return { weekStart: parisMidnight(monday), rerollAt: parisMidnight(monday + 7 * 86400_000) }
}
const int = (min: number, max: number, rng: Rng) => min + Math.floor(rng() * (max - min + 1))
const round10 = (value: number) => Math.max(10, Math.round(value / 10) * 10)
const variation = (rng: Rng) => .8 + (rng() + rng()) * .2

export function rollFragmentReward(rng: Rng = secureRandom) {
  return round10((int(10, 300, rng) + int(10, 300, rng)) / 2)
}
export function redistributeRates<T extends string>(defaults: Record<T, number>, present: T[]): Record<T, number> {
  const keys = Object.keys(defaults) as T[], total = present.reduce((sum, key) => sum + defaults[key], 0)
  if (!total) throw new Error('Aucune catégorie disponible pour la boutique.')
  const rates = Object.fromEntries(keys.map(key => [key, present.includes(key) ? Math.floor(defaults[key] / total * 100) : 0])) as Record<T, number>
  rates[keys.find(key => present.includes(key))!] += 100 - Object.values<number>(rates).reduce((sum, rate) => sum + rate, 0)
  return rates
}
function rollRates<T extends string>(defaults: Record<T, number>, rng: Rng, eligible = Object.keys(defaults) as T[]) {
  if (!eligible.length) throw new Error('Aucune carte disponible pour la boutique.')
  const present = eligible.filter(() => rng() < .7)
  return redistributeRates(defaults, present.length ? present : [eligible[int(0, eligible.length - 1, rng)]])
}
function cardValue(rarity: Rarity, finish: Finish = 'normal', art: ArtVariant = 'standard') {
  return 3 * RECYCLE_BASE_FRAGMENTS[rarity] * FINISH_MULTIPLIER_TENTHS[finish] * ART_MULTIPLIER_TENTHS[art] / 100
}
export function showcasePrice(rarity: Rarity, finish: Finish, art: ArtVariant, rng: Rng) {
  return round10(cardValue(rarity, finish, art) * 2.75 * variation(rng))
}
function shuffle<T>(items: T[], rng: Rng) {
  const shuffled = [...items]
  for (let i = shuffled.length - 1; i > 0; i--) { const j = int(0, i, rng); [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]] }
  return shuffled
}
function rollWeeklyBooster(catalogue: CardDefinition[], rng: Rng = secureRandom): WeeklyShopRow['booster'] {
  const available = catalogue.filter(c => !c.promoNumber)
  const eligible = (Object.keys(DEFAULT_RARITY_RATES) as Rarity[]).filter(r => available.some(c => c.rarity === r))
  const rarity = rollRates(DEFAULT_RARITY_RATES, rng, eligible)
  const finish = rollRates(DEFAULT_FINISH_RATES, rng), illustration = rollRates(DEFAULT_ART_VARIANT_RATES, rng)
  const candidates = available.filter(c => rarity[c.rarity] > 0), size = Math.min(int(40, 80, rng), candidates.length)
  // Seed each active rarity, then fill without repeating models. Rates remain exact.
  const required = eligible.filter(r => rarity[r] > 0).map(r => { const choices = candidates.filter(c => c.rarity === r); return choices[int(0, choices.length - 1, rng)] })
  const used = new Set(required.map(c => c.id))
  const pool = [...required, ...shuffle(candidates.filter(c => !used.has(c.id)), rng)].slice(0, size)
  const avgFinish = (Object.keys(finish) as Finish[]).reduce((sum, key) => sum + finish[key] / 100 * FINISH_MULTIPLIER_TENTHS[key] / 10, 0)
  const avgArt = (Object.keys(illustration) as ArtVariant[]).reduce((sum, key) => sum + illustration[key] / 100 * ART_MULTIPLIER_TENTHS[key] / 10, 0)
  const content = 5 * eligible.reduce((sum, key) => sum + rarity[key] / 100 * cardValue(key), 0) * avgFinish * avgArt
  const targeted = rarity.common === 0 || finish.normal === 0 || illustration.standard === 0
  const price = Math.max(round10(content * (targeted ? 2.75 : 1.1) * variation(rng)), Math.ceil(content / 10) * 10)
  const stock = int(1, MAX_WEEKLY_BOOSTER_STOCK, rng)
  const definition: BoosterDefinition = {
    id: WEEKLY_BOOSTER_ID, title: WEEKLY_BOOSTER_TITLE, subtitle: '', description: '',
    artwork: { emoji: '🍀', colors: { ...WEEKLY_BOOSTER_COLORS } },
    access: { type: 'shop', price, listed: false }, cardsPerPack: 5, sources: [{ type: 'cards', cardIds: pool.map(c => c.id) }],
    rates: { rarity, finish, illustration }, enabled: true, order: -1, showInFilters: false,
  }
  return { definition, price, stock, remaining: stock, owned: 0 }
}

export function rollWeeklyShowcase(catalogue: CardDefinition[], rng: Rng = secureRandom): WeeklyOffer[] {
  const available = catalogue.filter(c => !c.promoNumber), offers: WeeklyOffer[] = []
  const eligible = (Object.keys(DEFAULT_RARITY_RATES) as Rarity[]).filter(r => available.some(c => c.rarity === r))
  const count = Math.min(int(1, 5, rng), available.length)
  for (let i = 0; i < count; i++) {
    const availableRarities = eligible.filter(r => available.some(c => c.rarity === r))
    const r = weightedPick(redistributeRates(WEEKLY_SHOWCASE_RATES.rarity, availableRarities), rng)
    const choices = available.filter(c => c.rarity === r), card = choices[int(0, choices.length - 1, rng)]
    const f = weightedPick(WEEKLY_SHOWCASE_RATES.finish, rng), a = weightedPick(WEEKLY_SHOWCASE_RATES.illustration, rng)
    offers.push({ id: String(i), cardId: card.id, finish: f, artVariant: a, price: showcasePrice(r, f, a, rng), sold: false })
    available.splice(available.findIndex(c => c.id === card.id), 1)
  }
  return offers
}

export function createWeeklyShop(catalogue: CardDefinition[], now: number, rng: Rng = secureRandom): WeeklyShopRow {
  return { id: 'current', ...weeklyPeriod(now), booster: rollWeeklyBooster(catalogue, rng), offers: rollWeeklyShowcase(catalogue, rng) }
}

export function rerollWeeklyOffers(shop: WeeklyShopRow, catalogue: CardDefinition[]): WeeklyShopRow {
  const { booster } = shop
  const priorBoosters = [...priorWeeklyBoosters(shop)]
  if (booster.owned > 0) priorBoosters.push({ definition: booster.definition, owned: booster.owned })
  const next: WeeklyShopRow = {
    ...shop,
    rerollCount: weeklyRerollCount(shop) + 1,
    priorBoosters: priorBoosters.length ? priorBoosters : undefined,
    booster: rollWeeklyBooster(catalogue),
    offers: rollWeeklyShowcase(catalogue),
  }
  delete next.priorBooster
  return next
}

function validWeeklyBooster(definition: BoosterDefinition, catalogue: CardDefinition[]) {
  if (definition.id !== WEEKLY_BOOSTER_ID || definition.title !== WEEKLY_BOOSTER_TITLE || definition.cardsPerPack !== 5 || !definition.enabled) return false
  if (definition.access.type !== 'shop' || definition.access.listed !== false || !Number.isSafeInteger(definition.access.price) || definition.access.price <= 0 || definition.access.price % 10 !== 0) return false
  const [source] = definition.sources
  if (definition.sources.length !== 1 || source.type !== 'cards') return false
  const pool = source.cardIds, rates = resolveBoosterRates(definition)
  if (!pool.length || pool.length > 80 || new Set(pool).size !== pool.length || pool.some(id => !catalogue.some(c => c.id === id && rates.rarity[c.rarity] > 0))) return false
  return (Object.keys(rates.rarity) as Rarity[]).every(r => rates.rarity[r] === 0 || pool.some(id => catalogue.some(c => c.id === id && c.rarity === r)))
}

/** Validate imported weekly state before it can supply prices, stock or pools. */
export function validWeeklyShop(value: unknown, catalogue: CardDefinition[]): value is WeeklyShopRow {
  try {
    if (!value || typeof value !== 'object') return false
    const eligible = catalogue.filter(card => !card.promoNumber)
    const row = value as WeeklyShopRow, b = row.booster, d = b.definition
    const integer = (n: number) => Number.isSafeInteger(n) && n >= 0
    const price = (n: number) => integer(n) && n > 0 && n % 10 === 0
    if (row.id !== 'current' || !integer(row.weekStart) || weeklyPeriod(row.weekStart).weekStart !== row.weekStart || weeklyPeriod(row.weekStart).rerollAt !== row.rerollAt) return false
    if (![b.stock, b.remaining, b.owned].every(integer) || b.stock < 1 || b.stock > MAX_WEEKLY_BOOSTER_STOCK || b.remaining + b.owned > b.stock || !price(b.price)) return false
    if (!validWeeklyBooster(d, eligible) || d.access.type !== 'shop' || d.access.price !== b.price) return false
    if (row.rerollUsed !== undefined && row.rerollUsed !== true) return false
    if (row.rerollCount !== undefined && (!integer(row.rerollCount) || row.rerollCount < 1)) return false
    if (row.fragmentsClaimed !== undefined && row.fragmentsClaimed !== true) return false
    if (row.priorBooster !== undefined && (!row.priorBooster || !row.rerollUsed || row.rerollCount !== undefined || row.priorBoosters !== undefined)) return false
    if (row.priorBoosters !== undefined && (!Array.isArray(row.priorBoosters) || row.rerollCount === undefined)) return false
    const prior = priorWeeklyBoosters(row)
    if (prior.length > weeklyRerollCount(row) || prior.some(batch => !integer(batch.owned) || batch.owned < 1 || batch.owned > MAX_WEEKLY_BOOSTER_STOCK || !validWeeklyBooster(batch.definition, eligible))) return false
    return row.offers.length >= 1 && row.offers.length <= 5 && new Set(row.offers.map(o => o.id)).size === row.offers.length && new Set(row.offers.map(o => o.cardId)).size === row.offers.length && row.offers.every((o, i) => o.id === String(i) && eligible.some(c => c.id === o.cardId) && Object.hasOwn(DEFAULT_FINISH_RATES, o.finish) && Object.hasOwn(DEFAULT_ART_VARIANT_RATES, o.artVariant) && price(o.price) && typeof o.sold === 'boolean')
  } catch { return false }
}
