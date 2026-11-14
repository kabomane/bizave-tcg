import { expect, it } from 'vitest'
import { createContactCode, generateIdentity, parseContactCode } from '../exchanges/crypto'
import { signCollection, verifyCollection, memoryDecision } from './collectionCrypto'
import { COLLECTION_MEMORY_PREFIX, forgetCollection, hasCollectionMemory, purgeCollectionMemory, readCollectionMemory, saveCollectionMemory } from './collectionMemory'
import { DEFAULT_PREFERENCES, parsePreferences } from '../settings/preferences'

class MemoryStorage implements Storage {
  values = new Map<string, string>(); writes = 0
  get length() { return this.values.size }
  clear() { this.values.clear() }
  key(index: number) { return [...this.values.keys()][index] ?? null }
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value); this.writes++ }
  removeItem(key: string) { this.values.delete(key) }
}
it('désactive par défaut et reste compatible avec les anciennes préférences', () => {
  expect(DEFAULT_PREFERENCES.rememberCollections).toBe(false)
  expect(parsePreferences('{"theme":"dark"}').rememberCollections).toBe(false)
  expect(parsePreferences('{"rememberCollections":true}').rememberCollections).toBe(true)
  expect(parsePreferences('{"rememberCollections":"true"}').rememberCollections).toBe(false)
})
it('compare des instantanés revérifiés et ne réécrit pas un code identique', async () => {
  const storage = new MemoryStorage(), identity = await generateIdentity(), friend = await parseContactCode(createContactCode(identity))
  const snapshot = await verifyCollection(await signCollection(identity, [], 100), [friend])
  expect(await memoryDecision(snapshot, [friend], storage)).toBe('new')
  saveCollectionMemory(snapshot, storage)
  const writes = storage.writes
  expect(readCollectionMemory(identity.playerUuid, storage)?.code).toBe(snapshot.code)
  expect(await memoryDecision(snapshot, [friend], storage)).toBe('identical')
  expect(storage.writes).toBe(writes)
  const sameContent = await verifyCollection(await signCollection(identity, [], 100), [friend])
  expect(await memoryDecision(sameContent, [friend], storage)).toBe('identical')
  for (const [issuedAt, expected] of [[99, 'older'], [101, 'newer'], [100, 'sameTime']] as const) {
    const variants = issuedAt === 100 ? [{ cardId: 't-classique', finish: 'normal' as const, artVariant: 'standard' as const, quantity: 1, favorite: false }] : []
    const other = await verifyCollection(await signCollection(identity, variants, issuedAt), [friend])
    expect(await memoryDecision(other, [friend], storage)).toBe(expected)
  }
  const key = COLLECTION_MEMORY_PREFIX + identity.playerUuid
  storage.setItem(key, JSON.stringify({ version: 1, code: snapshot.code.slice(0, -4) + 'AAAA', savedAt: 1 }))
  expect(await memoryDecision(snapshot, [friend], storage)).toBe('invalid')
  storage.setItem(key, '{')
  expect(() => readCollectionMemory(identity.playerUuid, storage)).toThrow('illisible')
})
it('limite à 50 amis et 1 Mio sans effacer une autre collection', () => {
  const storage = new MemoryStorage(), snapshot = { code: 'CL1.AAAA', senderId: '1234-56-78', issuedAt: 1, variants: [] }
  for (let i = 0; i < 50; i++) storage.setItem(COLLECTION_MEMORY_PREFIX + i, 'x')
  expect(() => saveCollectionMemory(snapshot, storage)).toThrow('impossible')
  expect(storage.length).toBe(50)
  storage.clear(); storage.setItem(COLLECTION_MEMORY_PREFIX + 'other', 'x'.repeat(524288))
  expect(() => saveCollectionMemory(snapshot, storage)).toThrow('impossible')
  expect(storage.getItem(COLLECTION_MEMORY_PREFIX + 'other')).not.toBeNull()
  storage.clear(); storage.setItem('other-setting', 'keep'); saveCollectionMemory(snapshot, storage)
  expect(hasCollectionMemory(storage)).toBe(true)
  forgetCollection(snapshot.senderId, storage); expect(readCollectionMemory(snapshot.senderId, storage)).toBeNull()
  saveCollectionMemory(snapshot, storage); purgeCollectionMemory(storage)
  expect(hasCollectionMemory(storage)).toBe(false); expect(storage.getItem('other-setting')).toBe('keep')
})
it('signale les échecs de lecture, écriture et effacement', () => {
  const storage = new MemoryStorage(), snapshot = { code: 'CL1.AAAA', senderId: '1234-56-78', issuedAt: 1, variants: [] }
  storage.setItem = () => { throw new Error('quota') }
  expect(() => saveCollectionMemory(snapshot, storage)).toThrow('impossible')
  storage.getItem = () => { throw new Error('blocked') }
  expect(() => readCollectionMemory(snapshot.senderId, storage)).toThrow('impossible')
  storage.removeItem = () => { throw new Error('blocked') }
  expect(() => forgetCollection(snapshot.senderId, storage)).toThrow('Impossible')
})
