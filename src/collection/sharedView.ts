import { variantKey } from '../game/engine'
import type { SharedVariant } from './collectionSnapshot'
import type { CollectionDisplay } from './preferences'
import { collectionLayout } from './view'
export { cardFragmentValue as sharedValue, compareRarity as compareSharedRarity } from './view'

export type SharedDisplay = Pick<CollectionDisplay, 'sort' | 'direction' | 'groupBy'> & Partial<Pick<CollectionDisplay, 'pileCover'>>
export function sharedCollectionView(variants: readonly SharedVariant[], display: SharedDisplay) {
  // Keep aggregate quantities; no artificial copies, IDs or acquisition timestamps.
  return collectionLayout(variants.map(card => ({ key: variantKey(card), card })), { ...display, pileCover: display.pileCover ?? 'rarest' }).map(item => ({
    key: item.key, cover: item.card, entries: item.entries.map(entry => entry.card), variantCount: item.variantCount,
    quantity: item.entries.reduce((sum, entry) => sum + entry.card.quantity, 0),
  }))
}
