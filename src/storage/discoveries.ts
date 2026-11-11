import { variantKey } from '../game/engine'
import type { Card } from '../game/types'
import type { BizaveDatabase } from './database'

export async function discover(database: BizaveDatabase, card: Card, now: number) {
  const key = variantKey(card)
  if (!await database.discoveries.get(key)) await database.discoveries.add({ key, cardId: card.cardId, finish: card.finish, artVariant: card.artVariant, firstDiscoveredAt: now })
}
