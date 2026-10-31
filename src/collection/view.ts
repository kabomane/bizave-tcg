import { cardById } from '../data/cards'
import editionOrder from '../data/card-order.json'
import { getRecycleFragments, variantKey } from '../game/engine'
import type { Card, CardDropRow } from '../game/types'
import type { CollectionDisplay } from './preferences'

export type CollectionVariant = { card: Card; copies: { dropId: string; acquiredAt: number }[] }
export type CollectionEntry = { key: string; card: Card; ids: string[]; acquiredAt: number }
type CollectionItem = { key: string; card: Card; entries: CollectionEntry[]; variantCount: number; acquiredAt: number }
const order = new Map(editionOrder.map((id, index) => [id, index + 1]))
const collator = new Intl.Collator('fr', { sensitivity: 'base', numeric: true })
const finishOrder = { normal: 0, glossy: 1, alternative: 2 }
const rarityOrder = { common: 0, uncommon: 1, rare: 2, epic: 3, legendary: 4 }
function compareRarity(a: Card, b: Card) {
  return rarityOrder[cardById.get(a.cardId)!.rarity] - rarityOrder[cardById.get(b.cardId)!.rarity] ||
    Number(a.artVariant === 'fullArt') - Number(b.artVariant === 'fullArt') || finishOrder[a.finish] - finishOrder[b.finish]
}
export function cardNumber(cardId: string) { return order.get(cardId) ?? Number.MAX_SAFE_INTEGER }
export function cardFragmentValue(card: Card) {
  const definition = cardById.get(card.cardId)
  return definition ? getRecycleFragments(definition.rarity, card.finish, card.artVariant) : 0
}
function canonical(a: Card, b: Card) {
  return cardNumber(a.cardId) - cardNumber(b.cardId) || collator.compare(a.cardId, b.cardId) ||
    Number(a.artVariant === 'fullArt') - Number(b.artVariant === 'fullArt') || finishOrder[a.finish] - finishOrder[b.finish]
}

export function ownedVariants(drops: readonly CardDropRow[]): CollectionVariant[] {
  const variants = new Map<string, CollectionVariant>()
  for (const drop of drops) {
    if (drop.status !== 'owned') continue
    const key = variantKey(drop)
    let variant = variants.get(key)
    if (!variant) { variant = { card: { dropId: '', cardId: drop.cardId, finish: drop.finish, artVariant: drop.artVariant }, copies: [] }; variants.set(key, variant) }
    // A returned transfer retains its original acquiredAt; updatedAt records its new acquisition.
    variant.copies.push({ dropId: drop.dropId, acquiredAt: Math.max(drop.acquiredAt, drop.updatedAt) })
  }
  for (const variant of variants.values()) variant.copies.sort((a, b) => a.acquiredAt - b.acquiredAt || a.dropId.localeCompare(b.dropId))
  return [...variants.values()]
}

export function collectionView(variants: readonly CollectionVariant[], display: CollectionDisplay): CollectionItem[] {
  const direction = display.direction === 'asc' ? 1 : -1
  const compare = (a: { card: Card; acquiredAt: number; key: string }, b: { card: Card; acquiredAt: number; key: string }) => {
    const primary = display.sort === 'name' ? collator.compare(cardById.get(a.card.cardId)?.title || a.card.cardId, cardById.get(b.card.cardId)?.title || b.card.cardId)
      : display.sort === 'rarity' ? compareRarity(a.card, b.card)
      : display.sort === 'value' ? cardFragmentValue(a.card) - cardFragmentValue(b.card) : a.acquiredAt - b.acquiredAt
    return primary * direction || canonical(a.card, b.card) || a.key.localeCompare(b.key)
  }
  const items = new Map<string, CollectionItem>()
  for (const variant of variants) {
    const entries: CollectionEntry[] = display.duplicates === 'show' && variant.copies.length
      ? variant.copies.map(copy => ({ key: copy.dropId, card: { ...variant.card, dropId: copy.dropId }, ids: [copy.dropId], acquiredAt: copy.acquiredAt }))
      : [{ key: variantKey(variant.card), card: { ...variant.card, dropId: variant.copies.at(-1)?.dropId || '' }, ids: variant.copies.map(copy => copy.dropId), acquiredAt: variant.copies.at(-1)?.acquiredAt || 0 }]
    for (const entry of entries) {
      const key = display.groupBy === 'none' ? entry.key : display.groupBy === 'card' ? entry.card.cardId : `${entry.card.cardId}:${entry.card.artVariant}`
      const item = items.get(key)
      if (item) { item.entries.push(entry); item.acquiredAt = Math.max(item.acquiredAt, entry.acquiredAt); if (canonical(entry.card, item.card) < 0) item.card = entry.card }
      else items.set(key, { key, card: entry.card, entries: [entry], variantCount: 0, acquiredAt: entry.acquiredAt })
    }
  }
  for (const item of items.values()) {
    item.variantCount = new Set(item.entries.map(entry => variantKey(entry.card))).size
    item.entries.sort(compare)
    // The cover is independent from the list's sorting direction and criterion.
    item.card = item.entries.reduce((best, entry) => {
      const difference = display.pileCover === 'latest' ? entry.acquiredAt - best.acquiredAt
        : compareRarity(entry.card, best.card) * (display.pileCover === 'leastRare' ? -1 : 1)
      return difference > 0 || difference === 0 && (canonical(entry.card, best.card) < 0 || canonical(entry.card, best.card) === 0 && entry.key < best.key) ? entry : best
    }).card
  }
  // Keep piles ranked by their best variant even when a different cover is chosen.
  const sortEntry = (item: CollectionItem) => {
    if (display.sort !== 'value' && display.sort !== 'rarity') return item
    const best = item.entries.reduce((best, entry) => {
      const difference = display.sort === 'rarity' ? compareRarity(entry.card, best.card) : cardFragmentValue(entry.card) - cardFragmentValue(best.card)
      return difference > 0 || difference === 0 && canonical(entry.card, best.card) < 0 ? entry : best
    })
    return { ...item, card: best.card }
  }
  const ranked = [...items.values()].map(item => ({ item, sortEntry: sortEntry(item) }))
  return ranked.sort((a, b) => compare(a.sortEntry, b.sortEntry)).map(({ item }) => item)
}
