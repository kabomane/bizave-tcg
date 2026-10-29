import { describe, expect, it } from 'vitest'
import { UPDATE_VERSION } from '../data/update'
import { acknowledgeUpdate, needsUpdateNotice, resetUpdateNotice } from './updateNotice'

function storage(value: string | null = null) {
  const entries = new Map<string, string>(value === null ? [] : [['updated', value]])
  return { getItem: (key: string) => entries.get(key) ?? null, setItem: (key: string, next: string) => { entries.set(key, next) } }
}

describe('page de mise à jour au démarrage', () => {
  it('initialise un nouveau joueur sans lui présenter une mise à jour', () => {
    const store = storage()
    expect(needsUpdateNotice(false, store)).toBe(false)
    expect(store.getItem('updated')).toBe(String(UPDATE_VERSION))
  })
  it('présente la page aux anciens joueurs sans marqueur et attend leur confirmation', () => {
    const store = storage()
    expect(needsUpdateNotice(true, store)).toBe(true)
    expect(store.getItem('updated')).toBeNull()
    acknowledgeUpdate(store)
    expect(needsUpdateNotice(true, store)).toBe(false)
    resetUpdateNotice(store)
    expect(store.getItem('updated')).toBe('0')
    expect(needsUpdateNotice(true, store)).toBe(true)
  })
  it('accepte la version courante ou supérieure et traite les valeurs invalides comme zéro', () => {
    for (const value of [String(UPDATE_VERSION), String(UPDATE_VERSION + 1)]) expect(needsUpdateNotice(true, storage(value))).toBe(false)
    for (const value of ['0', '', '-1', 'NaN', 'Infinity', '1.5', 'abc', '999999999999999999999999']) expect(needsUpdateNotice(true, storage(value))).toBe(true)
  })
  it('ne bloque pas le jeu si la préférence est inaccessible', () => {
    expect(needsUpdateNotice(true, { getItem: () => { throw new Error('blocked') }, setItem: () => {} })).toBe(false)
  })
})
