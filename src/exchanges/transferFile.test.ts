import { describe, expect, it } from 'vitest'
import { MAX_TRANSFER_FILE_BYTES, parseTransferFile, readTransferFile, serializeTransferFile } from './transferFile'

describe('conteneur .btcg', () => {
  it('transporte exactement le code TR2 sans le transformer', async () => {
    const code = 'TR2.abcDEF_123-xyz'
    const contents = serializeTransferFile(code)
    expect(parseTransferFile(contents)).toBe(code)
    expect(await readTransferFile(new File([contents], 'carte.BTCG'))).toBe(code)
  })
  it('refuse formats, tailles, versions et codes invalides', async () => {
    for (const contents of ['<html>error</html>', 'null', '[]', 'x'.repeat(MAX_TRANSFER_FILE_BYTES + 1), '{"format":"bizave-tcg-transfer","version":1,"code":"TR1.abc"}', '{"format":"bizave-tcg-transfer","version":3,"code":"TR2.abc"}', '{"format":"bizave-tcg-transfer","version":2,"code":"FR2.abc"}', '{"format":"bizave-tcg-transfer","version":2,"code":"TR2.abc","extra":true}']) expect(() => parseTransferFile(contents)).toThrow()
    expect(() => serializeTransferFile('TR2.' + 'a'.repeat(12_000))).toThrow()
    await expect(readTransferFile(new File(['x'], 'image.png'))).rejects.toThrow(/\.btcg/)
    await expect(readTransferFile(new File(['x'.repeat(MAX_TRANSFER_FILE_BYTES + 1)], 'carte.btcg'))).rejects.toThrow(/volumineux/)
  })
})
