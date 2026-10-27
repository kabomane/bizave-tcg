export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'
export type Finish = 'normal' | 'glossy' | 'alternative'
export type ArtVariant = 'standard' | 'fullArt'
export type CardDefinition = {
  id: string; title: string; description: string; rarity: Rarity; collectionId: string
  artwork: { standard: string; fullArt: string }; artworkPosition?: Partial<Record<ArtVariant, string>>; weight?: number
}
type CardPoolSource =
  | { type: 'collection'; collectionId: string; excludeCardIds?: string[]; multiplier?: number }
  | { type: 'cards'; cardIds: string[]; multiplier?: number }
type BoosterShopOffer = { price: number; listed?: boolean }
export type BoosterDefinition = {
  id: string; title: string; subtitle: string; description: string
  artwork: { symbol: 'spark' | 'moon' | 'bloom'; colors: { primary: string; secondary: string; shine: string; glow: string } }
  access: { type: 'free'; shop?: BoosterShopOffer } | ({ type: 'shop' } & BoosterShopOffer)
  cardsPerPack: number; sources: CardPoolSource[]; enabled: boolean; order: number
}
export type Card = { dropId: string; cardId: string; finish: Finish; artVariant: ArtVariant }
export type CardDropRow = Card & { status: 'owned' | 'outgoing' | 'recycled'; acquiredAt: number; updatedAt: number }
export type CardDiscoveryRow = Omit<Card, 'dropId'> & { key: string; firstDiscoveredAt: number }
export type PlayerStateRow = {
  id: 'local'; fragments: number; freePackStock: number; nextFreePackAt: number | null
  maxObservedClockAt: number; schemaVersion: number
}
export type OpenRecord = {
  id: string; boosterId: string; boosterTitle?: string; openedAt: number; payment: 'free' | 'fragments' | 'shop'
  fragmentsSpent: number; results: Card[]; revealComplete: boolean; revealedCount: number
}
export type BoosterStockRow = { boosterId: string; quantity: number; updatedAt: number }
export type BoosterPurchaseRow = { id: string; boosterId: string; boosterTitle: string; unitPrice: number; fragmentsSpent: number; createdAt: number }
export type RecyclingRecord = { id: string; createdAt: number; dropIds: string[]; fragmentsGained: number }
export type LocalIdentityRow = {
  id: 'local'; playerUuid: string; signingPrivateKey: CryptoKey; signingPublicJwk: JsonWebKey
  createdAt: number
}
export type FriendContactRow = {
  playerUuid: string; signingPublicJwk: JsonWebKey
  fingerprint: string; label?: string; addedAt: number
}
export type TransferPayload = Card & { version: 2; transferId: string; senderId: string; recipientId: string; issuedAt: number }
export type OutgoingTransferRow = { transferId: string; dropId: string; recipientId: string; recipientLabel?: string; code: string; createdAt: number; status: 'generated' }
export type UsedTransferRow = { transferId: string; receivedAt: number }
