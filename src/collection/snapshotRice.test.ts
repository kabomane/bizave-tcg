import { expect, it } from 'vitest'
import { COLLECTION_BODY_MODES, decodeBody, encodeBody, encodePayload, collectionBase64, parseEnvelope, type CollectionBodyMode, type NumericVariant } from './snapshotCodec'

const hex = (value: string) => Uint8Array.from(value.split(' '), byte => parseInt(byte, 16))
const sample: NumericVariant[] = [
  { number: 1, variant: 0, quantity: 2, favorite: false },
  { number: 3, variant: 0, quantity: 1, favorite: false },
  { number: 3, variant: 1, quantity: 1, favorite: false },
  { number: 5, variant: 3, quantity: 1, favorite: true },
]
const vectors: readonly [CollectionBodyMode, string][] = [
  [0, '01 30 00 08 08 01 01 02'],
  [1, '04 01 02 02 01 00 21 02 71'],
  [0x80, '01 30 00 08 08 10 00'],
  [0x81, '04 01 02 00 02 00 b1 10 00'],
  [0x82, 'b5 01 82 10 00'],
  // Corrected document vector: the final "29" was an extra byte, not body data.
  [0x83, '1a 02 01 01 01 01 01 01 01 01 01 01 03 01 01 01 01 01 01 01 01 01 01 01 01 02 01 08 01'],
]
it.each(vectors)('verrouille le vecteur indépendant de mode %i', (mode, bytes) => {
  expect(encodeBody(sample, 5, mode)).toEqual(hex(bytes))
  expect(decodeBody(hex(bytes), 5, mode)).toEqual(sample)
})
it('verrouille Rice avec k = 2', () => {
  const entries = [{ number: 2, variant: 0, quantity: 10, favorite: false }, { number: 2, variant: 3, quantity: 3, favorite: false }, { number: 4, variant: 0, quantity: 7, favorite: true }]
  expect(encodeBody(entries, 5, 0x82)).toEqual(hex('4a 92 b2 98'))
  expect(decodeBody(hex('4a 92 b2 98'), 5, 0x82)).toEqual(entries)
})
it.each([
  [0, 'ff ff 01 01 00 00 01 01 03'],
  [0x80, 'ff ff 01 01 00 00 30 00 00'],
  [0x82, 'f7 fb 7d 01 00 60 00 00'],
  [0x83, '01 12 01 00 60 00 00'],
] as const)('verrouille le vecteur presque complet de mode %i', (mode, bytes) => {
  const entries = Array.from({ length: 17 }, (_, i) => ({ number: Math.floor(i / 6) + 1, variant: i % 6, quantity: i ? 1 : 3, favorite: i === 0 }))
  expect(encodeBody(entries, 3, mode)).toEqual(hex(bytes))
  expect(decodeBody(hex(bytes), 3, mode)).toEqual(entries)
})
it('restitue 300 collections déterministes de toutes densités dans les six formats', () => {
  let seed = 0x5eed1234
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 2 ** 32 }
  for (let run = 0; run < 300; run++) {
    const slots = 1 + Math.floor(random() * 60), density = [0, 0.005, 0.1, 0.5, 0.9, 0.99, 1][run % 7]
    const entries: NumericVariant[] = []
    for (let p = 0; p < slots * 6; p++) if (random() < density) entries.push({ number: Math.floor(p / 6) + 1, variant: p % 6, quantity: run % 3 ? 1 + Math.floor(random() * 5000) : 1, favorite: random() < 0.2 })
    for (const mode of COLLECTION_BODY_MODES) {
      const bytes = encodeBody(entries, slots, mode)
      expect(decodeBody(bytes, slots, mode)).toEqual(entries)
      expect(encodeBody(entries, slots, mode)).toEqual(bytes)
    }
  }
})
it.each(COLLECTION_BODY_MODES)('restitue les limites de registre et de total en mode %i', mode => {
  const all = Array.from({ length: 8192 * 6 }, (_, p) => ({ number: Math.floor(p / 6) + 1, variant: p % 6, quantity: 1, favorite: p % 2 === 0 }))
  expect(decodeBody(encodeBody(all, 8192, mode), 8192, mode)).toEqual(all)
  const maxTotal = Array.from({ length: 100 }, (_, p) => ({ ...all[p], quantity: 1_000_000 }))
  expect(decodeBody(encodeBody(maxTotal, 8192, mode), 8192, mode)).toEqual(maxTotal)
})
it.each(COLLECTION_BODY_MODES)('accepte l’enveloppe du mode %i', bodyMode => {
  const payload = encodePayload({ senderId: '1234-56-78', issuedAt: 1, registryVersion: 1, cardSlots: 5, bodyMode }, sample)
  const code = 'CL1.' + collectionBase64(new Uint8Array([...payload, ...new Uint8Array(64)]))
  expect(parseEnvelope(code).bodyMode).toBe(bodyMode)
})
it.each([2, 3, 0x7f, 0x84, 0xff])('refuse le mode inconnu %i', bodyMode => {
  const payload = encodePayload({ senderId: '1234-56-78', issuedAt: 1, registryVersion: 1, cardSlots: 5, bodyMode: 0 }, sample)
  payload[10] = bodyMode
  expect(() => parseEnvelope('CL1.' + collectionBase64(new Uint8Array([...payload, ...new Uint8Array(64)])))).toThrow('malformé')
})

