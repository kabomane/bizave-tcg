import { describe, expect, it } from 'vitest'
import { fixtureBoosters } from '../test-fixtures'
import type { BoosterDefinition } from './types'
import { availableBoosters, purchasedQuantity, shopBoosters } from './boosterAvailability'

describe('disponibilité des paquets', () => {
  it('propose aussi les offres des gratuits sans dupliquer le paquet dans la sélection', () => {
    const offered: BoosterDefinition = { ...fixtureBoosters[0], access: { type: 'free', shop: { price: 70 } } }
    const stock = [{ boosterId: offered.id, quantity: 3, updatedAt: 0 }]
    expect(shopBoosters([offered])).toEqual([offered])
    expect(availableBoosters([offered], stock)).toEqual([offered])
    const retired: BoosterDefinition = { ...offered, access: { type: 'free', shop: { price: 70, listed: false } } }
    expect(shopBoosters([retired])).toEqual([])
    expect(availableBoosters([retired], [])).toEqual([retired])
  })
  const free = fixtureBoosters[0], shop = fixtureBoosters[1]
  it('garde les gratuits dans le choix et cache les paquets de boutique non possédés', () => {
    expect(availableBoosters(fixtureBoosters, []).map(booster => booster.id)).toEqual([free.id])
    expect(shopBoosters(fixtureBoosters).map(booster => booster.id)).toContain(shop.id)
    expect(availableBoosters(fixtureBoosters, [{ boosterId: shop.id, quantity: 1, updatedAt: 0 }]).map(booster => booster.id)).toEqual([free.id, shop.id])
    expect(availableBoosters(fixtureBoosters, [{ boosterId: shop.id, quantity: 0, updatedAt: 0 }]).map(booster => booster.id)).toEqual([free.id])
  })
  it('permet de retirer une offre de la boutique tout en gardant ses exemplaires ouvrables', () => {
    const retired: BoosterDefinition = { ...shop, access: { type: 'shop', price: 60, listed: false } }
    expect(shopBoosters([retired])).toEqual([])
    expect(availableBoosters([retired], [{ boosterId: retired.id, quantity: 2, updatedAt: 0 }])).toEqual([retired])
  })
  it('ordonne les paquets et ignore les stocks invalides ou les paquets désactivés', () => {
    const before = { ...free, id: 'before', order: -1 }
    expect(availableBoosters([free, before], []).map(booster => booster.id)).toEqual(['before', free.id])
    expect(availableBoosters([{ ...shop, enabled: false }], [{ boosterId: shop.id, quantity: 2, updatedAt: 0 }])).toEqual([])
    for (const quantity of [-1, .5, NaN, Infinity]) expect(purchasedQuantity(shop.id, [{ boosterId: shop.id, quantity, updatedAt: 0 }])).toBe(0)
  })
})
