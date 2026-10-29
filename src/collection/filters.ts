import { collectionBoosters } from './boosters'
import { boosters } from '../data/boosters'
import { cardById, cards } from '../data/cards'
import type { ArtVariant, Card, Finish, Rarity } from '../game/types'

export type CardFilterValue = { boosters: string[]; rarities: Rarity[]; finishes: Finish[]; illustrations: ArtVariant[] }
export const EMPTY_CARD_FILTERS: CardFilterValue = { boosters: [], rarities: [], finishes: [], illustrations: [] }
export const cardFilterOptions = collectionBoosters(boosters, cards)

export function matchesCardFilters(card: Card, filters: CardFilterValue) {
  const definition = cardById.get(card.cardId)
  return !!definition && (!filters.boosters.length || cardFilterOptions.some(option => filters.boosters.includes(option.id) && option.cardIds.has(card.cardId))) &&
    (!filters.rarities.length || filters.rarities.includes(definition.rarity)) &&
    (!filters.finishes.length || filters.finishes.includes(card.finish)) &&
    (!filters.illustrations.length || filters.illustrations.includes(card.artVariant))
}

