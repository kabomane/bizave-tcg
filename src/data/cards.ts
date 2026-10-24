import catalogue from './catalogue.json'
import type { CardDefinition } from '../game/types'
export const cards = catalogue as CardDefinition[]
// Keep retired definitions here permanently so existing drops remain interpretable.
export const archivedCards: CardDefinition[] = []
export const cardById = new Map([...cards, ...archivedCards].map(card => [card.id, card]))
export const collections = [
  { id: 'thomas', title: 'Groupe Thomas' },
  { id: 'matthieu', title: 'Groupe Matthieu' },
  { id: 'speciaux', title: 'Spéciaux' },
]
