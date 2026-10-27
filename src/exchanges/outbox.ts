import { db } from '../storage/database'

export const OUTBOX_RETENTION_MS = 24 * 60 * 60 * 1000
/** Removes local copies only. Signed transfers and ownership records remain intact. */
export async function pruneOutbox(database = db, now = Date.now()) {
  return database.transaction('rw', [database.outbox, database.accountState], async () => {
    if ((await database.accountState.get('local'))?.status === 'exported') return 0
    return database.outbox.where('createdAt').belowOrEqual(now - OUTBOX_RETENTION_MS).delete()
  })
}
