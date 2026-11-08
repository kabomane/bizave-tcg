export const VERSION_POLL_MS = 60_000
export const LONG_ABSENCE_MS = 5 * 60_000

export function parseBuildVersion(value: unknown): string | null {
  if (!value || typeof value !== 'object') return null
  const { schema, buildId } = value as Record<string, unknown>
  return schema === 1 && typeof buildId === 'string' && /^[a-zA-Z0-9._-]{1,128}$/.test(buildId) ? buildId : null
}

export async function fetchBuildVersion(signal: AbortSignal, { releaseOnly = false } = {}): Promise<string | null> {
  const response = await fetch('/version.json', { cache: 'no-store', signal, headers: { Accept: 'application/json' } })
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) return null
  const manifest: unknown = await response.json()
  const id = parseBuildVersion(manifest)
  if (id && releaseOnly) {
    const { appVersion, betaClosed } = manifest as Record<string, unknown>
    if (betaClosed !== false || typeof appVersion !== 'string' || !/^\d+\.\d+\.\d+$/.test(appVersion)) return null
    const [major, minor] = appVersion.split('.').map(Number)
    if (major < 1 || (major === 1 && minor < 5)) return null
  }
  return id
}

export function watchBuildVersion({ current, onVersion, doc = document, win = window, fetchVersion = fetchBuildVersion, now = () => Date.now() }: {
  current: string; onVersion: (id: string | null, autoReload: boolean) => void
  doc?: Pick<Document, 'addEventListener' | 'removeEventListener' | 'visibilityState'>
  win?: Pick<Window, 'addEventListener' | 'removeEventListener'>
  fetchVersion?: (signal: AbortSignal) => Promise<string | null>; now?: () => number
}) {
  let stopped = false, inFlight = false, autoRequested = false, recheck = false, lastCheck = -Infinity
  let hiddenAt: number | null = doc.visibilityState === 'hidden' ? now() : null
  let controller: AbortController | undefined
  async function check(auto = false) {
    if (stopped || doc.visibilityState !== 'visible') return
    if (inFlight) { autoRequested ||= auto; recheck ||= auto; return }
    if (!auto && now() - lastCheck < 2000) return
    inFlight = true; autoRequested = auto; lastCheck = now()
    controller = new AbortController()
    const timeout = setTimeout(() => controller?.abort(), 8000)
    try {
      const id = await fetchVersion(controller.signal)
      if (!stopped && doc.visibilityState === 'visible' && id) onVersion(id === current ? null : id, autoRequested)
    } catch { /* Offline, an old deployment or an invalid response must not block play. */ }
    finally {
      clearTimeout(timeout); inFlight = false
      // A request started before suspension may describe the old deployment.
      if (recheck && !stopped) { recheck = false; void check(true) }
    }
  }
  const visibility = () => {
    if (doc.visibilityState === 'hidden') { hiddenAt = now(); return }
    const long = hiddenAt !== null && now() - hiddenAt >= LONG_ABSENCE_MS
    hiddenAt = null
    void check(long)
  }
  const shown = (event: Event) => { void check('persisted' in event && event.persisted === true) }
  const resume = () => { void check() }
  const timer = setInterval(resume, VERSION_POLL_MS)
  doc.addEventListener('visibilitychange', visibility)
  win.addEventListener('pageshow', shown); win.addEventListener('focus', resume); win.addEventListener('online', resume)
  void check()
  return () => {
    stopped = true; controller?.abort(); clearInterval(timer)
    doc.removeEventListener('visibilitychange', visibility)
    win.removeEventListener('pageshow', shown); win.removeEventListener('focus', resume); win.removeEventListener('online', resume)
  }
}
