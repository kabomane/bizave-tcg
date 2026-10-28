import Dexie, { type Table } from 'dexie'
import type { AccountStateRow, InstallationRow, UsedSaveTransferRow } from './accountTypes'
import type { UsedGiftCodeRow } from '../gifts/types'
import type { BoosterPurchaseRow, BoosterStockRow, CardDefinition, CardDiscoveryRow, CardDropRow, FriendContactRow, LocalIdentityRow, OpenRecord, OutgoingTransferRow, PlayerStateRow, RecyclingRecord, UsedTransferRow } from '../game/types'

export const DATABASE_SCHEMA_VERSION = 6
export class BizaveDatabase extends Dexie {
  drops!: Table<CardDropRow, string>
  discoveries!: Table<CardDiscoveryRow, string>
  player!: Table<PlayerStateRow, string>
  openings!: Table<OpenRecord, string>
  recycling!: Table<RecyclingRecord, string>
  identity!: Table<LocalIdentityRow, string>
  friends!: Table<FriendContactRow, string>
  outbox!: Table<OutgoingTransferRow, string>
  usedTransfers!: Table<UsedTransferRow, string>
  definitions!: Table<CardDefinition, string>
  boosterStock!: Table<BoosterStockRow, string>
  boosterPurchases!: Table<BoosterPurchaseRow, string>
  accountState!: Table<AccountStateRow, string>
  usedSaveTransfers!: Table<UsedSaveTransferRow, string>
  installation!: Table<InstallationRow, string>
  usedGiftCodes!: Table<UsedGiftCodeRow, string>
  constructor(name = 'bizave-tcg-v2') {
    super(name)
    this.version(1).stores({
      drops: '&dropId, cardId, [cardId+finish+artVariant], finish, artVariant, status',
      discoveries: '&key, cardId, [cardId+finish+artVariant], artVariant',
      player: '&id', openings: '&id, openedAt, boosterId', recycling: '&id, createdAt',
      identity: '&id', friends: '&playerUuid', outbox: '&transferId, dropId, createdAt', usedTransfers: '&transferId', definitions: '&id',
    })
    this.version(2).stores({}).upgrade(async tx => {
      await tx.table('drops').toCollection().modify(row => { row.artVariant ??= 'standard' })
      const discoveries = await tx.table('discoveries').toArray()
      await tx.table('discoveries').clear()
      const repaired = new Map()
      for (const d of discoveries) {
        d.artVariant ??= 'standard'; d.key = `${d.cardId}::${d.finish}::${d.artVariant}`
        if (!repaired.has(d.key) || d.firstDiscoveredAt < repaired.get(d.key).firstDiscoveredAt) repaired.set(d.key, d)
      }
      await tx.table('discoveries').bulkPut([...repaired.values()])
      await tx.table('openings').toCollection().modify(row => {
        row.results = row.results.map((card: CardDropRow) => ({ ...card, artVariant: card.artVariant ?? 'standard' }))
        row.revealedCount ??= row.revealComplete ? row.results.length : 0
      })
      await tx.table('player').toCollection().modify(row => { row.schemaVersion = 2 })
    })
    this.version(3).stores({ boosterStock: '&boosterId', boosterPurchases: '&id, boosterId, createdAt' }).upgrade(async tx => {
      await tx.table('player').toCollection().modify(row => { row.schemaVersion = 3 })
    })
    this.version(4).stores({ accountState: '&id', usedSaveTransfers: '&transferId' }).upgrade(async tx => {
      await tx.table('player').toCollection().modify(row => { row.schemaVersion = 4 })
    })
    this.version(5).stores({ installation: '&id' }).upgrade(async tx => {
      await tx.table('player').toCollection().modify(row => { row.schemaVersion = 5 })
    })
    this.version(6).stores({ usedGiftCodes: '&codeHash' }).upgrade(async tx => {
      await tx.table('player').toCollection().modify(row => { row.schemaVersion = DATABASE_SCHEMA_VERSION })
    })
  }
}
export const db = new BizaveDatabase()
