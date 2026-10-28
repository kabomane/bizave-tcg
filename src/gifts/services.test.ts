import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { BizaveDatabase } from '../storage/database'
import { initializeDatabase, openBooster } from '../storage/services'
import { exportSave, importSave } from '../storage/saveTransfer'
import { ensureInstallation } from '../storage/installation'
import { DEFAULT_PREFERENCES } from '../settings/preferences'
import { uuid } from '../game/engine'
import { hashGiftCode, normalizeGiftCode } from './format'
import { redeemGiftCode } from './services'

// Fictional test codes: none of these are present in the published catalogue.
vi.mock('./catalogue', async () => {
  const { hashGiftCode } = await import('./format')
  const rewards = [
    { code: 'AAAAAAAAAAAAAAAA', reward: { type: 'booster', boosterId: 'phantom-blood', quantity: 10 } },
    { code: 'BBBBBBBBBBBBBBBB', reward: { type: 'booster', boosterId: 'anima-isekai', quantity: 10 } },
    { code: 'CCCCCCCCCCCCCCCC', reward: { type: 'fragments', amount: 500 } },
  ]
  return { giftCodeByHash: new Map(await Promise.all(rewards.map(async gift => { const codeHash = await hashGiftCode(gift.code); return [codeHash, { codeHash, reward: gift.reward }] as const }))) }
})

let db: BizaveDatabase
beforeEach(async () => { db = new BizaveDatabase('gifts-' + uuid()); await initializeDatabase(db, 100) })
afterEach(async () => { vi.restoreAllMocks(); await db.delete() })

describe('codes cadeaux hors ligne', () => {
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
    await redeemGiftCode('BBBB-BBBB-BBBB-BBBB', db, 200)
    const opening = await openBooster('anima-isekai', db, 201)
    expect(opening).toMatchObject({ payment: 'shop', fragmentsSpent: 0 })
    expect(opening.results).toHaveLength(5)
    expect((await db.boosterStock.get('anima-isekai'))?.quantity).toBe(9)
    expect((await db.player.get('local'))?.freePackStock).toBe(5)
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

  it.each(['AAAAAAAAAAAAAAAA', 'CCCCCCCCCCCCCCCC'])('annule la récompense si l’écriture du registre échoue (%s)', async code => {
    const before = await db.player.get('local')
    const fail = () => { throw new Error('Stockage plein') }
    db.usedGiftCodes.hook('creating', fail)
    await expect(redeemGiftCode(code, db, 200)).rejects.toThrow(/Stockage plein/)
    db.usedGiftCodes.hook('creating').unsubscribe(fail)
    expect(await db.player.get('local')).toEqual(before)
    expect(await db.boosterStock.count()).toBe(0)
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

  it.each(['AAAAAAAAAAAAAAAA', 'CCCCCCCCCCCCCCCC'])('refuse un dépassement numérique sans consommer le code (%s)', async code => {
    await db.player.update('local', { fragments: Number.MAX_SAFE_INTEGER })
    await db.boosterStock.put({ boosterId: 'phantom-blood', quantity: Number.MAX_SAFE_INTEGER, updatedAt: 100 })
    await expect(redeemGiftCode(code, db)).rejects.toThrow(/incohérent/)
    expect(await db.usedGiftCodes.count()).toBe(0)
  })
})
