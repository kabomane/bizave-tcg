export const COLLECTION_LIMITS = { text: 32_768, file: 65_536, slots: 8192, quantity: 1_000_000, total: 100_000_000 } as const
export type NumericVariant = { number: number; variant: number; quantity: number; favorite: boolean }
export type SnapshotHeader = { senderId: string; issuedAt: number; registryVersion: number; bodyMode: 0 | 1; cardSlots: number }
export type SnapshotEnvelope = SnapshotHeader & { payload: Uint8Array<ArrayBuffer>; signature: Uint8Array<ArrayBuffer>; body: Uint8Array<ArrayBuffer> }
const invalid = () => new Error('Code de collection malformé ou hors limites.')
function bounded(value: number, min: number, max: number) { if (!Number.isSafeInteger(value) || value < min || value > max) throw invalid(); return value }
export function encodeUleb(value: number): number[] {
  bounded(value, 0, 0xffffffff)
  const bytes: number[] = []
  do { const digit = value % 128; value = Math.floor(value / 128); bytes.push(digit | (value ? 128 : 0)) } while (value)
  return bytes
}
class Reader {
  offset = 0
  constructor(readonly bytes: Uint8Array) {}
  byte() { if (this.offset >= this.bytes.length) throw invalid(); return this.bytes[this.offset++] }
  uleb(max = 0xffffffff) {
    let result = 0, multiplier = 1
    for (let i = 0; i < 5; i++) {
      const byte = this.byte()
      result += (byte & 127) * multiplier
      if (result > max) throw invalid()
      if (!(byte & 128)) { if (i && byte === 0) throw invalid(); return result }
      multiplier *= 128
    }
    throw invalid()
  }
  block(length: number) { if (this.offset + length > this.bytes.length) throw invalid(); const result = this.bytes.subarray(this.offset, this.offset + length); this.offset += length; return result }
  end() { if (this.offset !== this.bytes.length) throw invalid() }
}
function padding(bytes: Uint8Array, bits: number) { if (bits % 8 && bytes.length && bytes.at(-1)! >>> (bits % 8)) throw invalid() }
function bit(bytes: Uint8Array, index: number) { return !!(bytes[index >>> 3] & (1 << (index & 7))) }
function setBit(bytes: Uint8Array, index: number) { bytes[index >>> 3] |= 1 << (index & 7) }
function validateVariants(entries: readonly NumericVariant[], slots: number) {
  bounded(slots, 1, COLLECTION_LIMITS.slots)
  let previous = -1, total = 0
  for (const entry of entries) {
    bounded(entry.number, 1, slots); bounded(entry.variant, 0, 5); bounded(entry.quantity, 1, COLLECTION_LIMITS.quantity)
    if (typeof entry.favorite !== 'boolean') throw invalid()
    const position = (entry.number - 1) * 6 + entry.variant
    if (position <= previous) throw invalid()
    previous = position; total += entry.quantity
    if (total > COLLECTION_LIMITS.total) throw invalid()
  }
}
export function encodeBody(entries: readonly NumericVariant[], slots: number, mode: 0 | 1): Uint8Array<ArrayBuffer> {
  validateVariants(entries, slots)
  if (mode === 1) {
    const result = encodeUleb(entries.length)
    let previous = 0
    for (const entry of entries) {
      result.push(...encodeUleb(entry.number - previous), (entry.variant << 5) | (entry.favorite ? 16 : 0) | Math.min(entry.quantity, 15))
      if (entry.quantity >= 15) result.push(...encodeUleb(entry.quantity))
      previous = entry.number
    }
    return new Uint8Array(result)
  }
  if (mode !== 0) throw invalid()
  const presence = new Uint8Array(Math.ceil(slots * 6 / 8)), favorites = new Uint8Array(Math.ceil(entries.length / 8))
  const extras = entries.map((entry, index) => ({ ...entry, index })).filter(entry => entry.quantity > 1)
  const quantities = encodeUleb(extras.length)
  let previous = -1
  for (const entry of extras) { quantities.push(...encodeUleb(entry.index - previous), ...encodeUleb(entry.quantity)); previous = entry.index }
  entries.forEach((entry, i) => { setBit(presence, (entry.number - 1) * 6 + entry.variant); if (entry.favorite) setBit(favorites, i) })
  return new Uint8Array([...presence, ...favorites, ...quantities])
}
export function decodeBody(bytes: Uint8Array, slots: number, mode: 0 | 1): NumericVariant[] {
  bounded(slots, 1, COLLECTION_LIMITS.slots)
  const reader = new Reader(bytes), entries: NumericVariant[] = []
  if (mode === 0) {
    const presence = reader.block(Math.ceil(slots * 6 / 8)); padding(presence, slots * 6)
    for (let position = 0; position < slots * 6; position++) if (bit(presence, position)) entries.push({ number: Math.floor(position / 6) + 1, variant: position % 6, quantity: 1, favorite: false })
    const favorites = reader.block(Math.ceil(entries.length / 8)); padding(favorites, entries.length)
    entries.forEach((entry, i) => { entry.favorite = bit(favorites, i) })
    const extraCount = reader.uleb(entries.length)
    let previous = -1
    for (let i = 0; i < extraCount; i++) {
      const delta = reader.uleb(entries.length)
      if (!delta) throw invalid()
      const index = previous + delta
      if (index >= entries.length) throw invalid()
      entries[index].quantity = bounded(reader.uleb(COLLECTION_LIMITS.quantity), 2, COLLECTION_LIMITS.quantity)
      previous = index
    }
  } else if (mode === 1) {
    const count = reader.uleb(slots * 6)
    let number = 0
    for (let i = 0; i < count; i++) {
      number += reader.uleb(slots)
      const meta = reader.byte(), variant = meta >>> 5, q = meta & 15
      if (!q) throw invalid()
      const quantity = q === 15 ? bounded(reader.uleb(COLLECTION_LIMITS.quantity), 15, COLLECTION_LIMITS.quantity) : q
      entries.push({ number, variant, quantity, favorite: !!(meta & 16) })
    }
  } else throw invalid()
  reader.end(); validateVariants(entries, slots)
  return entries
}
export function encodePayload(header: SnapshotHeader, entries: readonly NumericVariant[]): Uint8Array<ArrayBuffer> {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(header.senderId)) throw invalid()
  bounded(header.issuedAt, 0, 0xffffffff); bounded(header.registryVersion, 1, 0xffffffff)
  const digits = header.senderId.replaceAll('-', ''), bcd = Array.from({ length: 4 }, (_, i) => Number(digits[i * 2]) * 16 + Number(digits[i * 2 + 1]))
  const date = new Uint8Array(4); new DataView(date.buffer).setUint32(0, header.issuedAt, false)
  return new Uint8Array([3, ...bcd, ...date, ...encodeUleb(header.registryVersion), header.bodyMode, ...encodeUleb(header.cardSlots), ...encodeBody(entries, header.cardSlots, header.bodyMode)])
}
export function collectionBase64(bytes: Uint8Array) { return btoa(Array.from(bytes, b => String.fromCharCode(b)).join('')).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '') }
export function parseEnvelope(code: string): SnapshotEnvelope {
  if (code.length > COLLECTION_LIMITS.text || !/^CL1\.[A-Za-z0-9_-]+$/.test(code)) throw invalid()
  const encoded = code.slice(4)
  let bytes: Uint8Array<ArrayBuffer>
  try { bytes = Uint8Array.from(atob(encoded.replaceAll('-', '+').replaceAll('_', '/') + '='.repeat((4 - encoded.length % 4) % 4)), c => c.charCodeAt(0)) } catch { throw invalid() }
  if (collectionBase64(bytes) !== encoded || bytes.length < 77) throw invalid()
  const payload = bytes.slice(0, -64), signature = bytes.slice(-64), reader = new Reader(payload)
  if (reader.byte() !== 3) throw invalid()
  let digits = ''
  for (let i = 0; i < 4; i++) { const byte = reader.byte(); if ((byte >>> 4) > 9 || (byte & 15) > 9) throw invalid(); digits += `${byte >>> 4}${byte & 15}` }
  const date = reader.block(4), issuedAt = new DataView(date.buffer, date.byteOffset, 4).getUint32(0, false)
  const registryVersion = bounded(reader.uleb(), 1, 0xffffffff), bodyMode = reader.byte()
  if (bodyMode !== 0 && bodyMode !== 1) throw invalid()
  const cardSlots = bounded(reader.uleb(COLLECTION_LIMITS.slots), 1, COLLECTION_LIMITS.slots)
  return { senderId: `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`, issuedAt, registryVersion, bodyMode, cardSlots, payload, signature, body: payload.slice(reader.offset) }
}
