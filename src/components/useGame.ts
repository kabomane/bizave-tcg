import { createContext, useContext } from 'react'
import type { BoosterStockRow, CardDiscoveryRow, CardDropRow, OpenRecord, PlayerStateRow } from '../game/types'
export type GameState = { player: PlayerStateRow; drops: CardDropRow[]; discoveries: CardDiscoveryRow[]; openings: OpenRecord[]; boosterStock: BoosterStockRow[]; now: number; notify: (text: string) => void }
export const GameContext = createContext<GameState | null>(null)
export function useGame() { const value = useContext(GameContext); if (!value) throw new Error('GameContext manquant'); return value }
