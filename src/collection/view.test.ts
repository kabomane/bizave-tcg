import { describe, expect, it } from 'vitest'
import { archivedCards, cards } from '../data/cards'
import order from '../data/card-order.json'
import { variantKey } from '../game/engine'
import type { CardDropRow } from '../game/types'
import { DEFAULT_COLLECTION_DISPLAY, parseCollectionDisplay } from './preferences'
import { cardFragmentValue, cardNumber, collectionView, ownedVariants } from './view'

function drop(id: string, time = 1, patch: Partial<CardDropRow> = {}): CardDropRow {
  return { dropId: id, cardId: 't-classique', finish: 'normal', artVariant: 'standard', acquiredAt: time, updatedAt: time, status: 'owned', ...patch }
}
const sixVariants = (['standard', 'fullArt'] as const).flatMap(artVariant => (['normal', 'glossy', 'alternative'] as const).map((finish, index) => drop(`${artVariant}-${finish}`, index + 1, { artVariant, finish })))

describe('affichage de la collection', () => {
  it('conserve un ordre fixe couvrant chaque carte une seule fois', () => {
    expect(new Set(order).size).toBe(cards.length + archivedCards.length)
    expect([...order].sort()).toEqual([...cards, ...archivedCards].map(card => card.id).sort())
    expect(cardNumber('t-classique')).toBe(1)
    expect(cardNumber('m-classique')).toBeGreaterThan(cardNumber('t-classique'))
  })
  it('trie par nom français dans les deux sens', () => {
    const variants = ownedVariants([drop('thomas'), drop('matthieu', 1, { cardId: 'm-classique' })])
    for (const [sort, first] of [['name', 'm-classique']] as const) {
      const ascending = collectionView(variants, { ...DEFAULT_COLLECTION_DISPLAY, sort, direction: 'asc' })
      const descending = collectionView(variants, { ...DEFAULT_COLLECTION_DISPLAY, sort, direction: 'desc' })
      expect(ascending[0].card.cardId).toBe(first)
      expect(descending.map(item => item.key)).toEqual(ascending.map(item => item.key).reverse())
    }
  })
  it('classe par rareté, puis format et finition, indépendamment des fragments', () => {
    const variants = ownedVariants([
      ...sixVariants,
      drop('uncommon', 1, { cardId: 't-voyageur' }),
      drop('rare', 1, { cardId: 't-etudiant' }),
      drop('epic-full-art', 1, { cardId: 'nana-diff', artVariant: 'fullArt', finish: 'alternative' }),
      drop('legendary', 1, { cardId: 't-risitas' }),
      drop('legendary-full-art', 1, { cardId: 't-risitas', artVariant: 'fullArt', finish: 'alternative' }),
    ])
    const ascending = collectionView(variants, { ...DEFAULT_COLLECTION_DISPLAY, sort: 'rarity', direction: 'asc' })
    expect(ascending.map(item => item.card.dropId)).toEqual([
      'standard-normal', 'standard-glossy', 'standard-alternative', 'fullArt-normal', 'fullArt-glossy', 'fullArt-alternative',
      'uncommon', 'rare', 'epic-full-art', 'legendary', 'legendary-full-art',
    ])
    expect(cardFragmentValue(ascending[2].card)).toBeGreaterThan(cardFragmentValue(ascending[3].card))
    expect(cardFragmentValue(ascending[8].card)).toBeGreaterThan(cardFragmentValue(ascending[9].card))
    const descending = collectionView(variants, { ...DEFAULT_COLLECTION_DISPLAY, sort: 'rarity', direction: 'desc' })
    expect(descending.map(item => item.key)).toEqual(ascending.map(item => item.key).reverse())
    for (const groupBy of ['card', 'format'] as const) for (const duplicates of ['show', 'hide'] as const) {
      const piles = collectionView(variants, { ...DEFAULT_COLLECTION_DISPLAY, sort: 'rarity', groupBy, duplicates })
      expect(piles[0].card).toMatchObject({ cardId: 't-risitas', artVariant: 'fullArt', finish: 'alternative' })
      const common = piles.find(item => item.card.cardId === 't-classique')!
      expect(common.card).toMatchObject({ artVariant: 'fullArt', finish: 'alternative' })
    }
    const filtered = collectionView(variants.filter(v => v.card.finish === 'glossy'), { ...DEFAULT_COLLECTION_DISPLAY, sort: 'rarity', groupBy: 'card' })
    expect(filtered[0].card).toMatchObject({ artVariant: 'fullArt', finish: 'glossy' })
  })
  it('trie sur la dernière acquisition détenue, y compris un retour de transfert', () => {
    const variants = ownedVariants([drop('new-copy', 50), drop('other', 30, { finish: 'glossy' }), drop('old-copy', 1), drop('returned', 2, { cardId: 'm-classique', updatedAt: 70 }), drop('outgoing', 99, { status: 'outgoing' }), drop('recycled', 100, { status: 'recycled' })])
    const view = collectionView(variants, DEFAULT_COLLECTION_DISPLAY)
    expect(view.map(item => item.acquiredAt)).toEqual([70, 50, 30])
    expect(view[1].entries[0].ids).toEqual(['old-copy', 'new-copy'])
    expect(collectionView(variants, { ...DEFAULT_COLLECTION_DISPLAY, direction: 'asc' }).map(item => item.acquiredAt)).toEqual([30, 50, 70])
    expect(collectionView(variants, { ...DEFAULT_COLLECTION_DISPLAY, groupBy: 'card' })[1].acquiredAt).toBe(50)
  })
  it('classe la valeur réelle des finitions et formats dans les deux sens', () => {
    const variants = ownedVariants([...sixVariants, drop('rare', 1, { cardId: 't-etudiant' })])
    const values = (direction: 'asc' | 'desc') => collectionView(variants, { ...DEFAULT_COLLECTION_DISPLAY, sort: 'value', direction }).map(item => cardFragmentValue(item.card))
    expect(values('asc')).toEqual([1, 1, 2, 3, 4, 6, 7])
    expect(values('desc')).toEqual([7, 6, 4, 3, 2, 1, 1])
  })
  it('classe les piles sur leur meilleure variante visible sans additionner les doublons', () => {
    const variants = ownedVariants([...sixVariants, ...Array.from({ length: 10 }, (_, i) => drop(`copy-${i}`)), drop('rare', 1, { cardId: 't-etudiant' })])
    for (const duplicates of ['hide', 'show'] as const) for (const direction of ['asc', 'desc'] as const) {
      const view = collectionView(variants, { ...DEFAULT_COLLECTION_DISPLAY, sort: 'value', groupBy: 'card', duplicates, direction })
      expect(view.map(item => cardFragmentValue(item.card))).toEqual(direction === 'asc' ? [6, 7] : [7, 6])
      const common = view.find(item => item.card.cardId === 't-classique')!
      expect(common.card).toMatchObject({ finish: 'alternative', artVariant: 'fullArt' })
      expect(common.entries.map(entry => cardFragmentValue(entry.card))).toEqual([...common.entries.map(entry => cardFragmentValue(entry.card))].sort((a, b) => direction === 'asc' ? a - b : b - a))
    }
    const filtered = collectionView(variants.filter(variant => variant.card.artVariant === 'standard'), { ...DEFAULT_COLLECTION_DISPLAY, sort: 'value', groupBy: 'card' })
    expect(filtered.find(item => item.card.cardId === 't-classique')!.card).toMatchObject({ finish: 'alternative', artVariant: 'standard' })
  })
  it('regroupe les six variantes, ou sépare les deux formats, sans perdre les doublons', () => {
    const variants = ownedVariants([...sixVariants, drop('extra-copy', 50)])
    const hidden = collectionView(variants, { ...DEFAULT_COLLECTION_DISPLAY, groupBy: 'card' })
    expect(hidden).toHaveLength(1)
    expect(hidden[0].variantCount).toBe(6)
    expect(hidden[0].entries).toHaveLength(6)
    expect(hidden[0].entries.reduce((sum, entry) => sum + entry.ids.length, 0)).toBe(7)
    const shown = collectionView(variants, { ...DEFAULT_COLLECTION_DISPLAY, groupBy: 'card', duplicates: 'show' })
    expect(shown[0].entries).toHaveLength(7)
    expect(shown[0].entries.every(entry => entry.ids.length === 1 && entry.ids[0] === entry.card.dropId)).toBe(true)
    const formats = collectionView(variants, { ...DEFAULT_COLLECTION_DISPLAY, groupBy: 'format' })
    expect(formats).toHaveLength(2)
    expect(formats.every(item => item.variantCount === 3 && new Set(item.entries.map(entry => entry.card.artVariant)).size === 1)).toBe(true)
    expect(collectionView(variants, { ...DEFAULT_COLLECTION_DISPLAY, duplicates: 'show' })).toHaveLength(7)
  })
  it('construit les piles à partir des variantes filtrées et garde une couverture déterministe', () => {
    const variants = ownedVariants(sixVariants).filter(variant => variant.card.finish === 'glossy')
    const first = collectionView(variants, { ...DEFAULT_COLLECTION_DISPLAY, groupBy: 'card' })[0]
    const reversed = collectionView([...variants].reverse(), { ...DEFAULT_COLLECTION_DISPLAY, groupBy: 'card', direction: 'asc' })[0]
    expect(first.entries).toHaveLength(2)
    expect(first.entries.every(entry => entry.card.finish === 'glossy')).toBe(true)
    expect(variantKey(first.card)).toBe(variantKey(reversed.card))
    expect(first.card.artVariant).toBe('standard')
  })
  it('ne modifie ni les exemplaires sources ni les aperçus sans possession', () => {
    const drops = [...sixVariants, drop('duplicate')]
    const before = JSON.stringify(drops)
    const variants = ownedVariants(drops), variantsBefore = JSON.stringify(variants)
    collectionView(variants, { sort: 'name', direction: 'asc', groupBy: 'format', duplicates: 'show' })
    expect(JSON.stringify(drops)).toBe(before)
    expect(JSON.stringify(variants)).toBe(variantsBefore)
    const preview = collectionView([{ card: { ...sixVariants[0], dropId: '' }, copies: [] }], { ...DEFAULT_COLLECTION_DISPLAY, duplicates: 'show' })
    expect(preview[0].entries[0].ids).toEqual([])
    expect(preview[0].card.dropId).toBe('')
  })
  it('répare des réglages inconnus et restaure les choix valides', () => {
    expect(parseCollectionDisplay({ sort: 'unknown', direction: 1, groupBy: 'title', duplicates: true })).toEqual(DEFAULT_COLLECTION_DISPLAY)
    const saved = { sort: 'rarity', direction: 'asc', groupBy: 'format', duplicates: 'show' }
    expect(parseCollectionDisplay(JSON.parse(JSON.stringify(saved)))).toEqual(saved)
    expect(parseCollectionDisplay({ ...saved, sort: 'value' })).toEqual({ ...saved, sort: 'value' })
    expect(parseCollectionDisplay({ ...saved, sort: 'number' })).toEqual(saved)
  })
  it('conserve chaque exemplaire exactement une fois pour toutes les combinaisons d’affichage', () => {
    const source = [...sixVariants, drop('duplicate'), drop('other-model', 40, { cardId: 'm-classique' })]
    const variants = ownedVariants(source)
    for (const groupBy of ['none', 'card', 'format'] as const) for (const duplicates of ['hide', 'show'] as const) for (const sort of ['name', 'rarity', 'obtained', 'value'] as const) for (const direction of ['asc', 'desc'] as const) {
      const view = collectionView(variants, { groupBy, duplicates, sort, direction })
      const ids = view.flatMap(item => item.entries.flatMap(entry => entry.ids))
      expect(ids.sort()).toEqual(source.map(drop => drop.dropId).sort())
      expect(new Set(view.map(item => item.key)).size).toBe(view.length)
      expect(new Set(view.flatMap(item => item.entries.map(entry => entry.key))).size).toBe(view.reduce((sum, item) => sum + item.entries.length, 0))
    }
  })
})
