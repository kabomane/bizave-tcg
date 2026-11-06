import { expect, it } from 'vitest'
import { BizaveDatabase } from '../database'
import { buyBooster, initializeDatabase } from '../services'
import { uuid } from '../../game/engine'

it('nettoie les anciens achats au démarrage sans changer le solde ni les boosters détenus', async () => {
  const db = new BizaveDatabase('purchase-patch-' + uuid())
  try {
    await initializeDatabase(db, 0)
    await db.player.update('local', { fragments: 140 })
    await db.boosterStock.put({ boosterId: 'phantom-blood', quantity: 3, updatedAt: 0 })
    await db.boosterPurchases.add({ id: uuid(), boosterId: 'phantom-blood', boosterTitle: 'Memory Frame', unitPrice: 70, fragmentsSpent: 70, createdAt: 0 })
    await initializeDatabase(db, 0); await initializeDatabase(db, 0)
    expect(await db.boosterPurchases.count()).toBe(0)
    expect((await db.boosterStock.get('phantom-blood'))?.quantity).toBe(3)
    expect((await db.player.get('local'))?.fragments).toBe(140)
    await buyBooster('phantom-blood', db, 0)
    expect(await db.boosterPurchases.count()).toBe(0)
    expect((await db.boosterStock.get('phantom-blood'))?.quantity).toBe(4)
    expect((await db.player.get('local'))?.fragments).toBe(70)
  } finally { await db.delete() }
})
