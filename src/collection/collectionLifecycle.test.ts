import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { BizaveDatabase } from '../storage/database'
import { initializeDatabase } from '../storage/services'
import { deleteAccount, exportSave, importSave } from '../storage/saveTransfer'
import { ensureInstallation } from '../storage/installation'
import { addContact, ensureIdentity, ownContact, removeFriend } from '../exchanges/services'
import { uuid } from '../game/engine'
import { DEFAULT_PREFERENCES } from '../settings/preferences'
import { COLLECTION_MEMORY_PREFIX } from './collectionMemory'

let source: BizaveDatabase, target: BizaveDatabase
beforeEach(async () => {
  const values = new Map<string, string>()
  vi.stubGlobal('localStorage', { get length() { return values.size }, key: (i: number) => [...values.keys()][i] ?? null, getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => values.set(key, value), removeItem: (key: string) => values.delete(key) })
  source = new BizaveDatabase('collection-lifecycle-' + uuid()); target = new BizaveDatabase('collection-target-' + uuid())
  await Promise.all([initializeDatabase(source), initializeDatabase(target)])
  await Promise.all([ensureIdentity(source), ensureIdentity(target)])
  localStorage.setItem('unrelated-key', 'keep')
})
afterEach(async () => { vi.unstubAllGlobals(); await Promise.all([source.delete(), target.delete()]) })
function seedMemory(id = '1234-56-78') { localStorage.setItem(COLLECTION_MEMORY_PREFIX + id, 'signed-code-test') }
function expectPurged() { expect(localStorage.length).toBe(1); expect(localStorage.getItem('unrelated-key')).toBe('keep') }
it('retirer un contact ne supprime que sa propre mémoire', async () => {
  const friend = await addContact(await ownContact(target), 'Ami', source)
  seedMemory(friend.playerUuid); seedMemory('other')
  await removeFriend(friend.playerUuid, source)
  expect(localStorage.getItem(COLLECTION_MEMORY_PREFIX + friend.playerUuid)).toBeNull()
  expect(localStorage.getItem(COLLECTION_MEMORY_PREFIX + 'other')).toBe('signed-code-test')
})
it('supprimer le compte purge les mémoires locales', async () => {
  seedMemory(); await deleteAccount(source); expectPurged()
})
it('exporter puis remplacer une partie purge les mémoires sans les inclure dans le fichier', async () => {
  seedMemory()
  const contents = await exportSave((await ensureInstallation(target)).installationId, DEFAULT_PREFERENCES, source)
  expectPurged(); expect(contents).not.toContain('signed-code-test')
  seedMemory(); await importSave(contents, target); expectPurged()
})
