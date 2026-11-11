import type { PlayerStateRow } from '../game/types'
import type { AccountStateRow } from './accountTypes'
import { db, type DatabaseVersionRow } from './database'

const LAST_BETA_SAVE_VERSION = 11

export function isBetaSave(player: PlayerStateRow | undefined, account: AccountStateRow | undefined, version: DatabaseVersionRow | undefined) {
  const schemaVersion = player?.schemaVersion ?? version?.schemaVersion ?? 0
  return (!!player || account?.status === 'exported') && schemaVersion <= LAST_BETA_SAVE_VERSION
}

export function readBetaSave(name = db.name): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name)
    let missing = false
    // Opening without a version reads the existing schema. Abort creation on first visit.
    request.onupgradeneeded = () => { missing = true; request.transaction!.abort() }
    request.onerror = () => { if (missing) resolve(false); else reject(request.error) }
    request.onsuccess = () => {
      const connection = request.result
      try {
        const tables = ['player', 'accountState', 'version'].filter(table => connection.objectStoreNames.contains(table))
        if (!tables.length) { resolve(false); return }
        const transaction = connection.transaction(tables, 'readonly')
        const player = tables.includes('player') ? transaction.objectStore('player').get('local') : undefined
        const account = tables.includes('accountState') ? transaction.objectStore('accountState').get('local') : undefined
        const version = tables.includes('version') ? transaction.objectStore('version').get('local') : undefined
        transaction.oncomplete = () => resolve(isBetaSave(player?.result, account?.result, version?.result))
        transaction.onabort = () => reject(transaction.error)
      } catch (error) { reject(error) }
      finally { connection.close() }
    }
  })
}
