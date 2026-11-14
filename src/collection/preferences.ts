export type CollectionDisplay = {
  sort: 'name' | 'rarity' | 'obtained' | 'value'
  direction: 'asc' | 'desc'
  groupBy: 'none' | 'card' | 'format'
  duplicates: 'hide' | 'show'
  pileCover: 'latest' | 'rarest' | 'leastRare'
}
export const DEFAULT_COLLECTION_DISPLAY: CollectionDisplay = Object.freeze({ sort: 'obtained', direction: 'desc', groupBy: 'none', duplicates: 'hide', pileCover: 'rarest' })
export function parseCollectionDisplay(value: unknown): CollectionDisplay {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return {
    sort: data.sort === 'number' ? 'rarity' : data.sort === 'name' || data.sort === 'rarity' || data.sort === 'value' ? data.sort : 'obtained',
    direction: data.direction === 'asc' ? 'asc' : 'desc',
    groupBy: data.groupBy === 'card' || data.groupBy === 'format' ? data.groupBy : 'none',
    duplicates: data.duplicates === 'show' ? 'show' : 'hide',
    pileCover: data.pileCover === 'latest' || data.pileCover === 'leastRare' ? data.pileCover : 'rarest',
  }
}

export function parseSharedCollectionDisplay(value: unknown): CollectionDisplay {
  const parsed = parseCollectionDisplay(value)
  return { ...parsed, sort: parsed.sort === 'obtained' ? 'name' : parsed.sort, direction: value && typeof value === 'object' && (value as Record<string, unknown>).direction === 'desc' ? 'desc' : 'asc', duplicates: 'hide', pileCover: parsed.pileCover === 'latest' ? 'rarest' : parsed.pileCover }
}
