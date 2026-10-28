export const GIFT_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
export const GIFT_CODE_DOMAIN = 'BizaveTCG/GiftCode/v1\n'
export const GIFT_CODE_HASH_PATTERN = /^[a-f0-9]{64}$/

export function normalizeGiftCode(value: string): string {
  const code = value.replace(/[\s-]/g, '').toUpperCase()
  if (value.length > 128 || !/^[A-HJ-NP-Z2-9]{16}$/.test(code)) throw new Error('Saisissez un code cadeau de 16 caractères.')
  return code
}

export async function hashGiftCode(value: string): Promise<string> {
  const code = normalizeGiftCode(value)
  if (!globalThis.crypto?.subtle) throw new Error('Les codes cadeaux nécessitent HTTPS ou localhost.')
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(GIFT_CODE_DOMAIN + code))
  return Array.from(new Uint8Array(hash), byte => byte.toString(16).padStart(2, '0')).join('')
}
