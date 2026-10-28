import { boosters } from '../data/boosters'
import { db } from '../storage/database'
import { assertAccountActive } from '../storage/accountGuard'
import { giftCodeByHash } from './catalogue'
import { hashGiftCode } from './format'

export async function redeemGiftCode(code: string, database = db, now = Date.now()) {
  // Web Crypto runs before the transaction so IndexedDB cannot auto-close it.
  const codeHash = await hashGiftCode(code)
  const gift = giftCodeByHash.get(codeHash)
  if (!gift) throw new Error('Ce code cadeau est invalide.')
  const reward = gift.reward
  const booster = reward.type === 'booster' ? boosters.find(item => item.id === reward.boosterId && item.enabled) : undefined
  if (reward.type === 'booster' && !booster) throw new Error('Le booster de ce cadeau est indisponible.')
  const amount = reward.type === 'booster' ? reward.quantity : reward.amount
  if (!Number.isSafeInteger(amount) || amount <= 0 || !Number.isSafeInteger(now) || now < 0) throw new Error('Ce cadeau est indisponible.')
  return database.transaction('rw', [database.player, database.boosterStock, database.usedGiftCodes, database.accountState], async () => {
    await assertAccountActive(database)
    if (await database.usedGiftCodes.get(codeHash)) throw new Error('Ce code cadeau a déjà été utilisé.')
    const player = await database.player.get('local')
    if (!player) throw new Error('La sauvegarde locale est indisponible.')
    const time = Math.max(now, player.maxObservedClockAt)
    if (reward.type === 'booster') {
      const quantity = (await database.boosterStock.get(reward.boosterId))?.quantity ?? 0
      if (!Number.isSafeInteger(quantity) || quantity < 0 || !Number.isSafeInteger(quantity + amount)) throw new Error('Le stock de ce booster est incohérent.')
      // Gifts use the purchased reserve, independently of the free recharge stock.
      await database.boosterStock.put({ boosterId: reward.boosterId, quantity: quantity + amount, updatedAt: time })
    } else {
      if (!Number.isSafeInteger(player.fragments) || player.fragments < 0 || !Number.isSafeInteger(player.fragments + amount)) throw new Error('Le solde de fragments est incohérent.')
    }
    await database.player.put({ ...player, fragments: player.fragments + (reward.type === 'fragments' ? amount : 0), maxObservedClockAt: time })
    await database.usedGiftCodes.add({ codeHash, redeemedAt: time })
    return reward
  })
}
