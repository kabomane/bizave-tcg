import definitions from '../data/gift-codes.json'
import type { GiftCodeDefinition } from './types'

// Only hashes and rewards are public. Redeemable codes stay in .local/gift-codes/.
export const giftCodeByHash = new Map<string, GiftCodeDefinition>((definitions as GiftCodeDefinition[]).map(gift => [gift.codeHash, gift]))
