import type { ArtVariant, CardDropRow, FavoriteRow, Finish } from '../game/types'
import { variantKey } from '../game/engine'
import { numericCardIds, registeredCard } from './registry'
import type { NumericVariant } from './snapshotCodec'

export type SharedVariant = { cardId: string; finish: Finish; artVariant: ArtVariant; quantity: number; favorite: boolean }
const finishes: Finish[] = ['normal', 'glossy', 'alternative']
export function aggregateCollection(drops: readonly CardDropRow[], favorites: readonly FavoriteRow[]): SharedVariant[] {
  const keys = new Set(favorites.map(row => row.key)), variants = new Map<string, SharedVariant>()
  for (const drop of drops) {
    if (drop.status !== 'owned') continue
    const key = variantKey(drop), existing = variants.get(key)
    if (existing) existing.quantity++
    else variants.set(key, { cardId: drop.cardId, finish: drop.finish, artVariant: drop.artVariant, quantity: 1, favorite: keys.has(key) })
  }
  return [...variants.values()]
}
export function toNumericVariants(variants: readonly SharedVariant[]): NumericVariant[] {
  return variants.map(entry => {
    const number = numericCardIds.get(entry.cardId)
    if (!number) throw new Error('Une carte manque au registre de partage. Mettez le jeu à jour.')
    return { number, variant: finishes.indexOf(entry.finish) + (entry.artVariant === 'fullArt' ? 3 : 0), quantity: entry.quantity, favorite: entry.favorite }
  }).sort((a, b) => a.number - b.number || a.variant - b.variant)
}
export function fromNumericVariants(variants: readonly NumericVariant[]): SharedVariant[] {
  return variants.map(entry => ({ cardId: registeredCard(entry.number), finish: finishes[entry.variant % 3], artVariant: entry.variant >= 3 ? 'fullArt' : 'standard', quantity: entry.quantity, favorite: entry.favorite }))
}
export function collectionCounts(variants: readonly SharedVariant[]) {
  return { models: new Set(variants.map(entry => entry.cardId)).size, variants: variants.length, quantity: variants.reduce((sum, entry) => sum + entry.quantity, 0) }
}
