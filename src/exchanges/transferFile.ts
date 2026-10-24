import type { OutgoingTransferRow } from '../game/types'

export const MAX_TRANSFER_FILE_BYTES = 16_384
const FORMAT = 'bizave-tcg-transfer'
function validateCode(code: unknown): asserts code is string {
  if (typeof code !== 'string' || code.length > 12_000 || !/^TR1\.[A-Za-z0-9_-]+$/.test(code)) throw new Error('Ce fichier ne contient pas de code de transfert valide.')
}
export function serializeTransferFile(code: string): string {
  validateCode(code)
  return JSON.stringify({ format: FORMAT, version: 1, code })
}
export function parseTransferFile(contents: string): string {
  if (new TextEncoder().encode(contents).byteLength > MAX_TRANSFER_FILE_BYTES) throw new Error('Ce fichier de transfert est trop volumineux.')
  let data: unknown
  try { data = JSON.parse(contents) } catch { throw new Error('Ce fichier .btcg est illisible.') }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Fichier de transfert non reconnu.')
  const value = data as Record<string, unknown>
  if (value.format !== FORMAT || value.version !== 1 || Object.keys(value).sort().join(',') !== 'code,format,version') throw new Error('Format de fichier de transfert non pris en charge.')
  validateCode(value.code)
  // Authentication, recipient and replay checks remain in receiveTransfer.
  return value.code
}
export async function readTransferFile(file: File): Promise<string> {
  if (!/\.btcg$/i.test(file.name)) throw new Error('Choisissez un fichier .btcg.')
  if (file.size > MAX_TRANSFER_FILE_BYTES) throw new Error('Ce fichier de transfert est trop volumineux.')
  return parseTransferFile(await file.text())
}
export function downloadTransferFile(transfer: Pick<OutgoingTransferRow, 'code' | 'transferId'>) {
  const blob = new Blob([serializeTransferFile(transfer.code)], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `bizave-transfert-${transfer.transferId.replace(/[^a-zA-Z0-9-]/g, '')}.btcg`
  document.body.append(link)
  try { link.click() } finally { link.remove(); window.setTimeout(() => URL.revokeObjectURL(url), 60_000) }
}
