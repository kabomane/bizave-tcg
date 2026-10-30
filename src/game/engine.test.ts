import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cards } from '../data/cards'
import { boosters as publishedBoosters } from '../data/boosters'
import memoryFrameIds from '../data/pools/memory-frame.json'
import animaIsekaiIds from '../data/pools/anima-isekai.json'
import { fixtureBoosters as boosters } from '../test-fixtures'
import { DEFAULT_ART_VARIANT_RATES, DEFAULT_FINISH_RATES, DEFAULT_RARITY_RATES, FREE_PACK_RECHARGE_MS, RECYCLE_BASE_FRAGMENTS } from './config'
import { consumeFreePack, drawPack, getRecycleFragments, resolveBoosterPool, settleFreePackRecharge, validateConfiguration, validateRates, variantKey, weightedPick } from './engine'
import { resolveBoosterRates } from './boosterRates'
import { shopOffer } from './boosterAvailability'
import type { ArtVariant, BoosterDefinition, Finish, Rarity } from './types'

const minute = 60_000
describe('catalogue et configuration', () => {
  it('publie Memory Frame et Anima Isekai avec leurs accès et leurs pools distincts', () => {
    expect(publishedBoosters).toHaveLength(3)
    expect(publishedBoosters[0]).toMatchObject({ id: 'phantom-blood', title: 'Memory Frame', subtitle: '158 cartes', access: { type: 'free', shop: { price: 70 } }, enabled: true })
    expect(publishedBoosters[1]).toMatchObject({ id: 'anima-isekai', title: 'Anima Isekai', subtitle: '59 cartes', access: { type: 'free', shop: { price: 50 } }, enabled: true })
    expect(publishedBoosters[2]).toMatchObject({ id: 'epico-stellari', title: 'epico stellari', subtitle: '46 cartes', access: { type: 'shop', price: 700 }, cardsPerPack: 5, enabled: true })
    expect(new Set(resolveBoosterPool(publishedBoosters[0], cards).map(entry => entry.card.id))).toEqual(new Set(memoryFrameIds))
    expect(new Set(resolveBoosterPool(publishedBoosters[1], cards).map(entry => entry.card.id))).toEqual(new Set(animaIsekaiIds))
    expect(memoryFrameIds).toHaveLength(158)
    expect(animaIsekaiIds).toHaveLength(59)
    expect(new Set([...memoryFrameIds, ...animaIsekaiIds]).size).toBe(217)
    expect(new Set([...memoryFrameIds, ...animaIsekaiIds])).toEqual(new Set(cards.map(card => card.id)))
  })
  it('respecte les raretés des deux carnets et valide les illustrations du catalogue complet', () => {
    const counts = publishedBoosters.map(booster => {
      const pool = resolveBoosterPool(booster, cards)
      return Object.fromEntries(Object.keys(DEFAULT_RARITY_RATES).map(r => [r, pool.filter(entry => entry.card.rarity === r).length]))
    })
    expect(counts).toEqual([
      { common: 57, uncommon: 40, rare: 29, epic: 20, legendary: 12 },
      { common: 19, uncommon: 15, rare: 11, epic: 10, legendary: 4 },
      { common: 0, uncommon: 0, rare: 0, epic: 30, legendary: 16 },
    ])
    for (const card of cards) {
      expect(existsSync(resolve('public', card.artwork.standard.slice(1)))).toBe(true)
      expect(existsSync(resolve('public', card.artwork.fullArt.slice(1)))).toBe(true)
    }
    expect(() => validateConfiguration(cards, publishedBoosters)).not.toThrow()
  })
  it('les profils de tirage totalisent 100 et refusent les valeurs invalides', () => {
    for (const profile of [DEFAULT_RARITY_RATES, DEFAULT_FINISH_RATES, DEFAULT_ART_VARIANT_RATES]) { expect(Object.values(profile).reduce<number>((a, b) => a + b, 0)).toBe(100); validateRates(profile) }
    for (const profile of [{ x: 99 }, { x: NaN }, { x: 101, y: -1 }] as Record<string, number>[]) expect(() => validateRates(profile)).toThrow()
  })
  it('fige chaque édition même si de nouvelles cartes rejoignent ses groupes', () => {
    const future = ['thomas', 'matthieu', 'speciaux'].map((collectionId, index) => ({ ...cards[0], id: `future-exclusive-${index}`, collectionId }))
    for (const booster of publishedBoosters) {
      expect(resolveBoosterPool(booster, [...cards, ...future])).toEqual(resolveBoosterPool(booster, cards))
    }
    expect(() => validateConfiguration([...cards, ...future], publishedBoosters)).not.toThrow()
  })
  it('refuse IDs en double, image absente, poids, prix et pool invalides', () => {
    expect(() => validateConfiguration([...cards, cards[0]], boosters)).toThrow(/double/)
    expect(() => validateConfiguration([{ ...cards[0], artwork: { ...cards[0].artwork, fullArt: '' } }, ...cards.slice(1)], boosters)).toThrow(/carte invalide/)
    expect(() => validateConfiguration([{ ...cards[0], weight: 0 }, ...cards.slice(1)], boosters)).toThrow()
    expect(() => validateConfiguration(cards, [{ ...boosters[0], access: { type: 'shop', price: -1 } }])).toThrow()
    expect(() => validateConfiguration(cards, [{ ...boosters[0], access: { type: 'shop', price: 0 } }])).toThrow()
    expect(() => validateConfiguration(cards, [{ ...boosters[0], access: { type: 'free', shop: { price: 0 } } }])).toThrow()
    expect(() => validateConfiguration(cards, [{ ...boosters[0], id: 'invalid id' }])).toThrow()
    expect(() => validateConfiguration(cards, [{ ...boosters[0], cardsPerPack: 0 }])).toThrow()
    expect(() => validateConfiguration(cards, [{ ...boosters[0], sources: [{ type: 'cards', cardIds: ['absent'] }] }])).toThrow(/inconnue/)
    expect(() => validateConfiguration(cards, [{ ...boosters[0], sources: [{ type: 'collection', collectionId: 'absent' }] }])).toThrow(/inconnue/)
    expect(() => validateConfiguration(cards, [{ ...boosters[0], sources: [{ type: 'cards', cardIds: [cards[0].id] }] }])).toThrow(/vide/)
    expect(() => validateConfiguration(cards, [{ ...boosters[0], sources: [{ type: 'collection', collectionId: 'thomas', multiplier: NaN }] }])).toThrow()
  })
  it('déduplique les sources en additionnant leurs poids dans une rareté', () => {
    const booster: BoosterDefinition = { ...boosters[0], sources: [{ type: 'collection', collectionId: 'thomas' }, { type: 'cards', cardIds: [cards[0].id], multiplier: .5 }] }
    const pool = resolveBoosterPool(booster, cards)
    expect(pool.filter(p => p.card.id === cards[0].id)).toHaveLength(1)
    expect(pool.find(p => p.card.id === cards[0].id)?.weight).toBe(1.5)
  })
  it('les pools gratuit, exclusif et mixte restent indépendants des noms affichés', () => {
    expect(resolveBoosterPool(boosters[0], cards).some(p => p.card.collectionId === 'speciaux')).toBe(false)
    expect(resolveBoosterPool(boosters[1], cards).every(p => p.card.collectionId === 'speciaux')).toBe(true)
    expect(new Set(resolveBoosterPool({ ...boosters[2], title: 'Autre nom' }, cards).map(p => p.card.collectionId)).size).toBe(3)
  })
  it('conserve les déclarations finales des compositions actives de la référence', () => {
    const demo = readFileSync('references/demo-cartes-finitions.html', 'utf8').match(/<style>([\s\S]*?)<\/style>/)![1]
    const reference = demo.slice(demo.indexOf('/* ───────── Carte'), demo.indexOf('  .label'))
    const rules = (css: string) => {
      const result = new Map<string, Map<string, string>>()
      for (const match of css.replace(/\/\*[\s\S]*?\*\//g, '').matchAll(/([^{}]+)\{([^{}]*)\}/g)) for (const selector of match[1].trim().split(/,\s*/)) {
        if (/\.(layout-magic|sample-art)\b/.test(selector)) continue
        const declarations = result.get(selector) || new Map<string, string>()
        for (const declaration of match[2].matchAll(/([-\w]+)\s*:\s*([^;]+)(?:;|$)/g)) declarations.set(declaration[1], declaration[2].trim())
        result.set(selector, declarations)
      }
      return result
    }
    const actual = rules(readFileSync('src/styles/cards-reference.css', 'utf8'))
    for (const [selector, declarations] of rules(reference)) expect(actual.get(selector), selector).toEqual(declarations)
    expect(readFileSync('src/styles/application.css', 'utf8')).toMatch(/-webkit-mask-image:\s*none/)
    const component = readFileSync('src/components/CollectibleCard.tsx', 'utf8')
    expect(component).toContain("card.artVariant === 'fullArt' ? 'gundam' : 'fusion'")
  })
})
describe('tirages indépendants', () => {
  it('respecte les limites exactes et refuse une source RNG invalide', () => {
    expect(weightedPick(DEFAULT_RARITY_RATES, () => .569999)).toBe('common')
    expect(weightedPick(DEFAULT_RARITY_RATES, () => .57)).toBe('uncommon')
    expect(weightedPick(DEFAULT_RARITY_RATES, () => .98)).toBe('legendary')
    expect(() => weightedPick(DEFAULT_RARITY_RATES, () => 1)).toThrow()
  })
  it('produit les six variantes, sans modifier la rareté, avec remise et cinq UUID v4 distincts', () => {
    for (const [finishRoll, finish] of [[.1, 'normal'], [.85, 'glossy'], [.99, 'alternative']] as const) for (const [artRoll, artVariant] of [[.1, 'standard'], [.99, 'fullArt']] as const) {
      let i = 0; const sequence = [.99, finishRoll, artRoll, 0]
      const drops = drawPack(boosters[0], cards, () => sequence[i++ % 4])
      expect(new Set(drops.map(d => d.dropId)).size).toBe(5)
      expect(new Set(drops.map(d => d.cardId)).size).toBe(1)
      for (const d of drops) { expect(d.dropId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/); expect(d.finish).toBe(finish); expect(d.artVariant).toBe(artVariant); expect(cards.find(c => c.id === d.cardId)?.rarity).toBe('legendary') }
    }
  })
  it('les 30 probabilités totalisent 1, y compris la combinaison extrême', () => {
    const matrix = Object.values(DEFAULT_RARITY_RATES).flatMap(r => Object.values(DEFAULT_FINISH_RATES).flatMap(f => Object.values(DEFAULT_ART_VARIANT_RATES).map(a => r * f * a / 1_000_000)))
    expect(matrix).toHaveLength(30); expect(matrix.reduce((a, b) => a + b)).toBeCloseTo(1, 12)
    expect(.02 * .04 * .08).toBeCloseTo(.000064, 12)
    expect(.02 * .04).toBeCloseTo(.0008, 12)
  })
  it('simulation déterministe : distributions et indépendance sur 100 000 cartes', () => {
    let seed = 42
    const rng = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 2 ** 32 }
    const counts = { legendary: 0, glossy: 0, alternative: 0, fullArt: 0, fullArtGlossy: 0 }
    for (let i = 0; i < 20_000; i++) for (const d of drawPack(boosters[0], cards, rng)) {
      if (cards.find(c => c.id === d.cardId)?.rarity === 'legendary') counts.legendary++
      if (d.finish === 'glossy') counts.glossy++
      if (d.finish === 'alternative') counts.alternative++
      if (d.artVariant === 'fullArt') { counts.fullArt++; if (d.finish === 'glossy') counts.fullArtGlossy++ }
    }
    for (const [key, expected] of Object.entries({ legendary: .02, glossy: .15, alternative: .04, fullArt: .08, fullArtGlossy: .012 })) expect(Math.abs(counts[key as keyof typeof counts] / 100_000 - expected)).toBeLessThan(.004)
  })
})
describe('recharge gratuite hors jeu', () => {
  const empty = { freePackStock: 0, nextFreePackAt: 15 * minute }
  it.each([[14, 0, 15], [15, 1, 30], [40, 2, 45], [75, 5, null], [4320, 5, null]])('%i minutes : stock %i, prochaine échéance %s', (elapsed, expected, next) => {
    expect(settleFreePackRecharge(empty, elapsed * minute)).toEqual({ freePackStock: expected, nextFreePackAt: next === null ? null : next * minute })
  })
  it('plafonne le stock partiel et ne garde aucune réserve après saturation', () => {
    expect(settleFreePackRecharge({ ...empty, freePackStock: 3 }, 3 * 86400_000)).toEqual({ freePackStock: 5, nextFreePackAt: null })
    expect(consumeFreePack({ freePackStock: 5, nextFreePackAt: null }, 3 * 86400_000)).toEqual({ freePackStock: 4, nextFreePackAt: 3 * 86400_000 + FREE_PACK_RECHARGE_MS })
  })
  it('consomme sans décaler une recharge en cours', () => { expect(consumeFreePack({ freePackStock: 2, nextFreePackAt: 3 * minute }, 0)).toEqual({ freePackStock: 1, nextFreePackAt: 3 * minute }) })
  it('refuse un stock vide, négatif ou incohérent', () => {
    expect(() => consumeFreePack(empty, 9 * minute)).toThrow()
    expect(() => settleFreePackRecharge({ freePackStock: -1, nextFreePackAt: 0 }, 0)).toThrow()
    expect(() => settleFreePackRecharge({ freePackStock: 2, nextFreePackAt: null }, 0)).toThrow()
  })
})
describe('économie', () => {
  const expected = [[1, 2, 3, 1, 4, 6], [3, 6, 9, 5, 13, 18], [7, 16, 22, 13, 30, 42], [12, 27, 38, 22, 52, 72], [19, 43, 60, 36, 83, 115]]
  const rarities = Object.keys(RECYCLE_BASE_FRAGMENTS) as Rarity[]
  const finishes = Object.keys(DEFAULT_FINISH_RATES) as Finish[]
  const variants = Object.keys(DEFAULT_ART_VARIANT_RATES) as ArtVariant[]
  it('vérifie les 30 valeurs avec un seul arrondi final', () => { rarities.forEach((r, i) => expect(variants.flatMap(a => finishes.map(f => getRecycleFragments(r, f, a)))).toEqual(expected[i])) })
  it('vérifie moyenne, valeur totale du catalogue et absence de boucle profitable', () => {
    let mean = 0
    for (const r of rarities) for (const f of finishes) for (const a of variants) mean += DEFAULT_RARITY_RATES[r] * DEFAULT_FINISH_RATES[f] * DEFAULT_ART_VARIANT_RATES[a] / 1_000_000 * getRecycleFragments(r, f, a)
    expect(mean).toBeCloseTo(4.149816, 8)
    expect(mean * 5).toBeCloseTo(20.74908, 8)
    expect(cards.reduce((sum, c) => sum + variants.flatMap(a => finishes.map(f => getRecycleFragments(c.rarity, f, a))).reduce((a, b) => a + b), 0)).toBe(21848)
    for (const booster of [...boosters, ...publishedBoosters]) {
      const offer = shopOffer(booster)
      if (!offer) continue
      const rates = resolveBoosterRates(booster)
      let boosterMean = 0
      for (const r of rarities) for (const f of finishes) for (const a of variants) boosterMean += rates.rarity[r] * rates.finish[f] * rates.illustration[a] / 1_000_000 * getRecycleFragments(r, f, a)
      expect(boosterMean * booster.cardsPerPack).toBeLessThan(offer.price)
    }
  })
  it('distingue bien les six clés de découverte par modèle', () => { expect(new Set(variants.flatMap(artVariant => finishes.map(finish => variantKey({ cardId: 'x', finish, artVariant })))).size).toBe(6) })
})
