import type { CSSProperties } from 'react'
import { RARITY_COLORS } from '../game/config'
import type { Rarity } from '../game/types'

export function CardBackdrop({ rarity, color, className }: { rarity?: Rarity; color?: string; className: string }) {
  return <div aria-hidden="true" data-rarity={rarity} className={`rarity-backdrop ${className}`} style={{ '--rarity-color': color ?? (rarity ? RARITY_COLORS[rarity] : 'var(--page)') } as CSSProperties} />
}
