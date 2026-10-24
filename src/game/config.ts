import type { ArtVariant, Finish, Rarity } from './types'
export const DEFAULT_RARITY_RATES = { common: 57, uncommon: 24, rare: 12, epic: 5, legendary: 2 } as const
export const DEFAULT_FINISH_RATES = { normal: 81, glossy: 15, alternative: 4 } as const
export const DEFAULT_ART_VARIANT_RATES = { standard: 92, fullArt: 8 } as const
export const FREE_PACK_CAPACITY = 5
export const FREE_PACK_INITIAL_STOCK = 5
export const FREE_PACK_RECHARGE_MS = 600_000
export const DEFAULT_SPECIAL_BOOSTER_PRICE = 60
export const MAX_CARD_TILT_DEGREES = 20
export const RECYCLE_BASE_FRAGMENTS = { common: 1, uncommon: 3, rare: 7, epic: 12, legendary: 19 } as const
export const FINISH_MULTIPLIER_TENTHS = { normal: 10, glossy: 23, alternative: 32 } as const
export const ART_MULTIPLIER_TENTHS = { standard: 10, fullArt: 19 } as const
export const RARITY_LABELS: Record<Rarity, string> = { common: 'Commune', uncommon: 'Peu commune', rare: 'Rare', epic: 'Épique', legendary: 'Légendaire' }
export const RARITY_COLORS: Record<Rarity, string> = { common: '#a1a7b2', uncommon: '#87c5a0', rare: '#87b9f0', epic: '#be9bef', legendary: '#e3c17c' }
export const FINISH_LABELS: Record<Finish, string> = { normal: 'Classique', glossy: 'Holographique', alternative: 'Alternative' }
export const ART_LABELS: Record<ArtVariant, string> = { standard: 'Classique', fullArt: 'Full Art' }
