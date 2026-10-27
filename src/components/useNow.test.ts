import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useSyncExternalStore } from 'react'
import { useNow } from './useNow'

vi.mock('react', () => ({ useSyncExternalStore: vi.fn((_subscribe, snapshot) => snapshot()) }))
beforeEach(() => { vi.useFakeTimers(); vi.setSystemTime(10000); vi.stubGlobal('window', globalThis); vi.stubGlobal('document', Object.assign(new EventTarget(), { visibilityState: 'visible' })); vi.mocked(useSyncExternalStore).mockClear() })
afterEach(() => { vi.useRealTimers(); vi.unstubAllGlobals() })
it('partage un seul intervalle et le supprime au dernier désabonnement', () => {
  useNow()
  const [subscribe, snapshot] = vi.mocked(useSyncExternalStore).mock.calls[0], a = vi.fn(), b = vi.fn()
  const stopA = subscribe(a), stopB = subscribe(b)
  a.mockClear(); b.mockClear()
  expect(vi.getTimerCount()).toBe(1)
  vi.advanceTimersByTime(1000)
  expect(snapshot()).toBe(11000); expect(a).toHaveBeenCalledTimes(1); expect(b).toHaveBeenCalledTimes(1)
  stopA(); expect(vi.getTimerCount()).toBe(1)
  stopB(); expect(vi.getTimerCount()).toBe(0)
})
it('actualise immédiatement au retour visible et détache son écouteur', () => {
  useNow()
  const [subscribe, snapshot] = vi.mocked(useSyncExternalStore).mock.calls[0], listener = vi.fn(), stop = subscribe(listener)
  vi.setSystemTime(45000); document.dispatchEvent(new Event('visibilitychange'))
  expect(snapshot()).toBe(45000)
  stop(); listener.mockClear(); vi.setSystemTime(60000); document.dispatchEvent(new Event('visibilitychange'))
  expect(listener).not.toHaveBeenCalled()
})
