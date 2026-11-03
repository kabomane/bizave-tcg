import { describe, expect, it } from 'vitest'
import { assertTransferNotExpired, TRANSFER_LIFETIME_MS } from './expiry'

describe('durée de validité des transferts', () => {
  const issuedAt = 1_000_000
  it('accepte juste avant 24 h et refuse à 24 h exactement ou après 25 h', () => {
    expect(() => assertTransferNotExpired(issuedAt, issuedAt + TRANSFER_LIFETIME_MS - 1)).not.toThrow()
    expect(() => assertTransferNotExpired(issuedAt, issuedAt + TRANSFER_LIFETIME_MS)).toThrow(/expiré/)
    expect(() => assertTransferNotExpired(issuedAt, issuedAt + 25 * 60 * 60 * 1000)).toThrow(/expiré/)
  })
  it('refuse une date de création dans le futur', () => {
    expect(() => assertTransferNotExpired(issuedAt, issuedAt - 1)).toThrow(/date/)
  })
})
