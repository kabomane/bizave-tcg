export type CollectionDisplay = {
  sort: 'name' | 'number' | 'obtained'
  direction: 'asc' | 'desc'
  groupBy: 'none' | 'card' | 'format'
  duplicates: 'hide' | 'show'
}
export const DEFAULT_COLLECTION_DISPLAY: CollectionDisplay = Object.freeze({ sort: 'obtained', direction: 'desc', groupBy: 'none', duplicates: 'hide' })
export function parseCollectionDisplay(value: unknown): CollectionDisplay {
  const data = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return {
    sort: data.sort === 'name' || data.sort === 'number' ? data.sort : 'obtained',
    direction: data.direction === 'asc' ? 'asc' : 'desc',
    groupBy: data.groupBy === 'card' || data.groupBy === 'format' ? data.groupBy : 'none',
    duplicates: data.duplicates === 'show' ? 'show' : 'hide',
  }
}
