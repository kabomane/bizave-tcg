import { describe, expect, it } from 'vitest'
import { cards } from '../data/cards'
import { shopBoosters } from './boosterAvailability'
import { boosters } from '../data/boosters'
import { drawPack } from './engine'
import { createDailyShop, dailyDefinition, dailyPeriod, eligibleDailyEntries, pickWeighted, rollDailyBundle, rollDailyCards, validDailyShop } from './dailyShop'

const now = Date.parse('2026-11-12T12:00:00Z')
const sequence = (...values: number[]) => { let i = 0; return () => values[i++] ?? 0 }
describe('offres journalières', () => {
  it.each([['2026-03-29T12:00:00Z', 23], ['2026-10-25T12:00:00Z', 25], ['2026-11-12T23:00:00Z', 24]])('respecte les minuits de Paris et la durée du %s', (date, hours) => {
    const period = dailyPeriod(Date.parse(date))
    expect(period.renewAt - period.dayStart).toBe(hours * 3600_000)
    expect(dailyPeriod(period.renewAt - 1)).toEqual(period)
    expect(dailyPeriod(period.renewAt).dayStart).toBe(period.renewAt)
  })
  it('sélectionne les deux niveaux avec les probabilités globales 44,8/44,8/8/2/0,4', () => {
    const entries = eligibleDailyEntries(cards, false), counts: Record<string, number> = {}
    // Cartesian grid integrates both independent draws exactly, no flaky sample.
    for (let category = 0; category < 1000; category++) for (let edition = 0; edition < 26; edition++) {
      const b = rollDailyBundle(entries, 0, sequence((category + .5) / 1000, (edition + .5) / 26))
      counts[b.boosterId] = (counts[b.boosterId] ?? 0) + 1
    }
    expect(counts).toEqual({ 'phantom-blood': 11648, 'anima-isekai': 11648, 'rarity-only': 2080, 'epico-stellari': 520, 'legenda-completa': 104 })
  })
  it('préserve la masse spéciale avec événements et ignore les événements inactifs', () => {
    const entries = eligibleDailyEntries(cards, true)
    expect(rollDailyBundle(entries, 50, sequence(.88, 0)).category).toBe('special')
    expect(rollDailyBundle(entries, 50, sequence(.99, 0)).boosterId).toBe('christmas-gift')
    expect(rollDailyBundle(eligibleDailyEntries(cards, false), 50, sequence(.99, .99)).boosterId).toBe('legenda-completa')
    expect(() => rollDailyBundle(entries, 897)).toThrow()
    expect(() => pickWeighted([{ id: 'a', weight: 0 }])).toThrow()
  })
  it('respecte quantité, remise indépendante et arrondi unique au fragment', () => {
    const entries = eligibleDailyEntries(cards, false)
    expect(rollDailyBundle(entries, 0, sequence(0, .8, 0, 0))).toMatchObject({ boosterId: 'anima-isekai', quantity: 5, discountPercent: 5, normalPrice: 250, price: 238 })
    expect(rollDailyBundle(entries, 0, sequence(.99, .99, .999, .999))).toMatchObject({ boosterId: 'legenda-completa', quantity: 10, discountPercent: 20, price: 12800 })
    const counts: Record<number, number> = {}
    for (let i = 0; i < 100; i++) { const b = rollDailyBundle(entries, 0, sequence(0, 0, (i + .5) / 100, 0)); counts[b.quantity] = (counts[b.quantity] ?? 0) + 1 }
    expect(counts).toEqual({ 5: 30, 6: 25, 7: 20, 8: 12, 9: 8, 10: 5 })
  })
  it('tire 0–3 modèles distincts aux taux normaux et conserve le prix hebdomadaire', () => {
    expect(rollDailyCards(cards, () => 0)).toEqual([])
    const offers = rollDailyCards(cards, sequence(.99))
    expect(offers).toHaveLength(3)
    expect(new Set(offers.map(o => o.cardId)).size).toBe(3)
    expect(offers.every(o => o.finish === 'normal' && o.artVariant === 'standard' && o.price === 10)).toBe(true)
    expect(offers.every(o => !cards.find(c => c.id === o.cardId)!.promoNumber)).toBe(true)
  })
  it('garantit cinq légendaires, finitions et Full Art ordinaires, sans accès permanent', () => {
    const definition = dailyDefinition('legenda-completa')!
    const drops = drawPack(definition, cards, () => .99)
    expect(drops).toHaveLength(5)
    expect(drops.every(d => cards.find(c => c.id === d.cardId)!.rarity === 'legendary' && d.finish === 'alternative' && d.artVariant === 'fullArt')).toBe(true)
    expect(shopBoosters(boosters).some(b => b.id === definition.id)).toBe(false)
  })
  it('refuse les états corrompus et les prix, catégories et stocks incohérents', () => {
    const shop = createDailyShop(cards, now, () => .5)
    expect(validDailyShop(shop, cards)).toBe(true)
    for (const patch of [{ quantity: 4 }, { discountPercent: 21 }, { price: -10 }, { price: shop.bundle.price + 1 }, { unitPrice: 1 }, { category: 'event' }, { owned: 1 }, { purchased: true, owned: 11 }]) expect(validDailyShop({ ...shop, bundle: { ...shop.bundle, ...patch } }, cards)).toBe(false)
    expect(validDailyShop({ ...shop, renewAt: shop.renewAt + 1 }, cards)).toBe(false)
    expect(validDailyShop({ ...shop, cards: [shop.cards[0], shop.cards[0]] }, cards)).toBe(false)
  })
})
