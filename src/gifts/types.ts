import type { WeeklyBonusKind } from '../game/types'

type BoosterGift = { boosterId: string; quantity: number }
type GiftReward =
  | ({ type: 'booster'; fragments?: number } & BoosterGift)
  | { type: 'boosters'; boosters: BoosterGift[] }
  | { type: 'fragments'; amount: number }
  | { type: 'promo-card'; cardId: string }
  | { type: 'weekly-bonus'; bonus: WeeklyBonusKind; quantity: number }
export type GiftCodeDefinition = { codeHash: string; reward: GiftReward; issuedAt: number; expiresAt: number }
export type UsedGiftCodeRow = { codeHash: string; redeemedAt: number }
