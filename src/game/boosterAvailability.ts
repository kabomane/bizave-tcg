import type { BoosterDefinition, BoosterStockRow } from './types'

export function purchasedQuantity(boosterId: string, stock: readonly BoosterStockRow[]) {
  const quantity = stock.find(row => row.boosterId === boosterId)?.quantity ?? 0
  return Number.isSafeInteger(quantity) && quantity > 0 ? quantity : 0
}
const byOrder = (a: BoosterDefinition, b: BoosterDefinition) => a.order - b.order || a.id.localeCompare(b.id)
export function shopOffer(booster: BoosterDefinition) {
  return booster.access.type === 'shop' ? booster.access : booster.access.shop
}
export function availableBoosters(definitions: readonly BoosterDefinition[], stock: readonly BoosterStockRow[]) {
  return definitions.filter(booster => booster.enabled && (booster.access.type === 'free' || purchasedQuantity(booster.id, stock) > 0)).sort(byOrder)
}
export function shopBoosters(definitions: readonly BoosterDefinition[]) {
  return definitions.filter(booster => {
    const offer = shopOffer(booster)
    return booster.enabled && offer && offer.listed !== false
  }).sort(byOrder)
}
