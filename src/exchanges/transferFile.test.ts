import { describe, expect, it } from 'vitest'
import { MAX_TRANSFER_FILE_BYTES, parseTransferFile, readTransferFile, serializeTransferFile } from './transferFile'

describe('conteneur .btcg', () => {
  it('transporte exactement le code TR3 sans le transformer', async () => {
    const code = 'TR3.abcDEF123xyz'
    const contents = serializeTransferFile(code)
    expect(parseTransferFile(contents)).toBe(code)
    expect(await readTransferFile(new File([contents], 'carte.BTCG'))).toBe(code)
  })
  it('refuse formats, tailles, versions et codes invalides', async () => {
    for (const contents of ['<html>error</html>', 'null', '[]', 'x'.repeat(MAX_TRANSFER_FILE_BYTES + 1), '{"format":"bizave-tcg-transfer","version":1,"code":"TR1.abc"}', '{"format":"bizave-tcg-transfer","version":3,"code":"TR3.abc"}', '{"format":"bizave-tcg-transfer","version":2,"code":"FR3.abc"}', '{"format":"bizave-tcg-transfer","version":2,"code":"TR3.abc","extra":true}']) expect(() => parseTransferFile(contents)).toThrow()
    expect(() => serializeTransferFile('TR3.' + 'a'.repeat(12_000))).toThrow()
    for (const code of ['TR2.abc', 'TF1.abc', 'TR3.abc_def', 'TF2.abc-def', 'TR3.abc\n', 'TF2.abc ']) expect(() => serializeTransferFile(code)).toThrow()
    await expect(readTransferFile(new File(['x'], 'image.png'))).rejects.toThrow(/\.btcg/)
    await expect(readTransferFile(new File(['x'.repeat(MAX_TRANSFER_FILE_BYTES + 1)], 'carte.btcg'))).rejects.toThrow(/volumineux/)
  })
})
