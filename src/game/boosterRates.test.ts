import { describe, expect, it } from 'vitest'
import { boosters } from '../data/boosters'
import { cards } from '../data/cards'
import { fixtureBoosters } from '../test-fixtures'
import { DEFAULT_ART_VARIANT_RATES, DEFAULT_FINISH_RATES, DEFAULT_RARITY_RATES } from './config'
import { resolveBoosterRates } from './boosterRates'
import { drawPack, resolveBoosterPool, validateConfiguration } from './engine'
import type { BoosterDefinition } from './types'

const stellar = boosters.find(booster => booster.id === 'epico-stellari')!

describe('taux propres à chaque booster', () => {
  it('réserve rarity only à la boutique et tire cinq rares avec les finitions habituelles', () => {
    const rareOnly = boosters.find(booster => booster.id === 'rarity-only')!
    expect(rareOnly.access).toEqual({ type: 'shop', price: 400 })
    expect(resolveBoosterRates(rareOnly)).toEqual({ rarity: { common: 0, uncommon: 0, rare: 100, epic: 0, legendary: 0 }, finish: DEFAULT_FINISH_RATES, illustration: DEFAULT_ART_VARIANT_RATES })
    const future = { ...cards[0], id: 'future-rare', rarity: 'rare' as const }
    expect(resolveBoosterPool(rareOnly, [...cards, future]).map(entry => entry.card.id)).toEqual([...cards.filter(card => card.rarity === 'rare').map(card => card.id), 'future-rare'])
    for (const random of [0, .82, .99]) {
      const drops = drawPack(rareOnly, cards, () => random)
      expect(drops).toHaveLength(5)
      expect(drops.every(drop => cards.find(card => card.id === drop.cardId)?.rarity === 'rare')).toBe(true)
      expect(drops.every(drop => drop.finish === (random === .99 ? 'alternative' : random === .82 ? 'glossy' : 'normal'))).toBe(true)
      expect(drops.every(drop => drop.artVariant === (random === .99 ? 'fullArt' : 'standard'))).toBe(true)
    }
    expect(() => validateConfiguration(cards, [rareOnly])).not.toThrow()
    expect(() => validateConfiguration(cards.filter(card => card.rarity !== 'rare'), [rareOnly])).toThrow(/rare/)
  })
  it('conserve les trois distributions par défaut pour les anciens paquets', () => {
    for (const booster of [...fixtureBoosters, ...boosters.slice(0, 2)]) expect(resolveBoosterRates(booster)).toEqual({
      rarity: DEFAULT_RARITY_RATES, finish: DEFAULT_FINISH_RATES, illustration: DEFAULT_ART_VARIANT_RATES,
    })
    expect(DEFAULT_RARITY_RATES).toEqual({ common: 57, uncommon: 24, rare: 12, epic: 5, legendary: 2 })
    expect(DEFAULT_FINISH_RATES).toEqual({ normal: 81, glossy: 15, alternative: 4 })
    expect(DEFAULT_ART_VARIANT_RATES).toEqual({ standard: 92, fullArt: 8 })
  })

  it('applique indépendamment les finitions et illustrations personnalisées', () => {
    const booster: BoosterDefinition = { ...fixtureBoosters[0], rates: {
      finish: { normal: 0, glossy: 0, alternative: 100 }, illustration: { standard: 0, fullArt: 100 },
    } }
    expect(resolveBoosterRates(booster).rarity).toEqual(DEFAULT_RARITY_RATES)
    const drops = drawPack(booster, cards, () => 0)
    expect(drops.every(drop => drop.finish === 'alternative' && drop.artVariant === 'fullArt')).toBe(true)
    expect(drops.every(drop => cards.find(card => card.id === drop.cardId)?.rarity === 'common')).toBe(true)
  })

  it('respecte les bornes 91 % épique et 9 % légendaire, sans autre rareté', () => {
    for (const [random, expected] of [[0, 'epic'], [.909999, 'epic'], [.91, 'legendary'], [.999999, 'legendary']] as const) {
      let call = 0
      const drops = drawPack(stellar, cards, () => call++ % 4 === 0 ? random : 0)
      expect(drops).toHaveLength(5)
      expect(drops.every(drop => cards.find(card => card.id === drop.cardId)?.rarity === expected)).toBe(true)
      expect(drops.every(drop => drop.finish === 'normal' && drop.artVariant === 'standard')).toBe(true)
    }
    expect(() => validateConfiguration(cards, [stellar])).not.toThrow()
  })

  it('intègre les futures épiques et légendaires une seule fois dans le pool dynamique', () => {
    const future = [
      { ...cards[0], id: 'future-epic', rarity: 'epic' as const },
      { ...cards[0], id: 'future-legendary', rarity: 'legendary' as const },
      { ...cards[0], id: 'future-common' },
    ]
    const pool = resolveBoosterPool(stellar, [...cards, ...future]).map(entry => entry.card.id)
    expect(pool).toEqual([...cards.filter(card => card.rarity === 'epic' || card.rarity === 'legendary').map(card => card.id), 'future-epic', 'future-legendary'])
    expect(new Set(pool).size).toBe(pool.length)
    expect(() => validateConfiguration([...cards, ...future], boosters)).not.toThrow()
  })

  it('refuse les taux incomplets, inconnus, négatifs ou non totalisés à 100', () => {
    for (const finish of [
      { normal: 100 }, { normal: 81, glossy: 15, alternative: 4, unknown: 0 },
      { normal: 81, glossy: 15, alternative: 3 }, { normal: 101, glossy: -1, alternative: 0 },
      { normal: NaN, glossy: 15, alternative: 4 }, { normal: Infinity, glossy: 0, alternative: 0 },
    ]) {
      const booster = { ...stellar, rates: { finish } } as BoosterDefinition
      expect(() => resolveBoosterRates(booster)).toThrow(/Configuration/)
      expect(() => validateConfiguration(cards, [booster])).toThrow(/Configuration/)
    }
    expect(() => validateConfiguration(cards.filter(card => card.rarity !== 'legendary'), [stellar])).toThrow(/légendaire|legendary/)
  })
})
