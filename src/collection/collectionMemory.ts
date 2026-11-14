import type { VerifiedCollection } from './collectionCrypto'
import { COLLECTION_LIMITS } from './snapshotCodec'

export const COLLECTION_MEMORY_PREFIX = 'bizave.collectionMemory.v1.'
export const COLLECTION_MEMORY_EVENT = 'bizave-collection-memory'
export const FUTURE_COLLECTION_SECONDS = 24 * 60 * 60
export type CollectionMemory = { version: 1; code: string; savedAt: number }
export type MemoryDecision = 'new' | 'identical' | 'newer' | 'older' | 'sameTime' | 'invalid'
const storageError = () => new Error('Collection consultable, mais impossible de la mémoriser sur cet appareil.')
function local(): Storage | undefined { try { return globalThis.localStorage } catch { throw storageError() } }
function emit() { if (typeof window !== 'undefined') window.dispatchEvent(new Event(COLLECTION_MEMORY_EVENT)) }
function keys(storage: Storage) {
  try { return Array.from({ length: storage.length }, (_, i) => storage.key(i)).filter((key): key is string => !!key?.startsWith(COLLECTION_MEMORY_PREFIX)) } catch { throw storageError() }
}
export function readCollectionMemory(senderId: string, storage = local()): CollectionMemory | null {
  if (!storage) return null
  let value: string | null
  try { value = storage.getItem(COLLECTION_MEMORY_PREFIX + senderId) } catch { throw storageError() }
  if (value === null) return null
  try {
    if (value.length > COLLECTION_LIMITS.text + 200) throw new Error()
    const data = JSON.parse(value) as CollectionMemory
    if (!data || Object.keys(data).sort().join(',') !== 'code,savedAt,version' || data.version !== 1 || typeof data.code !== 'string' || data.code.length > COLLECTION_LIMITS.text || !Number.isSafeInteger(data.savedAt) || data.savedAt < 0) throw new Error()
    return data
  } catch { throw new Error('La collection mémorisée est illisible. Vous pouvez l’oublier puis en recevoir une nouvelle.') }
}
export function hasCollectionMemory(storage = local()) { return !!storage && keys(storage).length > 0 }
export function forgetCollection(senderId: string, storage = local()) {
  if (!storage) return
  try { storage.removeItem(COLLECTION_MEMORY_PREFIX + senderId) } catch { throw new Error('Impossible d’effacer la collection mémorisée. Réessayez.') }
  emit()
}
export function purgeCollectionMemory(storage = local()) {
  if (!storage) return
  for (const key of keys(storage)) {
    try { storage.removeItem(key) } catch { emit(); throw new Error('Certaines collections mémorisées n’ont pas pu être effacées. Réessayez.') }
  }
  emit()
}
/** Call only with a verified snapshot after resolving replacement/future-date confirmation. */
export function saveCollectionMemory(snapshot: VerifiedCollection, storage = local()) {
  if (!storage) throw storageError()
  const key = COLLECTION_MEMORY_PREFIX + snapshot.senderId, value = JSON.stringify({ version: 1, code: snapshot.code, savedAt: Date.now() })
  const all = keys(storage)
  if (!all.includes(key) && all.length >= 50) throw storageError()
  let size = (key.length + value.length) * 2
  try {
    for (const other of all) if (other !== key) size += (other.length + (storage.getItem(other)?.length ?? 0)) * 2
    if (size > 1024 * 1024) throw storageError()
    storage.setItem(key, value)
  } catch { throw storageError() }
  emit()
}
