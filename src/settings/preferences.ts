import { parseCollectionDisplay } from '../collection/preferences'
import type { CollectionDisplay } from '../collection/preferences'

export type ThemePreference = 'system' | 'light' | 'dark'
type TransferMode = 'code' | 'file'
export type Preferences = { theme: ThemePreference; transferMode: TransferMode; devCatalog: boolean; collectionDisplay: CollectionDisplay; selectedBoosterId: string }
export const SETTINGS_KEY = 'bizave.preferences.v1'
export const DEFAULT_PREFERENCES: Preferences = { theme: 'system', transferMode: 'code', devCatalog: false, collectionDisplay: parseCollectionDisplay(null), selectedBoosterId: '' }

export function parsePreferences(value: string | null): Preferences {
  try {
    const parsed: unknown = JSON.parse(value || 'null')
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_PREFERENCES }
    const data = parsed as Record<string, unknown>
    return {
      theme: data.theme === 'light' || data.theme === 'dark' ? data.theme : 'system',
      transferMode: data.transferMode === 'file' ? 'file' : 'code',
      devCatalog: data.devCatalog === true,
      collectionDisplay: parseCollectionDisplay(data.collectionDisplay),
      selectedBoosterId: typeof data.selectedBoosterId === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(data.selectedBoosterId) ? data.selectedBoosterId : '',
    }
  } catch { return { ...DEFAULT_PREFERENCES } }
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): 'light' | 'dark' {
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference
}
