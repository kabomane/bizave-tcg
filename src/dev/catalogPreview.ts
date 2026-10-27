import { cards } from '../data/cards'
import type { Card } from '../game/types'

// Temporary preview feature. Set VITE_DEV_CATALOG=false for the release build;
// both its setting and its collection projection disappear. No storage dependency.
export const DEV_CATALOG_ENABLED = import.meta.env.VITE_DEV_CATALOG !== 'false'
type CollectionGroup = { card: Card; ids: string[]; firstDiscoveredAt: number }
export function createCatalogPreview(): CollectionGroup[] {
  return cards.flatMap(definition => (['normal', 'glossy', 'alternative'] as const).flatMap(finish =>
    (['standard', 'fullArt'] as const).map(artVariant => ({
      card: { dropId: '', cardId: definition.id, finish, artVariant },
      ids: [], firstDiscoveredAt: 0,
    })),
  ))
}
