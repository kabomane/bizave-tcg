import { describe, expect, it } from 'vitest'
import { DEFAULT_PREFERENCES, parsePreferences, resolveTheme } from './preferences'

describe('options locales', () => {
  it('utilise le système et les codes par défaut, même avec un stockage invalide', () => {
    for (const value of [null, '', '{', 'null', 'true', '[]', '{"theme":"unknown","transferMode":"other","devCatalog":"true"}']) {
      expect(parsePreferences(value)).toEqual(DEFAULT_PREFERENCES)
    }
  })
  it('restaure uniquement les préférences connues', () => {
    const saved = { theme: 'dark', transferMode: 'file', devCatalog: true }
    expect(parsePreferences(JSON.stringify({ ...saved, drops: ['fake-owned-card'] }))).toEqual({ ...DEFAULT_PREFERENCES, ...saved })
    expect(parsePreferences(JSON.stringify({ ...saved, theme: 'system' })).theme).toBe('system')
  })
  it('suit les changements système uniquement lorsque ce mode est sélectionné', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })
  it('mémorise l’affichage sans perdre les options de thème, de transfert ou de développement', () => {
    const saved = { ...DEFAULT_PREFERENCES, theme: 'dark', transferMode: 'file', devCatalog: true, collectionDisplay: { sort: 'name', direction: 'asc', groupBy: 'format', duplicates: 'show' } }
    expect(parsePreferences(JSON.stringify(saved))).toEqual(saved)
    expect(parsePreferences('{"theme":"dark"}')).toEqual({ ...DEFAULT_PREFERENCES, theme: 'dark' })
  })
})
