export type BoosterGift = { boosterId: string; quantity: number }
export type GiftReward = ({ type: 'booster'; fragments?: number } & BoosterGift) | { type: 'boosters'; boosters: BoosterGift[] } | { type: 'fragments'; amount: number }
export type GiftCodeDefinition = { codeHash: string; reward: GiftReward; issuedAt: number; expiresAt: number }
export type UsedGiftCodeRow = { codeHash: string; redeemedAt: number }
