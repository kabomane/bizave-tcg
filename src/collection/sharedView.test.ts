import { expect, it } from 'vitest'
import { sharedCollectionView } from './sharedView'
import type { SharedVariant } from './collectionSnapshot'
import { collectionView, ownedVariants } from './view'
import { DEFAULT_COLLECTION_DISPLAY } from './preferences'

it('regroupe des quantités agrégées sans fabriquer d’exemplaires ni de dates', () => {
  const entries: SharedVariant[] = [
    { cardId: 't-classique', finish: 'normal', artVariant: 'standard', quantity: 1000000, favorite: true },
    { cardId: 't-classique', finish: 'alternative', artVariant: 'fullArt', quantity: 2, favorite: false },
  ]
  const result = sharedCollectionView(entries, { sort: 'rarity', direction: 'desc', groupBy: 'card' })
  expect(result).toHaveLength(1); expect(result[0].quantity).toBe(1000002); expect(result[0].entries).toHaveLength(2)
  expect(result[0].cover.finish).toBe('alternative')
  expect(JSON.stringify(result)).not.toMatch(/dropId|acquiredAt/)
  expect(sharedCollectionView(entries, { sort: 'value', direction: 'asc', groupBy: 'format' })).toHaveLength(2)
})

it('applique les règles locales de tri, couverture et égalités aux mêmes variantes', () => {
  const variants: SharedVariant[] = ['t-classique', 'm-classique', 'nana-diff'].flatMap(cardId => (['standard', 'fullArt'] as const).flatMap(artVariant => (['normal', 'glossy', 'alternative'] as const).map(finish => ({ cardId, artVariant, finish, quantity: 1, favorite: false }))))
  const local = ownedVariants(variants.map((variant, index) => ({ ...variant, dropId: `test-${index}`, status: 'owned' as const, acquiredAt: 1, updatedAt: 1 })))
  for (const sort of ['name', 'rarity', 'value'] as const) for (const direction of ['asc', 'desc'] as const) for (const groupBy of ['none', 'card', 'format'] as const) for (const pileCover of ['rarest', 'leastRare', 'latest'] as const) {
    const display = { ...DEFAULT_COLLECTION_DISPLAY, sort, direction, groupBy, pileCover }
    const own = collectionView(local, display), shared = sharedCollectionView(variants, display)
    expect(shared.map(item => item.key)).toEqual(own.map(item => item.key))
    const visual = ({ cardId, finish, artVariant }: SharedVariant | typeof own[number]['card']) => ({ cardId, finish, artVariant })
    expect(shared.map(item => visual(item.cover))).toEqual(own.map(item => visual(item.card)))
    expect(shared.map(item => item.entries.map(visual))).toEqual(own.map(item => item.entries.map(entry => visual(entry.card))))
  }
})
