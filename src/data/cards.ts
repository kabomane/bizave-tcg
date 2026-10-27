import catalogue from './catalogue.json'
import type { CardDefinition } from '../game/types'
export const cards = catalogue as CardDefinition[]
// Closed development: remove retired cards. Keep archives only after release to real players.
export const archivedCards: CardDefinition[] = []
export const cardById = new Map([...cards, ...archivedCards].map(card => [card.id, card]))
