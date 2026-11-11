import catalogue from './christmas-cards.json'
import type { BoosterDefinition, CardDefinition } from '../game/types'
import { developmentOptionEnabled } from '../settings/development'
import type { Preferences } from '../settings/preferences'

const CHRISTMAS_EVENT_ACTIVE = false
export function isChristmasEventActive(preferences?: Preferences) {
  return CHRISTMAS_EVENT_ACTIVE || developmentOptionEnabled('devEventAlwaysActive', preferences)
}

export const christmasCards = catalogue as CardDefinition[]
export const christmasCardById = new Map(christmasCards.map(card => [card.id, card]))

export const christmasBooster = {
  id: 'christmas-gift',
  title: 'merry xmas',
  subtitle: `${christmasCards.length} cartes`,
  description: '',
  artwork: { design: 'bloc', emoji: '🎁', colors: { primary: '#a4373e', secondary: '#102f26', shine: '#f5dba2', glow: '#407c57' } },
  access: { type: 'shop', price: 30 },
  cardsPerPack: 1,
  sources: [{ type: 'cards', cardIds: christmasCards.map(card => card.id) }],
  rates: {
    rarity: { common: 33, uncommon: 24, rare: 19, epic: 14, legendary: 10 },
    finish: { normal: 100, glossy: 0, alternative: 0 },
    illustration: { standard: 100, fullArt: 0 },
  },
  enabled: true,
  order: 4,
  showInFilters: false,
} satisfies BoosterDefinition
