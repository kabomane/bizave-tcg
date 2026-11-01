import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchBuildVersion, LONG_ABSENCE_MS, parseBuildVersion, watchBuildVersion } from './buildVersion'

afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
function fixture() {
  vi.useFakeTimers()
  const doc = Object.assign(new EventTarget(), { visibilityState: 'visible' as DocumentVisibilityState }), win = new EventTarget()
  const fetchVersion = vi.fn(async (_signal: AbortSignal): Promise<string | null> => { void _signal; return 'new' }), onVersion = vi.fn()
  const stop = watchBuildVersion({ current: 'old', doc, win, fetchVersion, onVersion })
  return { doc, win, fetchVersion, onVersion, stop }
}
describe('détection des builds', () => {
  it('refuse les réponses HTML, les schémas inconnus et les identifiants invalides', () => {
    for (const value of [null, '<html>', {}, { schema: 2, buildId: 'x' }, { schema: 1, buildId: '' }, { schema: 1, buildId: 'bad/id' }]) expect(parseBuildVersion(value)).toBeNull()
    expect(parseBuildVersion({ schema: 1, buildId: 'build-1' })).toBe('build-1')
  })
  it('interroge sans cache et ignore le fallback HTML de Firebase', async () => {
    const fetch = vi.fn(async () => new Response('<html>', { headers: { 'content-type': 'text/html' } }))
    vi.stubGlobal('fetch', fetch)
    expect(await fetchBuildVersion(new AbortController().signal)).toBeNull()
    expect(fetch).toHaveBeenCalledWith('/version.json', expect.objectContaining({ cache: 'no-store' }))
  })
  it('notifie un onglet actif, vérifie toutes les minutes et nettoie les événements', async () => {
    const f = fixture()
    await vi.advanceTimersByTimeAsync(0)
    expect(f.onVersion).toHaveBeenLastCalledWith('new', false)
    await vi.advanceTimersByTimeAsync(60_000)
    expect(f.fetchVersion).toHaveBeenCalledTimes(2)
    f.stop(); await vi.advanceTimersByTimeAsync(60_000); f.win.dispatchEvent(new Event('online'))
    expect(f.fetchVersion).toHaveBeenCalledTimes(2)
  })
  it('reste silencieux hors ligne puis réessaie au retour du réseau', async () => {
    const f = fixture(); await vi.advanceTimersByTimeAsync(0); f.onVersion.mockClear()
    f.fetchVersion.mockRejectedValueOnce(new Error('offline'))
    await vi.advanceTimersByTimeAsync(60_000)
    expect(f.onVersion).not.toHaveBeenCalled()
    await vi.advanceTimersByTimeAsync(3000); f.win.dispatchEvent(new Event('online')); await vi.advanceTimersByTimeAsync(0)
    expect(f.onVersion).toHaveBeenCalledWith('new', false); f.stop()
  })
  it('ne fait aucune requête masqué et distingue une absence longue', async () => {
    const f = fixture(); await vi.advanceTimersByTimeAsync(0)
    f.doc.visibilityState = 'hidden'; f.doc.dispatchEvent(new Event('visibilitychange'))
    await vi.advanceTimersByTimeAsync(LONG_ABSENCE_MS)
    expect(f.fetchVersion).toHaveBeenCalledTimes(1)
    f.doc.visibilityState = 'visible'; f.doc.dispatchEvent(new Event('visibilitychange')); await vi.advanceTimersByTimeAsync(0)
    expect(f.onVersion).toHaveBeenLastCalledWith('new', true); f.stop()
  })
  it('détecte une restauration de l’historique et un retour au build courant', async () => {
    const f = fixture(); await vi.advanceTimersByTimeAsync(0)
    f.win.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true })); await vi.advanceTimersByTimeAsync(0)
    expect(f.onVersion).toHaveBeenLastCalledWith('new', true)
    f.fetchVersion.mockResolvedValue('old'); await vi.advanceTimersByTimeAsync(60_000)
    expect(f.onVersion).toHaveBeenLastCalledWith(null, false); f.stop()
  })
  it('déduplique les événements pendant une requête et annule une réponse après fermeture', async () => {
    const f = fixture(); await vi.advanceTimersByTimeAsync(0)
    let resolve!: (id: string) => void
    f.fetchVersion.mockImplementationOnce(() => new Promise(done => { resolve = done }))
    await vi.advanceTimersByTimeAsync(60_000)
    f.win.dispatchEvent(new Event('focus')); f.win.dispatchEvent(new Event('online'))
    expect(f.fetchVersion).toHaveBeenCalledTimes(2)
    f.stop(); f.onVersion.mockClear(); resolve('new'); await vi.advanceTimersByTimeAsync(0)
    expect(f.onVersion).not.toHaveBeenCalled()
  })
  it('relit le manifeste si une restauration survient pendant une ancienne requête', async () => {
    const f = fixture(); await vi.advanceTimersByTimeAsync(0)
    let resolve!: (id: string) => void
    f.fetchVersion.mockImplementationOnce(() => new Promise(done => { resolve = done }))
    await vi.advanceTimersByTimeAsync(60_000)
    f.win.dispatchEvent(Object.assign(new Event('pageshow'), { persisted: true }))
    resolve('old'); await vi.advanceTimersByTimeAsync(0)
    expect(f.fetchVersion).toHaveBeenCalledTimes(3)
    expect(f.onVersion).toHaveBeenLastCalledWith('new', true); f.stop()
  })
})
