import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { christmasBooster, christmasCardById, christmasCards } from '../data/christmas'
import { cards } from '../data/cards'
import { boosters } from '../data/boosters'
import { resolveBoosterPool, uuid } from '../game/engine'
import { DEFAULT_PREFERENCES } from '../settings/preferences'
import { BizaveDatabase } from './database'
import { ensureInstallation } from './installation'
import { exportSave, importSave } from './saveTransfer'
import { advanceReveal, buyBooster, finishOpening, initializeDatabase, openBooster } from './services'

const now = Date.parse('2026-12-25T12:00:00Z')
let db: BizaveDatabase
beforeEach(async () => {
  vi.stubGlobal('localStorage', { getItem: () => '{"devEventAlwaysActive":true}' })
  db = new BizaveDatabase('christmas-' + uuid())
  await initializeDatabase(db, now)
})
afterEach(async () => { vi.unstubAllGlobals(); await db.delete() })

it('sépare les vingt cadeaux temporaires et PR-002 des pools habituels', () => {
  expect(christmasCards).toHaveLength(20)
  const clues = christmasCards.flatMap(card => card.description.includes('\n') ? [card.description.split('\n')[1].split(' - ')] : [])
  expect(clues).toHaveLength(4)
  for (const [index, slots] of clues.entries()) {
    expect(slots).toHaveLength(4)
    expect(slots[index]).toMatch(/^[A-Z2-9]{4}$/)
    expect(slots.filter((_, slot) => slot !== index)).toEqual(['….', '….', '….'])
  }
  expect(christmasCardById.has('merry-wifemas')).toBe(false)
  expect(cards.every(card => !christmasCardById.has(card.id))).toBe(true)
  const pools = boosters.flatMap(booster => resolveBoosterPool(booster, cards).map(entry => entry.card.id))
  expect(pools.every(id => id !== 'merry-wifemas' && !christmasCardById.has(id))).toBe(true)
})

it('achète six paquets à 50 fragments puis révèle une carte sans collection ni découverte', async () => {
  const id = christmasBooster.id
  await db.player.update('local', { fragments: 325 })
  await Promise.all(Array.from({ length: 6 }, () => buyBooster(id, db, now)))
  await expect(buyBooster(id, db, now)).rejects.toThrow(/pas assez/)
  expect(await db.player.get('local')).toMatchObject({ fragments: 25, freePackStock: 5 })
  expect((await db.boosterStock.get(id))?.quantity).toBe(6)
  const first = await openBooster(id, db, now)
  expect(first.results).toHaveLength(1)
  expect(first.results[0]).toMatchObject({ finish: 'normal', artVariant: 'standard' })
  expect(christmasCardById.has(first.results[0].cardId)).toBe(true)
  await advanceReveal(first.id, db)
  const resumed = await openBooster(id, db, now)
  expect(resumed).toEqual({ ...first, revealedCount: 1 })
  expect((await db.boosterStock.get(id))?.quantity).toBe(5)
  await finishOpening(first.id, db)
  expect(await db.openings.count()).toBe(0)
  expect(await db.drops.count()).toBe(0)
  expect(await db.discoveries.count()).toBe(0)
  expect(await db.weeklyShop.count()).toBe(0)
})

it('masque le stock de Noël hors événement sans retirer les exemplaires achetés', async () => {
  const id = christmasBooster.id
  await db.player.update('local', { fragments: 200 })
  await buyBooster(id, db, now)
  vi.stubGlobal('localStorage', { getItem: () => null })
  await expect(buyBooster(id, db, now)).rejects.toThrow(/disponible en boutique/)
  await expect(openBooster(id, db, now)).rejects.toThrow(/indisponible/)
  expect((await db.boosterStock.get(id))?.quantity).toBe(1)
  expect((await db.player.get('local'))?.fragments).toBe(150)
})

it('reprend une révélation temporaire transférée sans créer de carte permanente', async () => {
  const id = christmasBooster.id
  await db.player.update('local', { fragments: 50 })
  await buyBooster(id, db, now)
  const opening = await openBooster(id, db, now)
  const target = new BizaveDatabase('christmas-target-' + uuid())
  try {
    await initializeDatabase(target, now)
    const contents = await exportSave((await ensureInstallation(target)).installationId, DEFAULT_PREFERENCES, db)
    await importSave(contents, target)
    expect(await openBooster(id, target, now)).toEqual(opening)
    expect(await target.definitions.get(opening.results[0].cardId)).toBeUndefined()
    expect(await target.drops.count()).toBe(0)
  } finally { await target.delete() }
})
