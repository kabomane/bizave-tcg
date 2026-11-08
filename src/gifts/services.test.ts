import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BizaveDatabase } from '../storage/database'
import { initializeDatabase, openBooster } from '../storage/services'
import { exportSave, importSave } from '../storage/saveTransfer'
import { ensureInstallation } from '../storage/installation'
import { DEFAULT_PREFERENCES } from '../settings/preferences'
import { uuid, variantKey } from '../game/engine'
import { claimWeeklyBonus, refreshWeeklyShop } from '../storage/weeklyShop'
import { hashGiftCode, normalizeGiftCode } from './format'
import { redeemGiftCode } from './services'
import { giftCodeByHash } from './catalogue'

// Fictional test codes: none of these are present in the published catalogue.
vi.mock('./catalogue', async () => {
  const { hashGiftCode } = await import('./format')
  const rewards = [
    { code: 'AAAAAAAAAAAAAAAA', reward: { type: 'booster', boosterId: 'phantom-blood', quantity: 10 } },
    { code: 'BBBBBBBBBBBBBBBB', reward: { type: 'booster', boosterId: 'anima-isekai', quantity: 10 } },
    { code: 'CCCCCCCCCCCCCCCC', reward: { type: 'fragments', amount: 500 } },
    { code: 'DDDDDDDDDDDDDDDD', reward: { type: 'booster', boosterId: 'phantom-blood', quantity: 2, fragments: 100 } },
    { code: 'EEEEEEEEEEEEEEEE', reward: { type: 'boosters', boosters: ['phantom-blood', 'anima-isekai', 'epico-stellari', 'rarity-only'].map(boosterId => ({ boosterId, quantity: 1 })) } },
    { code: 'FFFFFFFFFFFFFFFF', reward: { type: 'card-variants', cardId: 'bizave-tcg-beta' } },
    { code: 'GGGGGGGGGGGGGGGG', reward: { type: 'weekly-bonus', bonus: 'reroll', quantity: 2 } },
    { code: 'HHHHHHHHHHHHHHHH', reward: { type: 'weekly-bonus', bonus: 'fragments', quantity: 2 } },
  ]
  return { giftCodeByHash: new Map(await Promise.all(rewards.map(async gift => { const codeHash = await hashGiftCode(gift.code); return [codeHash, { codeHash, reward: gift.reward, issuedAt: 0, expiresAt: 8_000_000_000_000_000 }] as const }))) }
})

let db: BizaveDatabase
beforeEach(async () => { db = new BizaveDatabase('gifts-' + uuid()); await initializeDatabase(db, 100) })
afterEach(async () => { vi.restoreAllMocks(); await db.delete() })

