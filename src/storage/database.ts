import Dexie, { type Table } from 'dexie'
import type { AccountStateRow, InstallationRow, UsedSaveTransferRow } from './accountTypes'
import type { UsedGiftCodeRow } from '../gifts/types'
import type { FavoriteRow } from '../game/types'
import type { WeeklyShopRow } from '../game/weeklyShop'
import type { DailyShopRow } from '../game/dailyShop'
import type { RecycledCardRow } from '../game/types'
import type { BoosterPurchaseRow, BoosterStockRow, CardDefinition, CardDiscoveryRow, CardDropRow, FriendContactRow, LocalIdentityRow, OpenRecord, OutgoingTransferRow, PlayerStateRow, RecyclingRecord, UsedTransferRow } from '../game/types'

export const DATABASE_SCHEMA_VERSION = 13
const DATABASE_NAME = 'bizave-tcg'
export type DatabaseVersionRow = { id: 'local'; schemaVersion: number; ready: boolean }
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
  weeklyShop!: Table<WeeklyShopRow, string>
  dailyShop!: Table<DailyShopRow, string>
  accountState!: Table<AccountStateRow, string>
  usedSaveTransfers!: Table<UsedSaveTransferRow, string>
  installation!: Table<InstallationRow, string>
  usedGiftCodes!: Table<UsedGiftCodeRow, string>
  favorites!: Table<FavoriteRow, string>
  recycledCards!: Table<RecycledCardRow, string>
  versionInfo!: Table<DatabaseVersionRow, string>
  constructor(name = DATABASE_NAME) {
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
      await tx.table('player').toCollection().modify(row => { row.schemaVersion = 6 })
    })
    this.version(7).stores({ favorites: '&key, cardId' }).upgrade(async tx => {
      await tx.table('openings').filter(row => row.revealComplete === true).delete()
      await tx.table('player').toCollection().modify(row => { row.schemaVersion = 7 })
    })
    this.version(8).stores({ recycledCards: '&dropId' }).upgrade(async tx => {
      const recycled = await tx.table('drops').where('status').equals('recycled').toArray()
      // Old cards have unknown provenance: preserve their identifiers conservatively.
      await tx.table('recycledCards').bulkPut(recycled.map(row => ({ dropId: row.dropId })))
      await tx.table('drops').bulkDelete(recycled.map(row => row.dropId))
      await tx.table('recycling').clear()
      await tx.table('player').toCollection().modify(row => { row.schemaVersion = 8 })
    })
    this.version(9).stores({ version: '&id' }).upgrade(async tx => {
      await tx.table('player').toCollection().modify(row => { row.schemaVersion = 9 })
    })
    this.version(10).stores({}).upgrade(async tx => {
      await tx.table('outbox').toCollection().modify(row => { row.kind ??= 'card' })
      await tx.table('player').toCollection().modify(row => { row.schemaVersion = 10 })
      await tx.table('version').put({ id: 'local', schemaVersion: 10, ready: true })
    })
    this.version(11).stores({ weeklyShop: '&id' }).upgrade(async tx => {
      await tx.table('player').toCollection().modify(row => { row.schemaVersion = 11 })
      await tx.table('version').put({ id: 'local', schemaVersion: 11, ready: true })
    })
    // Keep the beta markers until the player confirms the release reset.
    this.version(12).stores({})
    this.version(13).stores({ dailyShop: '&id' }).upgrade(async tx => {
      // Preserve beta markers: AccountGate must still offer the release reset.
      await tx.table('player').toCollection().modify(row => { if (row.schemaVersion >= 12) row.schemaVersion = 13 })
      await tx.table('version').toCollection().modify(row => { if (row.schemaVersion >= 12) row.schemaVersion = 13 })
    })
    this.versionInfo = this.table('version')
  }
}
export const db = new BizaveDatabase()
