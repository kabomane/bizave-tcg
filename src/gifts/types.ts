export type GiftReward = { type: 'booster'; boosterId: string; quantity: number; fragments?: number } | { type: 'fragments'; amount: number }
export type GiftCodeDefinition = { codeHash: string; reward: GiftReward }
export type UsedGiftCodeRow = { codeHash: string; redeemedAt: number }
