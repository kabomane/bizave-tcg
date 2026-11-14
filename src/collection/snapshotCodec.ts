export const COLLECTION_LIMITS = { text: 32_768, file: 65_536, slots: 8192, quantity: 1_000_000, total: 100_000_000 } as const
export type NumericVariant = { number: number; variant: number; quantity: number; favorite: boolean }
export const COLLECTION_BODY_MODES = [0, 1, 0x80, 0x81, 0x82, 0x83] as const
export type CollectionBodyMode = typeof COLLECTION_BODY_MODES[number]
export type SnapshotHeader = { senderId: string; issuedAt: number; registryVersion: number; bodyMode: CollectionBodyMode; cardSlots: number }
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
class BitWriter {
  private readonly data: number[] = []
  private offset = 0
  put(value: number, count: number) {
    for (let i = 0; i < count; i++, this.offset++) {
      const index = this.offset >>> 3
      if (!(this.offset & 7)) this.data.push(0)
      this.data[index] |= ((value >>> i) & 1) << (this.offset & 7)
    }
  }
  bytes() { return new Uint8Array(this.data) }
}
class BitReader {
  private offset = 0
  constructor(private readonly bytes: Uint8Array) {}
  bit() {
    if (this.offset >= this.bytes.length * 8) throw invalid()
    const value = (this.bytes[this.offset >>> 3] >>> (this.offset & 7)) & 1
    this.offset++
    return value
  }
  get(count: number) { let value = 0; for (let i = 0; i < count; i++) value |= this.bit() << i; return value }
  end() {
    if (this.bytes.length !== Math.ceil(this.offset / 8)) throw invalid()
    while (this.offset < this.bytes.length * 8) if (this.bit()) throw invalid()
  }
}
function riceBits(entries: readonly NumericVariant[], k: number) {
  return entries.reduce((bits, entry) => bits + ((entry.quantity - 1) >>> k) + 1 + k, 4)
}
function writeRice(writer: BitWriter, entries: readonly NumericVariant[]) {
  let k = 0, size = riceBits(entries, 0)
  for (let candidate = 1; candidate <= 15; candidate++) {
    const bits = riceBits(entries, candidate)
    if (bits < size) { k = candidate; size = bits }
  }
  writer.put(k, 4)
  for (const entry of entries) {
    const value = entry.quantity - 1
    for (let high = value >>> k; high > 0; high--) writer.put(1, 1)
    writer.put(0, 1); writer.put(value, k)
  }
}
function readRice(reader: BitReader, entries: NumericVariant[]) {
  const k = reader.get(4), unit = 2 ** k
  let total = 0
  for (const entry of entries) {
    let high = 0
    while (reader.bit()) { high++; if (high * unit > COLLECTION_LIMITS.quantity - 1) throw invalid() }
    entry.quantity = bounded(high * unit + reader.get(k) + 1, 1, COLLECTION_LIMITS.quantity)
    total += entry.quantity
    if (total > COLLECTION_LIMITS.total) throw invalid()
  }
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
function encodeRiceBody(entries: readonly NumericVariant[], slots: number, mode: CollectionBodyMode): Uint8Array<ArrayBuffer> {
  const writer = new BitWriter(), prefix: number[] = []
  if (mode === 0x80) {
    const presence = new Uint8Array(Math.ceil(slots * 6 / 8)), favorites = new Uint8Array(Math.ceil(entries.length / 8))
    entries.forEach((entry, i) => { setBit(presence, (entry.number - 1) * 6 + entry.variant); if (entry.favorite) setBit(favorites, i) })
    writeRice(writer, entries)
    return new Uint8Array([...presence, ...favorites, ...writer.bytes()])
  } else if (mode === 0x81) {
    prefix.push(...encodeUleb(entries.length))
    let previous = 0
    for (const entry of entries) { prefix.push(...encodeUleb(entry.number - previous)); previous = entry.number }
    for (const entry of entries) { writer.put(entry.variant, 3); writer.put(entry.favorite ? 1 : 0, 1) }
  } else if (mode === 0x82) {
    const masks = new Uint8Array(slots)
    for (const entry of entries) masks[entry.number - 1] |= 1 << entry.variant
    for (const mask of masks) writer.put(mask ? 1 : 0, 1)
    for (const mask of masks) {
      if (!mask) continue
      writer.put(mask === 1 ? 1 : 0, 1)
      if (mask !== 1) writer.put(mask, 6)
    }
    for (const entry of entries) writer.put(entry.favorite ? 1 : 0, 1)
  } else if (mode === 0x83) {
    prefix.push(...encodeUleb(slots * 6 - entries.length))
    let index = 0, previous = -1
    for (let position = 0; position < slots * 6; position++) {
      const entry = entries[index]
      if (entry && position === (entry.number - 1) * 6 + entry.variant) { index++; continue }
      prefix.push(...encodeUleb(position - previous)); previous = position
    }
    for (const entry of entries) writer.put(entry.favorite ? 1 : 0, 1)
  } else throw invalid()
  writeRice(writer, entries)
  return new Uint8Array([...prefix, ...writer.bytes()])
}
function decodeRiceBody(bytes: Uint8Array, slots: number, mode: CollectionBodyMode): NumericVariant[] {
  const reader = new Reader(bytes), entries: NumericVariant[] = []
  let bits: BitReader
  if (mode === 0x80) {
    const presence = reader.block(Math.ceil(slots * 6 / 8)); padding(presence, slots * 6)
    for (let position = 0; position < slots * 6; position++) if (bit(presence, position)) entries.push({ number: Math.floor(position / 6) + 1, variant: position % 6, quantity: 1, favorite: false })
    const favorites = reader.block(Math.ceil(entries.length / 8)); padding(favorites, entries.length)
    entries.forEach((entry, i) => { entry.favorite = bit(favorites, i) })
    bits = new BitReader(bytes.subarray(reader.offset))
  } else if (mode === 0x81) {
    const count = reader.uleb(slots * 6)
    let number = 0
    for (let i = 0; i < count; i++) {
      number = bounded(number + reader.uleb(slots), 1, slots)
      entries.push({ number, variant: 0, quantity: 1, favorite: false })
    }
    bits = new BitReader(bytes.subarray(reader.offset))
    for (const entry of entries) { entry.variant = bits.get(3); entry.favorite = !!bits.bit() }
  } else if (mode === 0x82) {
    bits = new BitReader(bytes)
    const cards: number[] = []
    for (let number = 1; number <= slots; number++) if (bits.bit()) cards.push(number)
    for (const number of cards) {
      let mask = 1
      if (!bits.bit()) { mask = bits.get(6); if (mask === 0 || mask === 1) throw invalid() }
      for (let variant = 0; variant < 6; variant++) if (mask & (1 << variant)) entries.push({ number, variant, quantity: 1, favorite: false })
    }
    for (const entry of entries) entry.favorite = !!bits.bit()
  } else if (mode === 0x83) {
    const total = slots * 6, count = reader.uleb(total), missing = new Set<number>()
    let previous = -1
    for (let i = 0; i < count; i++) {
      const gap = reader.uleb(total)
      if (!gap) throw invalid()
      previous += gap
      if (previous >= total) throw invalid()
      missing.add(previous)
    }
    for (let position = 0; position < total; position++) if (!missing.has(position)) entries.push({ number: Math.floor(position / 6) + 1, variant: position % 6, quantity: 1, favorite: false })
    bits = new BitReader(bytes.subarray(reader.offset))
    for (const entry of entries) entry.favorite = !!bits.bit()
  } else throw invalid()
  readRice(bits, entries); bits.end(); validateVariants(entries, slots)
  return entries
}
export function encodeBody(entries: readonly NumericVariant[], slots: number, mode: CollectionBodyMode): Uint8Array<ArrayBuffer> {
  validateVariants(entries, slots)
  if (mode >= 0x80) return encodeRiceBody(entries, slots, mode)
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
export function decodeBody(bytes: Uint8Array, slots: number, mode: CollectionBodyMode): NumericVariant[] {
  bounded(slots, 1, COLLECTION_LIMITS.slots)
  if (mode >= 0x80) return decodeRiceBody(bytes, slots, mode)
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
  if (!isBodyMode(bodyMode)) throw invalid()
  const cardSlots = bounded(reader.uleb(COLLECTION_LIMITS.slots), 1, COLLECTION_LIMITS.slots)
  return { senderId: `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`, issuedAt, registryVersion, bodyMode, cardSlots, payload, signature, body: payload.slice(reader.offset) }
}
function isBodyMode(value: number): value is CollectionBodyMode { return COLLECTION_BODY_MODES.some(mode => mode === value) }
