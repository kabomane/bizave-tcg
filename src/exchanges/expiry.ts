export const TRANSFER_LIFETIME_MS = 24 * 60 * 60 * 1000

export function assertTransferNotExpired(issuedAt: number, now = Date.now()) {
  if (!Number.isSafeInteger(now) || issuedAt > now) throw new Error('La date de ce code de transfert est invalide. Vérifiez l’heure de votre appareil.')
  if (now - issuedAt >= TRANSFER_LIFETIME_MS) throw new Error('Ce code de transfert a expiré (validité : 24 h).')
}
