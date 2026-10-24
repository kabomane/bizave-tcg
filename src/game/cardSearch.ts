import type { CardDefinition } from './types'

const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('fr')

export function matchesCardSearch(card: Pick<CardDefinition, 'title' | 'description'>, query: string) {
  const text = normalize(`${card.title} ${card.description}`)
  return normalize(query).trim().split(/\s+/).filter(Boolean).every(term => text.includes(term))
}
