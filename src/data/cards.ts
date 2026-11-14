import catalogue from './catalogue.json'
import type { CardDefinition } from '../game/types'
export const cards = catalogue as CardDefinition[]
// Published registry IDs are permanent. Keep definitions of retired cards here so shared snapshots remain readable.
export const archivedCards: CardDefinition[] = []
export const cardById = new Map([...cards, ...archivedCards].map(card => [card.id, card]))
