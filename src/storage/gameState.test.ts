import { expect, it, vi } from 'vitest'
import { BizaveDatabase } from './database'
import { initializeDatabase } from './services'
import { readGameState } from './gameState'
import type { CardDropRow, OpenRecord } from '../game/types'

it('lit les drops utiles et retrouve une ouverture parmi plusieurs horodatages égaux', async () => {
  const database = new BizaveDatabase('game-state-' + crypto.randomUUID())
  try {
    await initializeDatabase(database, 1000)
    const card = { dropId: 'owned', cardId: 't-classique', finish: 'normal', artVariant: 'standard' } as const
    await database.drops.bulkPut(['owned', 'outgoing', 'recycled'].map(status => ({ ...card, dropId: status, status, acquiredAt: 1, updatedAt: 1 } as CardDropRow)))
    const base: OpenRecord = { id: 'a-pending', boosterId: 'phantom-blood', openedAt: 1000, payment: 'free', fragmentsSpent: 0, results: [card], revealComplete: false, revealedCount: 0 }
    await database.openings.bulkPut([{ ...base, id: 'old', openedAt: 999, revealComplete: true }, base, { ...base, id: 'z-complete', revealComplete: true }])
    const allOpenings = vi.spyOn(database.openings, 'toArray'), discoveries = vi.spyOn(database.discoveries, 'toArray')
    const state = await readGameState(database)
    expect(state?.drops.map(drop => drop.status).sort()).toEqual(['outgoing', 'owned'])
    expect(state?.pendingOpening?.id).toBe('a-pending')
    expect(allOpenings).not.toHaveBeenCalled(); expect(discoveries).not.toHaveBeenCalled()
    await database.openings.update('a-pending', { revealComplete: true })
    expect((await readGameState(database))?.pendingOpening).toBeUndefined()
  } finally { await database.delete() }
})
