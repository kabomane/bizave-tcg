import { useCallback, useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { RefreshCw } from 'lucide-react'
import { db } from '../storage/database'
import { fetchBuildVersion, watchBuildVersion } from '../settings/buildVersion'

const AUTO_RELOAD_KEY = 'bizave.last-auto-build'

// Conservative safe points: never interrupt an opening, transfer, save import,
// form or dialog. The player can return to Collection to apply the update.
function safeScreen() {
  return ['/', '/collection', '/changelog'].includes(location.pathname)
    && !!document.querySelector('.app-shell')
    && !document.querySelector('dialog[open], .opening-view, .opening-recap, .is-opening, .confirmation-panel')
    && !Array.from(document.querySelectorAll('[aria-busy="true"]')).some(el => !el.closest('.build-update-notice'))
    && !Array.from(document.querySelectorAll('input, textarea')).some(el => (el as HTMLInputElement).value || el === document.activeElement)
}

export function BuildUpdateNotice() {
  const [available, setAvailable] = useState<string | null>(null)
  const [safe, setSafe] = useState(false), [loading, setLoading] = useState(false), [error, setError] = useState('')
  const interaction = useRef(0)
  useEffect(() => {
    const touched = () => { interaction.current++ }
    document.addEventListener('pointerdown', touched, true); document.addEventListener('keydown', touched, true)
    return () => { document.removeEventListener('pointerdown', touched, true); document.removeEventListener('keydown', touched, true) }
  }, [])
  const pending = useLiveQuery(() => db.openings.filter(row => !row.revealComplete).count())
  useEffect(() => {
    if (!available) return
    const update = () => setSafe(pending === 0 && safeScreen())
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['open', 'aria-busy', 'disabled', 'class'] })
    document.addEventListener('input', update); document.addEventListener('focusin', update); document.addEventListener('focusout', update)
    return () => { observer.disconnect(); document.removeEventListener('input', update); document.removeEventListener('focusin', update); document.removeEventListener('focusout', update) }
  }, [available, pending])

  const apply = useCallback(async (id: string, automatic: boolean) => {
    if (document.visibilityState !== 'visible' || !safeScreen()) return
    const revision = interaction.current
    if (automatic) {
      try { if (sessionStorage.getItem(AUTO_RELOAD_KEY) === id) return }
      catch { return } // No automatic loop protection available: keep the manual button.
    }
    setLoading(true); setError('')
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(), 8000)
    try {
      const latest = await fetchBuildVersion(controller.signal)
      const openings = await db.openings.filter(row => !row.revealComplete).count()
      if (!latest) { if (!automatic) setError('Connexion indisponible. Réessayez lorsque vous êtes en ligne.'); return }
      if (latest === __APP_BUILD_ID__) { setAvailable(null); return }
      if (latest !== id) { setAvailable(latest); return }
      if (openings || interaction.current !== revision || document.visibilityState !== 'visible' || !safeScreen()) return
      if (automatic) sessionStorage.setItem(AUTO_RELOAD_KEY, id)
      location.reload()
    } catch { if (!automatic) setError('Connexion indisponible. Réessayez lorsque vous êtes en ligne.') }
    finally { clearTimeout(timeout); setLoading(false) }
  }, [])

  useEffect(() => watchBuildVersion({ current: __APP_BUILD_ID__, onVersion: (id, auto) => {
    setAvailable(id)
    if (id && auto) void apply(id, true)
  } }), [apply])

  if (!available) return null
  return <aside className="build-update-notice" aria-label="Mise à jour disponible">
    <div><strong role="status">Une mise à jour est disponible.</strong>{!safe && <p>Terminez votre action puis revenez à Collection pour actualiser.</p>}{error && <p role="alert">{error}</p>}</div>
    <button type="button" className="secondary-button" disabled={!safe || loading} aria-busy={loading} onClick={() => void apply(available, false)}><RefreshCw size={16} />{loading ? 'Vérification…' : 'Actualiser'}</button>
  </aside>
}
