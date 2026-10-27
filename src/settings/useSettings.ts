import { useSyncExternalStore } from 'react'
import { DEFAULT_PREFERENCES, parsePreferences, resolveTheme, SETTINGS_KEY } from './preferences'
import type { Preferences } from './preferences'

function read(): Preferences {
  try { return parsePreferences(localStorage.getItem(SETTINGS_KEY)) }
  catch { return { ...DEFAULT_PREFERENCES } }
}
let preferences = read()
const listeners = new Set<() => void>()
const system = window.matchMedia('(prefers-color-scheme: dark)')
function applyTheme() { document.documentElement.dataset.theme = resolveTheme(preferences.theme, system.matches) }
function emit() { applyTheme(); listeners.forEach(listener => listener()) }

// Runs before React and database initialization, avoiding a light flash on startup.
applyTheme()
system.addEventListener('change', applyTheme)
window.addEventListener('storage', event => {
  if (event.key === SETTINGS_KEY || event.key === null) { preferences = read(); emit() }
})

export function updateSettings(patch: Partial<Preferences>) {
  const next = parsePreferences(JSON.stringify({ ...preferences, ...patch }))
  try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(next)) }
  catch { throw new Error('Impossible de mémoriser les options. Autorisez le stockage du navigateur puis réessayez.') }
  preferences = next
  emit()
}
export function resetSettings() {
  localStorage.removeItem(SETTINGS_KEY)
  preferences = parsePreferences(null)
  emit()
}
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener) } }
export function useSettings() { return useSyncExternalStore(subscribe, () => preferences) }
