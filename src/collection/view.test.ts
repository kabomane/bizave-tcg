import { describe, expect, it } from 'vitest'
import { archivedCards, cards } from '../data/cards'
import order from '../data/card-order.json'
import { variantKey } from '../game/engine'
import type { CardDropRow } from '../game/types'
import { DEFAULT_COLLECTION_DISPLAY, parseCollectionDisplay } from './preferences'
import { cardNumber, collectionView, ownedVariants } from './view'

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
  it('trie par nom français ou numéro, dans les deux sens', () => {
    const variants = ownedVariants([drop('thomas'), drop('matthieu', 1, { cardId: 'm-classique' })])
    for (const [sort, first] of [['name', 'm-classique'], ['number', 't-classique']] as const) {
      const ascending = collectionView(variants, { ...DEFAULT_COLLECTION_DISPLAY, sort, direction: 'asc' })
      const descending = collectionView(variants, { ...DEFAULT_COLLECTION_DISPLAY, sort, direction: 'desc' })
      expect(ascending[0].card.cardId).toBe(first)
      expect(descending.map(item => item.key)).toEqual(ascending.map(item => item.key).reverse())
    }
  })
  it('trie sur la dernière acquisition détenue, y compris un retour de transfert', () => {
    const variants = ownedVariants([drop('new-copy', 50), drop('other', 30, { finish: 'glossy' }), drop('old-copy', 1), drop('returned', 2, { cardId: 'm-classique', updatedAt: 70 }), drop('outgoing', 99, { status: 'outgoing' }), drop('recycled', 100, { status: 'recycled' })])
    const view = collectionView(variants, DEFAULT_COLLECTION_DISPLAY)
    expect(view.map(item => item.acquiredAt)).toEqual([70, 50, 30])
    expect(view[1].entries[0].ids).toEqual(['old-copy', 'new-copy'])
    expect(collectionView(variants, { ...DEFAULT_COLLECTION_DISPLAY, direction: 'asc' }).map(item => item.acquiredAt)).toEqual([30, 50, 70])
    expect(collectionView(variants, { ...DEFAULT_COLLECTION_DISPLAY, groupBy: 'card' })[1].acquiredAt).toBe(50)
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
    const saved = { sort: 'number', direction: 'asc', groupBy: 'format', duplicates: 'show' }
    expect(parseCollectionDisplay(JSON.parse(JSON.stringify(saved)))).toEqual(saved)
  })
  it('conserve chaque exemplaire exactement une fois pour toutes les combinaisons d’affichage', () => {
    const source = [...sixVariants, drop('duplicate'), drop('other-model', 40, { cardId: 'm-classique' })]
    const variants = ownedVariants(source)
    for (const groupBy of ['none', 'card', 'format'] as const) for (const duplicates of ['hide', 'show'] as const) for (const sort of ['name', 'number', 'obtained'] as const) for (const direction of ['asc', 'desc'] as const) {
      const view = collectionView(variants, { groupBy, duplicates, sort, direction })
      const ids = view.flatMap(item => item.entries.flatMap(entry => entry.ids))
      expect(ids.sort()).toEqual(source.map(drop => drop.dropId).sort())
      expect(new Set(view.map(item => item.key)).size).toBe(view.length)
      expect(new Set(view.flatMap(item => item.entries.map(entry => entry.key))).size).toBe(view.reduce((sum, item) => sum + item.entries.length, 0))
    }
  })
})
