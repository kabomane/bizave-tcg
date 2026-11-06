import { describe, expect, it } from 'vitest'
import { cards } from '../data/cards'
import { createWeeklyShop, rollWeeklyShowcase, redistributeRates, validWeeklyShop, weeklyPeriod } from './weeklyShop'
import { DEFAULT_RARITY_RATES } from './config'
import { drawPack, validateConfiguration } from './engine'

const now = Date.parse('2026-11-06T12:00:00Z')
function seeded(seed: number) { return () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 2 ** 32 } }
describe('génération hebdomadaire', () => {
  it.each([
    [.6999, .8499, 'normal', 'standard'],
    [.70, .8499, 'glossy', 'standard'],
    [.9199, .85, 'glossy', 'fullArt'],
    [.92, .85, 'alternative', 'fullArt'],
  ] as const)('applique les seuils de finition et Full Art propres à la vitrine (%s, %s)', (finishRoll, artRoll, finish, artVariant) => {
    const rolls = [0, 0, 0, finishRoll, artRoll, .5, .5]
    const [offer] = rollWeeklyShowcase(cards, () => rolls.shift() ?? .5)
    expect(offer).toMatchObject({ finish, artVariant })
    if (finish === 'alternative' && artVariant === 'fullArt') expect(offer.price).toBe(50)
  })
  it('redistribue uniquement entre les raretés retenues', () => {
    expect(redistributeRates(DEFAULT_RARITY_RATES, ['common', 'rare'])).toEqual({ common: 83, uncommon: 0, rare: 17, epic: 0, legendary: 0 })
  })
  it('limite un pool légendaire au nombre de modèles réellement disponibles', () => {
    const catalogue = cards.filter(c => c.rarity === 'legendary').slice(0, 8)
    const shop = createWeeklyShop(catalogue, now, () => .99)
    expect(shop.booster.definition.sources).toEqual([{ type: 'cards', cardIds: expect.arrayContaining(catalogue.map(c => c.id)) }])
    expect(shop.booster.definition.rates?.rarity).toEqual({ common: 0, uncommon: 0, rare: 0, epic: 0, legendary: 100 })
    validateConfiguration(catalogue, [shop.booster.definition])
    expect(drawPack(shop.booster.definition, catalogue)).toHaveLength(5)
  })
  it('produit des offres distinctes, des prix valides et des pools ouvrables sur de nombreux tirages', () => {
    const counts = new Set<number>()
    for (let seed = 1; seed <= 200; seed++) {
      const shop = createWeeklyShop(cards, now, seeded(seed))
      expect(validWeeklyShop(shop, cards)).toBe(true)
      validateConfiguration(cards, [shop.booster.definition])
      expect(drawPack(shop.booster.definition, cards, seeded(seed))).toHaveLength(5)
      counts.add(shop.offers.length)
    }
    expect([...counts].sort()).toEqual([1, 2, 3, 4, 5])
  })
  it('fixe le lundi à minuit à Paris, y compris les semaines de changement d’heure', () => {
    expect(weeklyPeriod(now)).toEqual({ weekStart: Date.parse('2026-11-01T23:00:00Z'), rerollAt: Date.parse('2026-11-08T23:00:00Z') })
    const spring = weeklyPeriod(Date.parse('2026-03-27T12:00:00Z'))
    const autumn = weeklyPeriod(Date.parse('2026-10-23T12:00:00Z'))
    expect(spring.rerollAt - spring.weekStart).toBe(167 * 3600_000)
    expect(autumn.rerollAt - autumn.weekStart).toBe(169 * 3600_000)
    expect(weeklyPeriod(spring.rerollAt).weekStart).toBe(spring.rerollAt)
  })
  it('refuse les stocks, prix, taux ou pools invalides dans une sauvegarde', () => {
    for (const change of [
      (s: ReturnType<typeof createWeeklyShop>) => { s.booster.owned = 99 },
      (s: ReturnType<typeof createWeeklyShop>) => { s.booster.price = -10 },
      (s: ReturnType<typeof createWeeklyShop>) => { s.booster.definition.sources = [{ type: 'cards', cardIds: ['inconnue'] }] },
      (s: ReturnType<typeof createWeeklyShop>) => { s.booster.definition.rates = { rarity: { common: 100, uncommon: 100, rare: 0, epic: 0, legendary: 0 } } },
    ]) { const shop = createWeeklyShop(cards, now); change(shop); expect(validWeeklyShop(shop, cards)).toBe(false) }
  })
})