describe('codes cadeaux hors ligne', () => {
  it('ajoute deux utilisations par cadeau sans consommer les bonus ordinaires', async () => {
    const now = 200
    const results = await Promise.allSettled([redeemGiftCode('GGGG-GGGG-GGGG-GGGG', db, now), redeemGiftCode('GGGG-GGGG-GGGG-GGGG', db, now)])
    expect(results.map(result => result.status).sort()).toEqual(['fulfilled', 'rejected'])
    await redeemGiftCode('HHHH-HHHH-HHHH-HHHH', db, now)
    expect(await db.weeklyShop.count()).toBe(0)
    expect(await db.player.get('local')).toMatchObject({ fragments: 0, weeklyBonusCredits: { reroll: 2, fragments: 2 } })
    const shop = await refreshWeeklyShop(db, now)
    for (let i = 0; i < 2; i++) await claimWeeklyBonus(shop.weekStart, 'reroll', db, now, 0)
    expect((await db.weeklyShop.get('current'))?.rerollUsed).toBeUndefined()
    expect(await db.player.get('local')).toMatchObject({ fragments: 0, weeklyBonusCredits: { reroll: 0, fragments: 2 } })

    const amounts = []
    for (let i = 0; i < 3; i++) amounts.push((await claimWeeklyBonus(shop.weekStart, 'fragments', db, now))!)
    await expect(claimWeeklyBonus(shop.weekStart, 'fragments', db, now)).rejects.toThrow(/déjà été réclamée/)
    expect(amounts.every(amount => amount >= 10 && amount <= 300 && amount % 10 === 0)).toBe(true)
    const fragments = amounts.reduce((sum, amount) => sum + amount, 0)
    expect(await db.player.get('local')).toMatchObject({ fragments, weeklyBonusCredits: { reroll: 0, fragments: 0 } })

    await db.player.update('local', { fragments: 1000 })
    await expect(claimWeeklyBonus(shop.weekStart, 'reroll', db, now, 0)).rejects.toThrow(/prix du reroll a changé/)
    expect((await db.player.get('local'))?.fragments).toBe(1000)
    await claimWeeklyBonus(shop.weekStart, 'reroll', db, now, 150)
    await expect(claimWeeklyBonus(shop.weekStart, 'reroll', db, now)).rejects.toThrow(/déjà été utilisé/)
    expect((await db.player.get('local'))?.fragments).toBe(850)
    expect(await db.weeklyShop.get('current')).toMatchObject({ rerollCount: 3, rerollUsed: true, fragmentsClaimed: true })
  })

  it('conserve les bonus cadeaux au lundi et après un transfert', async () => {
    const now = Date.now()
    const shop = await refreshWeeklyShop(db, now)
    await redeemGiftCode('HHHH-HHHH-HHHH-HHHH', db, now)
    const next = await refreshWeeklyShop(db, shop.rerollAt)
    await claimWeeklyBonus(next.weekStart, 'fragments', db, next.weekStart)
    expect((await db.player.get('local'))?.weeklyBonusCredits).toEqual({ fragments: 2 })
    const target = new BizaveDatabase('gift-bonuses-' + uuid())
    try {
      await initializeDatabase(target, now)
      const contents = await exportSave((await ensureInstallation(target)).installationId, DEFAULT_PREFERENCES, db)
      await importSave(contents, target)
      expect((await target.player.get('local'))?.weeklyBonusCredits).toEqual({ fragments: 2 })
      await expect(redeemGiftCode('HHHH-HHHH-HHHH-HHHH', target, next.weekStart)).rejects.toThrow(/déjà été utilisé/)
      await claimWeeklyBonus(next.weekStart, 'fragments', target, next.weekStart)
      expect((await target.player.get('local'))?.weeklyBonusCredits).toEqual({ fragments: 1 })
    } finally { await target.delete() }
  })

  it('attribue chacune des six variantes de PR-001 une seule fois', async () => {
    const code = 'FFFF-FFFF-FFFF-FFFF'
    const results = await Promise.allSettled([redeemGiftCode(code, db, 200), redeemGiftCode(code, db, 200)])
    expect(results.map(result => result.status).sort()).toEqual(['fulfilled', 'rejected'])
    const drops = await db.drops.toArray()
    const keys = ['normal', 'glossy', 'alternative'].flatMap(finish =>
      ['standard', 'fullArt'].map(art => `bizave-tcg-beta::${finish}::${art}`)).sort()
    expect(drops.map(variantKey).sort()).toEqual(keys)
    expect(drops.every(drop => drop.status === 'owned' && drop.circulation === 'local')).toBe(true)
    expect((await db.discoveries.toArray()).map(row => row.key).sort()).toEqual(keys)
    expect(await db.usedGiftCodes.count()).toBe(1)
    expect(await db.boosterStock.count()).toBe(0)
    expect((await db.player.get('local'))?.fragments).toBe(0)
  })

  it('respecte l’expiration à la milliseconde près, sans crédit pour un code expiré', async () => {
    const hash = await hashGiftCode('CCCC-CCCC-CCCC-CCCC'), previous = giftCodeByHash.get(hash)!
    const issuedAt = 100, expiresAt = issuedAt + 24 * 60 * 60 * 1000
    giftCodeByHash.set(hash, { ...previous, issuedAt, expiresAt })
    try {
      await expect(redeemGiftCode('CCCC-CCCC-CCCC-CCCC', db, expiresAt)).rejects.toThrow(/expiré/)
      await expect(redeemGiftCode('CCCC-CCCC-CCCC-CCCC', db, expiresAt + 60 * 60 * 1000)).rejects.toThrow(/expiré/)
      expect((await db.player.get('local'))?.fragments).toBe(0)
      expect(await db.usedGiftCodes.count()).toBe(0)
      await redeemGiftCode('CCCC-CCCC-CCCC-CCCC', db, expiresAt - 1)
      expect((await db.player.get('local'))?.fragments).toBe(500)
    } finally { giftCodeByHash.set(hash, previous) }
  })
  it('crédite les quatre paquets ensemble une seule fois, sans modifier le solde ni le gratuit', async () => {
    const before = await db.player.get('local')
    await db.boosterStock.put({ boosterId: 'anima-isekai', quantity: 3, updatedAt: 100 })
    const results = await Promise.allSettled([redeemGiftCode('EEEE-EEEE-EEEE-EEEE', db, 200), redeemGiftCode('EEEE-EEEE-EEEE-EEEE', db, 200)])
    expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
    expect((await db.boosterStock.toArray()).map(row => [row.boosterId, row.quantity]).sort()).toEqual([['phantom-blood', 1], ['anima-isekai', 4], ['epico-stellari', 1], ['rarity-only', 1]].sort())
    expect(await db.player.get('local')).toEqual({ ...before, maxObservedClockAt: 200 })
    expect(await db.usedGiftCodes.count()).toBe(1)
  })
  it('annule tous les paquets si un des stocks déborde', async () => {
    await db.boosterStock.put({ boosterId: 'rarity-only', quantity: Number.MAX_SAFE_INTEGER, updatedAt: 100 })
    await expect(redeemGiftCode('EEEE-EEEE-EEEE-EEEE', db, 200)).rejects.toThrow(/incohérent/)
    expect(await db.boosterStock.count()).toBe(1)
    expect(await db.usedGiftCodes.count()).toBe(0)
  })
  it('crédite ensemble deux Memory Frame et cent fragments une seule fois', async () => {
    await db.player.update('local', { fragments: 42 })
    await redeemGiftCode('DDDD-DDDD-DDDD-DDDD', db, 200)
    expect((await db.player.get('local'))?.fragments).toBe(142)
    expect((await db.boosterStock.get('phantom-blood'))?.quantity).toBe(2)
    await expect(redeemGiftCode('DDDD-DDDD-DDDD-DDDD', db, 201)).rejects.toThrow(/déjà été utilisé/)
    expect((await db.player.get('local'))?.fragments).toBe(142)
    expect((await db.boosterStock.get('phantom-blood'))?.quantity).toBe(2)
  })
  it('accepte minuscules, espaces et tirets avec une empreinte canonique unique', async () => {
    expect(normalizeGiftCode(' aaaa-aaaa aaaa-aaaa\n')).toBe('AAAAAAAAAAAAAAAA')
    expect(await hashGiftCode('aaaa-aaaa-aaaa-aaaa')).toBe(await hashGiftCode('AAAAAAAAAAAAAAAA'))
    for (const code of ['', 'A'.repeat(15), 'A'.repeat(17), 'AAAA-AAAA-AAAA-AAA0', 'AAAA-AAAA-AAAA-AAAI', 'Ａ'.repeat(16), 'A'.repeat(129)]) expect(() => normalizeGiftCode(code)).toThrow(/16 caractères/)
  })

  it('refuse les codes inconnus ou malformés sans modifier la sauvegarde', async () => {
    const before = await db.player.get('local')
    await expect(redeemGiftCode('ZZZZ-ZZZZ-ZZZZ-ZZZZ', db)).rejects.toThrow(/invalide/)
    await expect(redeemGiftCode('invalid', db)).rejects.toThrow(/16 caractères/)
    expect(await db.player.get('local')).toEqual(before)
    expect(await db.usedGiftCodes.count()).toBe(0)
    expect(await db.boosterStock.count()).toBe(0)
  })

  it('ajoute dix Memory Frame au stock acheté sans débiter les fragments ni changer la recharge', async () => {
    await db.player.update('local', { fragments: 42, freePackStock: 3, nextFreePackAt: 123456 })
    await db.boosterStock.put({ boosterId: 'phantom-blood', quantity: 2, updatedAt: 50 })
    const before = await db.player.get('local')
    await redeemGiftCode('AAAA-AAAA-AAAA-AAAA', db, 200)
    expect(await db.boosterStock.get('phantom-blood')).toEqual({ boosterId: 'phantom-blood', quantity: 12, updatedAt: 200 })
    expect(await db.player.get('local')).toEqual({ ...before, maxObservedClockAt: 200 })
    expect(await db.boosterPurchases.count()).toBe(0)
    await expect(redeemGiftCode('aaaa aaaa aaaa aaaa', db, 201)).rejects.toThrow(/déjà été utilisé/)
    expect((await db.boosterStock.get('phantom-blood'))?.quantity).toBe(12)
  })

  it('rend Anima Isekai ouvrable depuis son stock acheté', async () => {
    await db.player.update('local', { freePackStock: 0, nextFreePackAt: 600_100 })
    await redeemGiftCode('BBBB-BBBB-BBBB-BBBB', db, 200)
    const opening = await openBooster('anima-isekai', db, 201)
    expect(opening).toMatchObject({ payment: 'shop', fragmentsSpent: 0 })
    expect(opening.results).toHaveLength(5)
    expect((await db.boosterStock.get('anima-isekai'))?.quantity).toBe(9)
    expect((await db.player.get('local'))?.freePackStock).toBe(0)
  })

  it('crédite cinq cents fragments une seule fois, même longtemps après la génération', async () => {
    await db.player.update('local', { fragments: 42 })
    await redeemGiftCode('CCCC-CCCC-CCCC-CCCC', db, Date.UTC(2050, 0, 1))
    expect((await db.player.get('local'))?.fragments).toBe(542)
    await expect(redeemGiftCode('cccccccccccccccc', db)).rejects.toThrow(/déjà été utilisé/)
    expect((await db.player.get('local'))?.fragments).toBe(542)
  })

  it('sérialise deux utilisations depuis des connexions différentes', async () => {
    const second = new BizaveDatabase(db.name)
    try {
      const results = await Promise.allSettled([redeemGiftCode('CCCC-CCCC-CCCC-CCCC', db, 200), redeemGiftCode('cccccccccccccccc', second, 200)])
      expect(results.filter(result => result.status === 'fulfilled')).toHaveLength(1)
      expect((await db.player.get('local'))?.fragments).toBe(500)
      expect(await db.usedGiftCodes.count()).toBe(1)
    } finally { second.close() }
  })

  it.each(['AAAAAAAAAAAAAAAA', 'CCCCCCCCCCCCCCCC', 'DDDDDDDDDDDDDDDD', 'EEEEEEEEEEEEEEEE', 'FFFFFFFFFFFFFFFF', 'GGGGGGGGGGGGGGGG', 'HHHHHHHHHHHHHHHH'])('annule la récompense si l’écriture du registre échoue (%s)', async code => {
    const before = await db.player.get('local')
    const fail = () => { throw new Error('Stockage plein') }
    db.usedGiftCodes.hook('creating', fail)
    await expect(redeemGiftCode(code, db, 200)).rejects.toThrow(/Stockage plein/)
    db.usedGiftCodes.hook('creating').unsubscribe(fail)
    expect(await db.player.get('local')).toEqual(before)
    expect(await db.boosterStock.count()).toBe(0)
    expect(await db.drops.count()).toBe(0)
    expect(await db.discoveries.count()).toBe(0)
    expect(await db.usedGiftCodes.count()).toBe(0)
    await expect(redeemGiftCode(code, db, 200)).resolves.toBeDefined()
  })

  it('refuse une source transférée sans ajouter de récompense', async () => {
    await db.accountState.put({ id: 'local', status: 'exported', transferId: uuid(), recipientId: '1234-56-78', file: '' })
    await expect(redeemGiftCode('AAAAAAAAAAAAAAAA', db)).rejects.toThrow(/transférée/)
    expect(await db.boosterStock.count()).toBe(0)
    expect(await db.usedGiftCodes.count()).toBe(0)
  })

  it('transfère les cadeaux et réunit les codes utilisés des deux appareils', async () => {
    const target = new BizaveDatabase('gift-recipient-' + uuid())
    try {
      await initializeDatabase(target, 100)
      await redeemGiftCode('AAAAAAAAAAAAAAAA', db, 200)
      await redeemGiftCode('CCCCCCCCCCCCCCCC', target, 200)
      const contents = await exportSave((await ensureInstallation(target)).installationId, DEFAULT_PREFERENCES, db)
      expect(await db.usedGiftCodes.count()).toBe(0)
      await expect(redeemGiftCode('AAAAAAAAAAAAAAAA', db)).rejects.toThrow(/transférée/)
      await importSave(contents, target)
      expect((await target.boosterStock.get('phantom-blood'))?.quantity).toBe(10)
      expect(await target.usedGiftCodes.count()).toBe(2)
      await expect(redeemGiftCode('AAAAAAAAAAAAAAAA', target)).rejects.toThrow(/déjà été utilisé/)
      await expect(redeemGiftCode('CCCCCCCCCCCCCCCC', target)).rejects.toThrow(/déjà été utilisé/)
      await expect(redeemGiftCode('BBBBBBBBBBBBBBBB', target)).resolves.toMatchObject({ quantity: 10 })
    } finally { await target.delete() }
  })

  it.each(['AAAAAAAAAAAAAAAA', 'CCCCCCCCCCCCCCCC', 'DDDDDDDDDDDDDDDD', 'EEEEEEEEEEEEEEEE'])('refuse un dépassement numérique sans consommer le code (%s)', async code => {
    await db.player.update('local', { fragments: Number.MAX_SAFE_INTEGER })
    await db.boosterStock.put({ boosterId: 'phantom-blood', quantity: Number.MAX_SAFE_INTEGER, updatedAt: 100 })
    await expect(redeemGiftCode(code, db)).rejects.toThrow(/incohérent/)
    expect(await db.usedGiftCodes.count()).toBe(0)
  })
})
