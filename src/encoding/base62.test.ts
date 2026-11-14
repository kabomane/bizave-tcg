import { describe, expect, it } from 'vitest'
import { base62, unbase62 } from './base62'
import { decodeShareCode, encodeShareCode, isShareCode, SHARE_CODE_PREFIX } from './shareCode'

describe('Base62 par blocs de 32 octets', () => {
  it('verrouille les vecteurs indépendants et les zéros initiaux', () => {
    for (const [hex, expected] of [['', ''], ['00', '00'], ['01', '01'], ['3d', '0z'], ['3e', '10'], ['ff', '47'], ['0000', '000'], ['0100', '048'], ['ffff', 'H31']]) {
      const bytes = Uint8Array.from(hex.match(/../g) ?? [], byte => parseInt(byte, 16))
      expect(base62(bytes)).toBe(expected)
      expect(unbase62(expected)).toEqual(bytes)
    }
    // BigInt is only an independent test oracle, never part of the browser codec.
    for (let length = 1; length <= 32; length++) {
      const bytes = Uint8Array.from({ length }, (_, i) => (i * 73 + length) & 255)
      let number = BigInt('0x' + Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')), expected = ''
      const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
      do { expected = alphabet[Number(number % 62n)] + expected; number /= 62n } while (number)
      expect(base62(bytes)).toBe(expected.padStart(Math.ceil(length * 8 / Math.log2(62)), '0'))
    }
  })
  it('restitue tous les octets, les limites de blocs et une collection maximale', () => {
    for (const length of [...Array.from({ length: 130 }, (_, i) => i), 255, 256, 1024, 24_382]) {
      for (const fill of [0, 255, -1]) {
        const bytes = Uint8Array.from({ length }, (_, i) => fill < 0 ? (i * 73 + Math.floor(i / 256)) & 255 : fill)
        const encoded = base62(bytes)
        expect(encoded).not.toMatch(/[^A-Za-z0-9]/)
        expect(unbase62(encoded)).toEqual(bytes)
        expect(base62(unbase62(encoded))).toBe(encoded)
      }
    }
  })
  it('refuse les longueurs impossibles, dépassements et caractères altérés', () => {
    for (const code of ['0', '0000', '00000000', 'zz', 'zzz', 'z'.repeat(43), '0'.repeat(43) + 'z', '0_', '0-', '0=', '00\n', '00 ', 'é0', '０0', '0\u200b0']) expect(() => unbase62(code)).toThrow()
  })
  it('conserve une taille proche du Base64 sans dépendre du contenu', () => {
    const bytes = new Uint8Array(24_382)
    expect(base62(bytes)).toHaveLength(32_764)
    expect(base62(bytes).length).toBeLessThan(Math.ceil(bytes.length * 4 / 3) * 1.009)
  })
})

it.each(Object.values(SHARE_CODE_PREFIX))('valide strictement le préfixe %s et les limites avant décodage', prefix => {
  const code = encodeShareCode(prefix, new Uint8Array([0, 1, 255]))
  expect(decodeShareCode(code, prefix, code.length)).toEqual(new Uint8Array([0, 1, 255]))
  for (const invalid of [null, `${prefix}.`, code + '\n', code + '_', code + '-', code + '=', code + ' ', 'OLD.' + code.slice(4)]) {
    expect(isShareCode(invalid, prefix, 100)).toBe(false)
    if (typeof invalid === 'string') expect(() => decodeShareCode(invalid, prefix, 100)).toThrow()
  }
  expect(() => decodeShareCode(code, prefix, code.length - 1)).toThrow()
})
