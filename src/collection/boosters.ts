import { resolveBoosterPool } from '../game/engine'
import type { BoosterDefinition, CardDefinition } from '../game/types'

export type CollectionBooster = { id: string; title: string; cardIds: Set<string> }

export function collectionBoosters(boosters: BoosterDefinition[], cards: CardDefinition[]): CollectionBooster[] {
  return boosters.filter(booster => booster.enabled).sort((a, b) => a.order - b.order).map(booster => ({
    id: booster.id, title: booster.title,
    cardIds: new Set(resolveBoosterPool(booster, cards).map(entry => entry.card.id)),
  }))
}

/** Membership in any selected pool; acquisition history does not affect this filter. */
export function selectedBoosterCardIds(boosters: CollectionBooster[], selected: string[]): Set<string> | null {
  if (!selected.length) return null
  return new Set(boosters.filter(booster => selected.includes(booster.id)).flatMap(booster => [...booster.cardIds]))
}
