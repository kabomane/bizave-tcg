import { expect, it } from 'vitest'
import { cards } from '../data/cards'
import { cardFilterOptions, EMPTY_CARD_FILTERS, matchesCardFilters } from './filters'

it('sépare les événements permanents des cartes promotionnelles dans Boosters', () => {
  expect(cardFilterOptions.find(option => option.id === 'event')?.title).toBe('Événement')
  expect(cardFilterOptions.find(option => option.id === 'promotional')?.title).toBe('Promotionnel')
  for (const definition of cards) {
    const card = { cardId: definition.id, finish: 'normal' as const, artVariant: 'standard' as const }
    expect(matchesCardFilters(card, { ...EMPTY_CARD_FILTERS, boosters: ['event'] })).toBe(!!definition.eventId && !definition.promoNumber)
    expect(matchesCardFilters(card, { ...EMPTY_CARD_FILTERS, boosters: ['promotional'] })).toBe(!!definition.promoNumber)
  }
  for (const id of ['hunger-games-2026', 'new-year-2027']) {
    const eventCards = cards.filter(card => card.eventId === id)
    expect(eventCards.length).toBeGreaterThan(0)
    expect(eventCards.every(card => cardFilterOptions.find(option => option.id === 'event')!.cardIds.has(card.id))).toBe(true)
  }
})

it('combine Événement et Promotionnel et conserve les autres axes de filtrage', () => {
  const definition = cards.find(card => card.eventId && !card.promoNumber)!
  const card = { cardId: definition.id, finish: 'normal' as const, artVariant: 'standard' as const }
  expect(matchesCardFilters(card, { ...EMPTY_CARD_FILTERS, boosters: ['event', 'promotional'] })).toBe(true)
  expect(matchesCardFilters(card, { ...EMPTY_CARD_FILTERS, boosters: ['event'], finishes: ['glossy'] })).toBe(false)
  const promo = cards.find(card => card.promoNumber)!
  expect(matchesCardFilters({ ...card, cardId: promo.id }, { ...EMPTY_CARD_FILTERS, boosters: ['event', 'promotional'] })).toBe(true)
})
