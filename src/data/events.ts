import { cards } from './cards'
import type { BoosterDefinition } from '../game/types'
import { developmentOptionEnabled } from '../settings/development'
import type { Preferences } from '../settings/preferences'

// Activate each event here when its release is scheduled.
const EVENT_ACTIVE: Record<string, boolean> = {
  'hunger-games-2026': false,
  'new-year-2027': false,
}

export const eventCards = cards.filter(card => card.eventId)

export const eventBoosters: BoosterDefinition[] = [
  {
    id: 'hunger-games-2026', eventId: 'hunger-games-2026', title: 'Hunger Games',
    subtitle: '', description: '',
    artwork: { design: 'bloc' as const, emoji: '🏹', colors: { primary: '#975a29', secondary: '#251c17', shine: '#f5dba2', glow: '#c37b35' } },
    order: 6,
  },
  {
    id: 'new-year-2027', eventId: 'new-year-2027', title: 'Nouvel An',
    subtitle: '', description: '',
    artwork: { design: 'bloc' as const, emoji: '🎆', colors: { primary: '#4c3878', secondary: '#13152e', shine: '#f7dfac', glow: '#9d77cc' } },
    order: 7,
  },
].map(event => {
  const cardIds = eventCards.filter(card => card.eventId === event.eventId).map(card => card.id)
  return {
    ...event, subtitle: `${cardIds.length} cartes`,
    access: { type: 'shop', price: 30 }, cardsPerPack: 1,
    sources: [{ type: 'cards', cardIds }],
    rates: {
      // Keep Christmas's 10% legendary chance; these sets only have two rarities.
      rarity: { common: 90, uncommon: 0, rare: 0, epic: 0, legendary: 10 },
      finish: 'default',
      illustration: 'default',
    },
    enabled: true, showInFilters: false,
  }
})

export function isEventBoosterActive(id: string, preferences?: Preferences) {
  return Object.hasOwn(EVENT_ACTIVE, id) && (EVENT_ACTIVE[id] || developmentOptionEnabled('devEventAlwaysActive', preferences))
}

export function activeEventBoosters(preferences?: Preferences) {
  return eventBoosters.filter(booster => isEventBoosterActive(booster.id, preferences))
}
