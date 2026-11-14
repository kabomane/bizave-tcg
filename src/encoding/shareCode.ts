import { base62, unbase62 } from './base62'

export const SHARE_CODE_PREFIX = { contact: 'FR3', card: 'TR3', fragments: 'TF2', collection: 'CL2' } as const
export const MAX_EXCHANGE_CODE_LENGTH = 12_000

export function isShareCode(code: unknown, prefix: string, maxLength: number): code is string {
  return typeof code === 'string' && code.length <= maxLength && code.startsWith(`${prefix}.`) && code.length > prefix.length + 1 && !/[^A-Za-z0-9]/.test(code.slice(prefix.length + 1))
}
export function encodeShareCode(prefix: string, bytes: Uint8Array) { return `${prefix}.${base62(bytes)}` }
export function decodeShareCode(code: string, prefix: string, maxLength: number) {
  if (!isShareCode(code, prefix, maxLength)) throw new Error('Code malformé ou corrompu.')
  return unbase62(code.slice(prefix.length + 1))
}
