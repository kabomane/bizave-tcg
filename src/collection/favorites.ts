import { db, type BizaveDatabase } from '../storage/database'
import { assertAccountActive } from '../storage/accountGuard'
import { variantKey } from '../game/engine'
import type { FavoriteRow } from '../game/types'

/** Caller includes favorites and drops in its write transaction. */
export async function pruneFavorites(database: BizaveDatabase) {
  const owned = new Set((await database.drops.where('status').equals('owned').toArray()).map(variantKey))
  await database.favorites.filter(favorite => !owned.has(favorite.key)).delete()
}

export async function setFavorite(card: Omit<FavoriteRow, 'key'>, favorite: boolean, database = db) {
  const key = variantKey(card)
  await database.transaction('rw', [database.favorites, database.drops, database.accountState], async () => {
    await assertAccountActive(database)
    if (!favorite) { await database.favorites.delete(key); return }
    const owned = await database.drops.where('[cardId+finish+artVariant]').equals([card.cardId, card.finish, card.artVariant]).filter(drop => drop.status === 'owned').first()
    if (!owned) throw new Error('Cette variante n’est plus dans votre collection.')
    await database.favorites.put({ key, cardId: card.cardId, finish: card.finish, artVariant: card.artVariant })
  })
}
