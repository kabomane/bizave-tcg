import { db } from './database'

export async function readGameState(database = db) {
  const [player, drops, last, boosterStock] = await Promise.all([database.player.get('local'), database.drops.where('status').anyOf('owned', 'outgoing').toArray(), database.openings.orderBy('openedAt').last(), database.boosterStock.toArray()])
  // Equal monotonic timestamps are possible after a clock rollback: inspect all tied rows.
  const pendingOpening = last && (await database.openings.where('openedAt').equals(last.openedAt).toArray()).find(opening => !opening.revealComplete)
  return player ? { player, drops, pendingOpening, boosterStock } : undefined
}
