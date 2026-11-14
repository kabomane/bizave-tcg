import { describe, expect, it } from 'vitest'
import { COLLECTION_LIMITS, collectionBase64, decodeBody, encodeBody, encodePayload, encodeUleb, parseEnvelope, type NumericVariant } from './snapshotCodec'

const header = { senderId: '1234-56-78', issuedAt: 1_700_000_000, registryVersion: 1, bodyMode: 0 as const, cardSlots: 1 }
const code = (payload: Uint8Array) => 'CL1.' + collectionBase64(new Uint8Array([...payload, ...new Uint8Array(64)]))
const entries: NumericVariant[] = Array.from({ length: 6 }, (_, variant) => ({ number: 1, variant, quantity: [1, 2, 14, 15, 16, 1_000_000][variant], favorite: variant % 2 === 0 }))
describe.each([0, 1] as const)('codec de collection mode %i', mode => {
  it.each([[], entries, Array.from({ length: 4000 }, (_, i) => ({ number: Math.floor(i / 6) + 1, variant: i % 6, quantity: i % 100 + 1, favorite: i % 7 === 0 }))].map(variants => ({ variants })))('restitue les variantes agrégées', ({ variants }) => {
    const slots = 800
    const body = encodeBody(variants, slots, mode)
    expect(decodeBody(body, slots, mode)).toEqual(variants)
    expect(encodeBody(variants, slots, mode)).toEqual(body)
    expect(() => decodeBody(new Uint8Array([...body, 0]), slots, mode)).toThrow()
    if (body.length) expect(() => decodeBody(body.slice(0, -1), slots, mode)).toThrow()
  })
  it.each([1, 2, 14, 15, 16, 99, 100, 255, 256, 1_000_000])('restitue la quantité %i', quantity => {
    const variants = [{ ...entries[0], quantity }]
    expect(decodeBody(encodeBody(variants, 1, mode), 1, mode)).toEqual(variants)
  })
  it('rejette les limites et les doublons à l’encodage', () => {
    for (const variants of [[entries[0], entries[0]], [{ ...entries[0], quantity: 0 }], [{ ...entries[0], quantity: 1_000_001 }], [{ ...entries[0], variant: 6 }], [{ ...entries[0], number: 0 }]]) expect(() => encodeBody(variants, 1, mode)).toThrow()
    const tooMany = Array.from({ length: 101 }, (_, i) => ({ number: Math.floor(i / 6) + 1, variant: i % 6, quantity: 1_000_000, favorite: false }))
    expect(() => encodeBody(tooMany, 100, mode)).toThrow()
  })
})
it('verrouille un vecteur binaire v3 indépendant', () => {
  const payload = encodePayload(header, [{ ...entries[0], quantity: 2 }])
  expect(Array.from(payload, b => b.toString(16).padStart(2, '0')).join('')).toBe('03123456786553f1000100010101010102')
  expect(parseEnvelope(code(payload))).toMatchObject(header)
  expect(parseEnvelope(code(payload)).body).toEqual(new Uint8Array([1, 1, 1, 1, 2]))
})
it.each([
  [0x81, 0, 0, 0], // padding presence non nul
  [1, 0x81, 0], // padding favoris non nul
  [1, 0, 1, 0, 2], // delta nul
  [1, 0, 1, 2, 2], // index hors limites
  [1, 0, 1, 1, 0], [1, 0, 1, 1, 1],
  [1, 0, 0x80, 0], // ULEB surlong
  [1, 0, 1, 1, 0x80], // ULEB tronqué
])('rejette un corps bitmap hostile %j', (...bytes) => { expect(() => decodeBody(new Uint8Array(bytes), 1, 0)).toThrow() })
it.each([
  [1, 0, 1], [1, 1, 0], [1, 1, 0xc1], [1, 1, 0xe1],
  [1, 1, 15, 14], [2, 1, 1, 0, 1], [2, 1, 33, 0, 1],
  [1, 2, 1], [0x80, 0], [7],
])('rejette une liste différentielle hostile %j', (...bytes) => { expect(() => decodeBody(new Uint8Array(bytes), 1, 1)).toThrow() })
it('rejette en-tête, BCD, mode, version et Base64 non canoniques', () => {
  const payload = encodePayload(header, [])
  for (const [index, value] of [[0, 2], [1, 0xaf], [10, 2], [11, 0]]) {
    const changed = payload.slice(); changed[index] = value
    expect(() => parseEnvelope(code(changed))).toThrow()
  }
  for (const text of ['CL1.', code(payload) + '=', code(payload) + ' ', 'CL1.' + 'A'.repeat(COLLECTION_LIMITS.text), 'TR2.abc']) expect(() => parseEnvelope(text)).toThrow()
  expect(() => parseEnvelope(code(payload).slice(0, 30))).toThrow()
  expect(encodeUleb(0xffffffff)).toEqual([255, 255, 255, 255, 15])
})
