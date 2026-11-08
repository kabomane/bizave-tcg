import { boosters } from '../data/boosters'
import { cardById } from '../data/cards'
import { DEFAULT_ART_VARIANT_RATES, DEFAULT_FINISH_RATES } from '../game/config'
import { uuid } from '../game/engine'
import type { ArtVariant, CardDropRow, Finish } from '../game/types'
import { db } from '../storage/database'
import { assertAccountActive } from '../storage/accountGuard'
import { discover } from '../storage/services'
import { giftCodeByHash } from './catalogue'
import { hashGiftCode } from './format'
import type { GiftCodeDefinition } from './types'

function assertGiftActive(gift: GiftCodeDefinition, now: number) {
  if (!Number.isSafeInteger(gift.issuedAt) || !Number.isSafeInteger(gift.expiresAt) || gift.issuedAt < 0 || gift.expiresAt <= gift.issuedAt) throw new Error('Ce code cadeau est invalide.')
  if (now >= gift.expiresAt) throw new Error('Ce code cadeau a expiré.')
  if (now < gift.issuedAt) throw new Error('Ce code cadeau n’est pas encore valide. Vérifiez l’heure de votre appareil.')
}

export async function redeemGiftCode(code: string, database = db, now?: number) {
  const requestedAt = now ?? Date.now()
  // Web Crypto runs before the transaction so IndexedDB cannot auto-close it.
  const codeHash = await hashGiftCode(code)
  const gift = giftCodeByHash.get(codeHash)
  if (!gift) throw new Error('Ce code cadeau est invalide.')
  assertGiftActive(gift, requestedAt)
  const reward = gift.reward
  const cardId = reward.type === 'card-variants' ? reward.cardId : undefined
  if (reward.type === 'card-variants' && !cardById.get(reward.cardId)?.promoNumber) throw new Error('La carte de ce cadeau est indisponible.')
  if (reward.type === 'weekly-bonus' && ((reward.bonus !== 'reroll' && reward.bonus !== 'fragments') || !Number.isSafeInteger(reward.quantity) || reward.quantity <= 0)) throw new Error('Ce cadeau est indisponible.')
  const grants = reward.type === 'booster' ? [reward] : reward.type === 'boosters' ? reward.boosters : []
  if (!Array.isArray(grants) || reward.type === 'boosters' && !grants.length || new Set(grants.map(item => item.boosterId)).size !== grants.length) throw new Error('Ce cadeau est indisponible.')
  for (const grant of grants) {
    if (!boosters.some(item => item.id === grant.boosterId && item.enabled)) throw new Error('Le booster de ce cadeau est indisponible.')
    if (!Number.isSafeInteger(grant.quantity) || grant.quantity <= 0) throw new Error('Ce cadeau est indisponible.')
  }
  const fragments = reward.type === 'fragments' ? reward.amount : reward.type === 'booster' ? reward.fragments ?? 0 : 0
  if (!Number.isSafeInteger(fragments) || fragments < 0) throw new Error('Ce cadeau est indisponible.')
  if (reward.type === 'fragments' && fragments <= 0 || !Number.isSafeInteger(requestedAt) || requestedAt < 0) throw new Error('Ce cadeau est indisponible.')
  const tables = [database.player, database.boosterStock, database.usedGiftCodes, database.accountState]
  return database.transaction('rw', cardId ? [...tables, database.drops, database.discoveries] : tables, async () => {
    await assertAccountActive(database)
    if (await database.usedGiftCodes.get(codeHash)) throw new Error('Ce code cadeau a déjà été utilisé.')
    const player = await database.player.get('local')
    if (!player) throw new Error('La sauvegarde locale est indisponible.')
    const time = Math.max(now ?? Date.now(), player.maxObservedClockAt)
    assertGiftActive(gift, time)
    for (const grant of grants) {
      const quantity = (await database.boosterStock.get(grant.boosterId))?.quantity ?? 0
      if (!Number.isSafeInteger(quantity) || quantity < 0 || !Number.isSafeInteger(quantity + grant.quantity)) throw new Error('Le stock de ce booster est incohérent.')
      // Gifts use the purchased reserve, independently of the free recharge stock.
      await database.boosterStock.put({ boosterId: grant.boosterId, quantity: quantity + grant.quantity, updatedAt: time })
    }
    if (!Number.isSafeInteger(player.fragments) || player.fragments < 0 || !Number.isSafeInteger(player.fragments + fragments)) throw new Error('Le solde de fragments est incohérent.')
    if (reward.type === 'weekly-bonus') {
      const credits = player.weeklyBonusCredits?.[reward.bonus] ?? 0
      const total = credits + reward.quantity
      if (!Number.isSafeInteger(credits) || credits < 0 || !Number.isSafeInteger(total + 1)) throw new Error('Le stock de bonus est incohérent.')
      player.weeklyBonusCredits = { ...player.weeklyBonusCredits, [reward.bonus]: total }
    }
    if (cardId) {
      const finishes = Object.keys(DEFAULT_FINISH_RATES) as Finish[]
      const illustrations = Object.keys(DEFAULT_ART_VARIANT_RATES) as ArtVariant[]
      const drops: CardDropRow[] = finishes.flatMap(finish => illustrations.map(artVariant => ({
        dropId: uuid(), cardId, finish, artVariant, status: 'owned', acquiredAt: time, updatedAt: time, circulation: 'local',
      })))
      await database.drops.bulkAdd(drops)
      for (const drop of drops) await discover(database, drop, time)
    }
    await database.player.put({ ...player, fragments: player.fragments + fragments, maxObservedClockAt: time })
    await database.usedGiftCodes.add({ codeHash, redeemedAt: time })
    return reward
  })
}
