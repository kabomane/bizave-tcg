import { UPDATE_VERSION } from '../data/update'

export const UPDATED_KEY = 'updated'
type UpdateStorage = Pick<Storage, 'getItem' | 'setItem'>

/** Called once at startup, before database initialization creates a new player. */
export function needsUpdateNotice(existingPlayer: boolean, storage: UpdateStorage = localStorage) {
  try {
    const value = storage.getItem(UPDATED_KEY)
    if (value === null && !existingPlayer) {
      storage.setItem(UPDATED_KEY, String(UPDATE_VERSION))
      return false
    }
    const parsed = value !== null && /^\d+$/.test(value) ? Number(value) : 0
    const updated = Number.isSafeInteger(parsed) ? parsed : 0
    return updated < UPDATE_VERSION
  } catch { return false } // An unavailable preference store must not block access to the game.
}

export function acknowledgeUpdate(storage: UpdateStorage = localStorage) {
  storage.setItem(UPDATED_KEY, String(UPDATE_VERSION))
}

export function resetUpdateNotice(storage: UpdateStorage = localStorage) {
  storage.setItem(UPDATED_KEY, '0')
}
