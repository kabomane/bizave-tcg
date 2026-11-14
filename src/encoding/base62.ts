const ALPHABET = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const BLOCK_BYTES = 32
const BLOCK_CHARACTERS = 43
const widths = Array.from({ length: BLOCK_BYTES + 1 }, (_, size) => Math.ceil(size * 8 / Math.log2(62)))

// Fixed-width blocks preserve leading zero bytes and bound conversion work for
// large collections. Only small integer arithmetic is needed in every browser.
export function base62(bytes: Uint8Array): string {
  const blocks: string[] = []
  for (let offset = 0; offset < bytes.length; offset += BLOCK_BYTES) {
    const size = Math.min(BLOCK_BYTES, bytes.length - offset), digits: number[] = []
    for (let i = 0; i < size; i++) {
      let carry = bytes[offset + i]
      for (let j = 0; j < digits.length; j++) {
        carry += digits[j] * 256
        digits[j] = carry % 62
        carry = Math.floor(carry / 62)
      }
      while (carry) { digits.push(carry % 62); carry = Math.floor(carry / 62) }
    }
    blocks.push(digits.reverse().map(digit => ALPHABET[digit]).join('').padStart(widths[size], '0'))
  }
  return blocks.join('')
}

export function unbase62(value: string): Uint8Array<ArrayBuffer> {
  const remainder = value.length % BLOCK_CHARACTERS
  const tailBytes = remainder ? widths.indexOf(remainder) : 0
  if (tailBytes < 0 || /[^A-Za-z0-9]/.test(value)) throw new Error('Encodage du code invalide.')
  const bytes = new Uint8Array(Math.floor(value.length / BLOCK_CHARACTERS) * BLOCK_BYTES + tailBytes)
  for (let offset = 0, start = 0; start < value.length; offset += BLOCK_BYTES, start += BLOCK_CHARACTERS) {
    const size = Math.min(BLOCK_BYTES, bytes.length - offset)
    const end = Math.min(start + BLOCK_CHARACTERS, value.length)
    for (let i = start; i < end; i++) {
      let carry = ALPHABET.indexOf(value[i])
      for (let j = offset + size - 1; j >= offset; j--) {
        carry += bytes[j] * 62
        bytes[j] = carry & 255
        carry = Math.floor(carry / 256)
      }
      if (carry) throw new Error('Encodage du code invalide.')
    }
  }
  return bytes
}
