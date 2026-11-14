import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { cards, cardById } from '../data/cards'
import { boosters } from '../data/boosters'
import { activeEventBoosters, eventBoosters, eventCards } from '../data/events'
import { drawPack, resolveBoosterPool, uuid } from '../game/engine'
import { createWeeklyShop } from '../game/weeklyShop'
import { createDailyShop } from '../game/dailyShop'
import { DEFAULT_PREFERENCES } from '../settings/preferences'
import { BizaveDatabase } from './database'
import { ensureInstallation } from './installation'
import { exportSave, importSave } from './saveTransfer'
import { advanceReveal, buyBooster, finishOpening, initializeDatabase, openBooster } from './services'

const now = Date.parse('2026-11-14T12:00:00Z')
let db: BizaveDatabase
beforeEach(async () => {
  vi.stubGlobal('localStorage', { getItem: () => '{"devEventAlwaysActive":true}' })
  db = new BizaveDatabase('events-' + uuid())
  await initializeDatabase(db, now)
})
afterEach(async () => { vi.unstubAllGlobals(); await db.delete() })

it('isole les douze cartes événement des boosters actuels, même par liste, groupe ou rareté', () => {
  expect(eventCards).toHaveLength(12)
  const eventIds = new Set(eventCards.map(card => card.id))
  for (const booster of boosters) expect(resolveBoosterPool(booster, cards).some(entry => eventIds.has(entry.card.id))).toBe(false)
  for (const card of eventCards) {
    for (const sources of [
      [{ type: 'cards' as const, cardIds: [card.id] }],
      [{ type: 'collection' as const, collectionId: card.collectionId }],
      [{ type: 'rarities' as const, rarities: [card.rarity] }],
    ]) expect(resolveBoosterPool({ ...boosters[0], sources }, cards).some(entry => eventIds.has(entry.card.id))).toBe(false)
  }
  for (const booster of eventBoosters) {
    const pool = resolveBoosterPool(booster, cards)
    expect(pool).toHaveLength(6)
    expect(pool.every(entry => entry.card.eventId === booster.eventId)).toBe(true)
    for (const value of [0, .8099, .81, .8999, .90, .9199, .92, .9599, .96, .9999]) {
      const [drop] = drawPack(booster, cards, () => value)
      expect(drop).toMatchObject({ finish: value < .81 ? 'normal' : value < .96 ? 'glossy' : 'alternative', artVariant: value < .92 ? 'standard' : 'fullArt' })
      expect(cardById.get(drop.cardId)?.rarity).toBe(value < .9 ? 'common' : 'legendary')
    }
  }
})

it('exclut aussi les événements des boosters et des vitrines aléatoires du jour et de la semaine', () => {
  let seed = 1411
  const rng = () => { seed = (Math.imul(1664525, seed) + 1013904223) >>> 0; return seed / 2 ** 32 }
  for (let i = 0; i < 40; i++) {
    const weekly = createWeeklyShop(cards, now, rng), daily = createDailyShop(cards, now, rng)
    const ids = [...weekly.offers.map(c => c.cardId), ...daily.cards.map(c => c.cardId), ...resolveBoosterPool(weekly.booster.definition, cards).map(c => c.card.id)]
    expect(ids.every(id => !cardById.get(id)?.eventId)).toBe(true)
    expect(eventBoosters.some(b => b.id === daily.bundle.boosterId)).toBe(false)
  }
})

it.each(eventBoosters)('$title reste désactivé par défaut sans débit ni consommation du stock', async booster => {
  vi.stubGlobal('localStorage', { getItem: () => null })
  await db.player.update('local', { fragments: 100 })
  await db.boosterStock.put({ boosterId: booster.id, quantity: 1, updatedAt: now })
  expect(activeEventBoosters()).toEqual([])
  await expect(buyBooster(booster.id, db, now)).rejects.toThrow(/disponible en boutique/)
  await expect(openBooster(booster.id, db, now)).rejects.toThrow(/indisponible/)
  expect(await db.player.get('local')).toMatchObject({ fragments: 100, freePackStock: 5 })
  expect((await db.boosterStock.get(booster.id))?.quantity).toBe(1)
  expect(await db.drops.count()).toBe(0)
})

it.each(eventBoosters)('$title coûte 30 fragments et conserve sa carte après révélation et rechargement', async booster => {
  await db.player.update('local', { fragments: 30 })
  const purchases = await Promise.allSettled([buyBooster(booster.id, db, now), buyBooster(booster.id, db, now)])
  expect(purchases.filter(p => p.status === 'fulfilled')).toHaveLength(1)
  const [opening, concurrent] = await Promise.all([openBooster(booster.id, db, now), openBooster(booster.id, db, now)])
  expect(concurrent).toEqual(opening)
  expect(opening.results).toHaveLength(1)
  const [drop] = opening.results
  expect(cardById.get(drop.cardId)?.eventId).toBe(booster.eventId)
  expect(await db.drops.get(drop.dropId)).toMatchObject({ ...drop, status: 'owned' })
  expect(await db.discoveries.count()).toBe(1)
  expect(await db.player.get('local')).toMatchObject({ fragments: 0, freePackStock: 5 })
  expect((await db.boosterStock.get(booster.id))?.quantity).toBe(0)
  vi.stubGlobal('localStorage', { getItem: () => null })
  await advanceReveal(opening.id, db)
  expect(await openBooster(booster.id, db, now)).toEqual({ ...opening, revealedCount: 1 })
  await finishOpening(opening.id, db)
  await initializeDatabase(db, now)
  expect(await db.openings.count()).toBe(0)
  expect(await db.drops.get(drop.dropId)).toMatchObject({ ...drop, status: 'owned' })
  expect(await db.discoveries.count()).toBe(1)
})

it.each(eventBoosters)('$title transfère sa carte permanente et reprend son ouverture hors événement', async booster => {
  await db.player.update('local', { fragments: 30 })
  await buyBooster(booster.id, db, now)
  const opening = await openBooster(booster.id, db, now)
  const target = new BizaveDatabase('events-target-' + uuid())
  try {
    await initializeDatabase(target, now)
    const contents = await exportSave((await ensureInstallation(target)).installationId, DEFAULT_PREFERENCES, db)
    await importSave(contents, target)
    vi.stubGlobal('localStorage', { getItem: () => null })
    expect(await openBooster(booster.id, target, now)).toEqual(opening)
    expect(await target.definitions.get(opening.results[0].cardId)).toMatchObject({ eventId: booster.eventId })
    expect(await target.drops.get(opening.results[0].dropId)).toMatchObject({ ...opening.results[0], status: 'owned' })
    expect(await target.discoveries.count()).toBe(1)
  } finally { await target.delete() }
})
