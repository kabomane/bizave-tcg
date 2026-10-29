import type { BizaveDatabase } from './database'

/** Caller holds a transaction covering drops, recycledCards and recycling. */
export async function compactRecycledData(database: BizaveDatabase) {
  const recycled = await database.drops.where('status').equals('recycled').toArray()
  await database.recycledCards.bulkPut(recycled.filter(card => card.circulation !== 'local').map(card => ({ dropId: card.dropId })))
  await database.drops.bulkDelete(recycled.map(card => card.dropId))
  await database.recycling.clear()
}
