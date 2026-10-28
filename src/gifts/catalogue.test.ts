import { describe, expect, it } from 'vitest'
import definitions from '../data/gift-codes.json'
import { boosters } from '../data/boosters'
import { shopBoosters } from '../game/boosterAvailability'
import { GIFT_CODE_HASH_PATTERN } from './format'
import type { GiftCodeDefinition } from './types'

describe('catalogue public des cadeaux', () => {
  it('ne publie que des empreintes uniques et des récompenses valides', () => {
    const gifts = definitions as GiftCodeDefinition[]
    expect(gifts.length).toBeGreaterThan(0)
    expect(new Set(gifts.map(gift => gift.codeHash)).size).toBe(gifts.length)
    const available = new Set(shopBoosters(boosters).map(booster => booster.id))
    for (const gift of gifts) {
      expect(Object.keys(gift).sort()).toEqual(['codeHash', 'reward'])
      expect(gift.codeHash).toMatch(GIFT_CODE_HASH_PATTERN)
      if (gift.reward.type === 'booster') {
        expect(available.has(gift.reward.boosterId)).toBe(true)
        expect(Number.isSafeInteger(gift.reward.quantity) && gift.reward.quantity > 0).toBe(true)
      } else {
        expect(gift.reward.type).toBe('fragments')
        expect(Number.isSafeInteger(gift.reward.amount) && gift.reward.amount > 0).toBe(true)
      }
    }
  })
})
