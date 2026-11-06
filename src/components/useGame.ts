import { createContext, useContext } from 'react'
import type { BoosterStockRow, CardDropRow, OpenRecord, PlayerStateRow } from '../game/types'
import type { WeeklyShopRow } from '../game/weeklyShop'
type GameState = { player: PlayerStateRow; drops: CardDropRow[]; pendingOpening: OpenRecord | undefined; boosterStock: BoosterStockRow[]; weeklyShop?: WeeklyShopRow; notify: (text: string) => void }
export const GameContext = createContext<GameState | null>(null)
export function useGame() { const value = useContext(GameContext); if (!value) throw new Error('GameContext manquant'); return value }