// The string lists bits in wire order (least significant bit first).
function packed(bits: string) {
  const bytes = new Uint8Array(Math.ceil(bits.length / 8))
  for (let i = 0; i < bits.length; i++) if (bits[i] === '1') bytes[i >>> 3] |= 1 << (i & 7)
  return bytes
}
it.each([
  [0x80, '81 00 00'], // Presence padding.
  [0x80, '01 80 00'], // Favorite padding.
  [0x80, '01 00 80'], // Rice padding.
  [0x81, '01 01 06 00'], [0x81, '01 01 07 00'], // Variants 6 and 7.
  [0x81, '02 01 00 00 00'], // Repeated variant.
  [0x81, '02 01 00 01 00'], // Variants out of order.
  [0x81, '01 00 00 00'], [0x81, '01 02 00 00'], // Card 0 / out of range.
  [0x81, '07'], [0x81, '80 00'], // Excess count / overlong ULEB.
  [0x82, '01 00'], // Empty mask for an owned card.
  [0x82, '05 00'], // Mask 1 must use the shortcut.
  [0x82, '80'], // Empty collection with nonzero padding.
  [0x83, '07'], [0x83, '01 00'], [0x83, '01 07'], // Excess count / zero gap / outside grid.
  [0x83, '02 06 01'], // Cumulative position outside grid.
  [0x83, '80 00'], [0x83, '01 81 00'], [0x83, '01 80'], // Noncanonical / truncated ULEB.
] as const)('refuse le corps hostile de mode %i : %s', (mode, bytes) => {
  expect(() => decodeBody(hex(bytes), 1, mode)).toThrow('malformé')
})
it.each(vectors.filter(([mode]) => mode >= 0x80))('refuse les octets superflus et troncatures en mode %i', (mode, bytes) => {
  const valid = hex(bytes)
  expect(() => decodeBody(new Uint8Array([...valid, 0]), 5, mode)).toThrow('malformé')
  for (let length = 0; length < valid.length; length++) expect(() => decodeBody(valid.slice(0, length), 5, mode)).toThrow('malformé')
})
it('refuse une série unaire et un reste Rice dépassant la quantité maximale', () => {
  // k=15, high=31 already exceeds the limit; high=30 with remainder 32767 does too.
  for (const rice of ['1111' + '1'.repeat(31), '1111' + '1'.repeat(30) + '0' + '1'.repeat(15)]) {
    expect(() => decodeBody(new Uint8Array([1, 0, ...packed(rice)]), 1, 0x80)).toThrow('malformé')
  }
})
it('refuse un total décodé supérieur à 100 millions', () => {
  const entries = Array.from({ length: 101 }, (_, p) => ({ number: Math.floor(p / 6) + 1, variant: p % 6, quantity: 1, favorite: false }))
  const prefix = encodeBody(entries, 17, 0x80).slice(0, 13 + 13)
  const low = (999_999 % 32768).toString(2).padStart(15, '0').split('').reverse().join('')
  const rice = packed('1111' + ('1'.repeat(30) + '0' + low).repeat(101))
  expect(() => decodeBody(new Uint8Array([...prefix, ...rice]), 17, 0x80)).toThrow('malformé')
})
it('accepte un k valide non optimal et choisit le plus petit k en cas d’égalité', () => {
  expect(decodeBody(hex('01 00 01'), 1, 0x80)).toEqual([{ number: 1, variant: 0, quantity: 1, favorite: false }])
  const entry = [{ number: 1, variant: 0, quantity: 2, favorite: false }]
  expect(encodeBody(entry, 1, 0x80)).toEqual(hex('01 00 10'))
})
