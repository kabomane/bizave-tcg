import { boosters } from './data/boosters'
import type { BoosterDefinition } from './game/types'

// Exercise configurable and overlapping pools independently from the published boosters.
export const fixtureBoosters: BoosterDefinition[] = [
  { ...boosters[0], id: 'eclats', title: 'Éclats', access: { type: 'free' }, sources: [{ type: 'collection', collectionId: 'thomas' }, { type: 'collection', collectionId: 'matthieu' }] },
  { ...boosters[0], id: 'nocturne', title: 'Nocturne', access: { type: 'shop', price: 60 }, sources: [{ type: 'collection', collectionId: 'speciaux' }] },
  { ...boosters[0], id: 'floraison', title: 'Floraison', access: { type: 'shop', price: 60 }, sources: [{ type: 'collection', collectionId: 'speciaux' }, { type: 'collection', collectionId: 'thomas', multiplier: .5 }, { type: 'collection', collectionId: 'matthieu', multiplier: .5 }] },
]
