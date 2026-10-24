export function formatTime(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}
export const errorText = (error: unknown) => error instanceof Error ? error.message : 'Une erreur est survenue.'
export async function copyText(text: string) {
  try { await navigator.clipboard.writeText(text) } catch { throw new Error('Copie indisponible. Autorisez l’accès au presse-papiers puis réessayez.') }
}

/** Invoke clipboard.write during the tap, before the transfer transaction resolves (Safari). */
export async function copyPromisedText(text: Promise<string>) {
  if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    const blob = text.then(value => new Blob([value], { type: 'text/plain' }))
    // A denied clipboard permission may stop the browser consuming the deferred data.
    void blob.catch(() => {})
    await navigator.clipboard.write([new ClipboardItem({ 'text/plain': blob })])
  } else await copyText(await text)
}
export function formatCountdown(ms: number) {
  const seconds = Math.max(0, Math.ceil(ms / 1000))
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60].map(value => String(value).padStart(2, '0')).join(':')
}
