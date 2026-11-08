import { parseCollectionDisplay } from '../collection/preferences'
import type { CollectionDisplay } from '../collection/preferences'

export type ThemePreference = 'system' | 'light' | 'dark'
export type ActionBarMode = 'four' | 'two'
export type ShareFormat = 'story' | 'card'
type TransferMode = 'code' | 'file'
export type Preferences = { theme: ThemePreference; handedness: 'right' | 'left'; transferMode: TransferMode; devCatalog: boolean; devUnlimitedFragments: boolean; devEventAlwaysActive: boolean; collectionDisplay: CollectionDisplay; selectedBoosterId: string; actionBar: ActionBarMode; shareFormat: ShareFormat }
export const SETTINGS_KEY = 'bizave.preferences.v1'
export const DEFAULT_PREFERENCES: Preferences = { theme: 'system', handedness: 'right', transferMode: 'code', devCatalog: false, devUnlimitedFragments: false, devEventAlwaysActive: false, collectionDisplay: parseCollectionDisplay(null), selectedBoosterId: '', actionBar: 'four', shareFormat: 'story' }

export function parsePreferences(value: string | null): Preferences {
  try {
    const parsed: unknown = JSON.parse(value || 'null')
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_PREFERENCES }
    const data = parsed as Record<string, unknown>
    return {
      theme: data.theme === 'light' || data.theme === 'dark' ? data.theme : 'system',
      handedness: data.handedness === 'left' ? 'left' : 'right',
      transferMode: data.transferMode === 'file' ? 'file' : 'code',
      devCatalog: data.devCatalog === true,
      devUnlimitedFragments: data.devUnlimitedFragments === true,
      devEventAlwaysActive: data.devEventAlwaysActive === true,
      actionBar: data.actionBar === 'two' ? 'two' : 'four',
      shareFormat: data.shareFormat === 'card' ? 'card' : 'story',
      collectionDisplay: parseCollectionDisplay(data.collectionDisplay),
      selectedBoosterId: typeof data.selectedBoosterId === 'string' && /^[a-z0-9][a-z0-9-]{0,79}$/.test(data.selectedBoosterId) ? data.selectedBoosterId : '',
    }
  } catch { return { ...DEFAULT_PREFERENCES } }
}

export function readLocalPreferences(): Preferences {
  try { return parsePreferences(localStorage.getItem(SETTINGS_KEY)) }
  catch { return { ...DEFAULT_PREFERENCES } }
}

export function resolveTheme(preference: ThemePreference, systemDark: boolean): 'light' | 'dark' {
  return preference === 'system' ? (systemDark ? 'dark' : 'light') : preference
}
