export function Symbol({ kind = 'spark', className = '' }: { kind?: 'spark' | 'moon' | 'bloom'; className?: string }) {
  return <svg viewBox="0 0 100 100" fill="none" aria-hidden="true" className={className}>
    {kind === 'spark' ? <><path d="m50 4 11 32 32 14-32 12-11 34-12-34L5 50l33-14Z" fill="currentColor" /><path d="m50 24 7 26-7 27-7-27Z" fill="var(--symbol-cutout, #203a5c)" /><path d="m77 12 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" fill="currentColor" opacity=".6" /></> : kind === 'moon' ? <><path d="M71 10a40 40 0 1 0 18 67A39 39 0 0 1 71 10Z" fill="currentColor" /><path d="m76 37 4 11 12 4-12 4-4 12-4-12-12-4 12-4Z" fill="currentColor" /></> : <><path d="M50 13C18-6 9 22 31 40-1 37-3 72 32 67c-15 28 16 46 24 15 20 27 46 5 21-15 33-2 29-36-2-30C91 7 60-4 50 13Z" fill="currentColor" /><circle cx="52" cy="48" r="9" fill="var(--symbol-cutout, #5c394b)" /></>}
  </svg>
}
