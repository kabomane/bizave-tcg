import { useCallback, useSyncExternalStore } from 'react'

let now = Date.now(), timer: number | undefined
const listeners = new Set<() => void>()
const snapshot = () => now
function update() { const next = Date.now(); if (next !== now) { now = next; listeners.forEach(listener => listener()) } }
function resume() { if (document.visibilityState === 'visible') update() }
function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) { update(); timer = window.setInterval(update, 1000); document.addEventListener('visibilitychange', resume) }
  return () => { listeners.delete(listener); if (!listeners.size) { window.clearInterval(timer); timer = undefined; document.removeEventListener('visibilitychange', resume) } }
}
export function useNow() { return useSyncExternalStore(subscribe, snapshot) }

export function useClockValue<T>(select: (time: number) => T) {
  return useSyncExternalStore(subscribe, () => select(snapshot()))
}

export function useDeadlineReached(at: number | undefined, minimumTime: number) {
  const subscribeDeadline = useCallback((onChange: () => void) => {
    if (at === undefined || at <= minimumTime) return () => {}
    let timer: number | undefined
    const update = () => {
      window.clearTimeout(timer)
      const delay = at - Date.now()
      if (delay > 0) timer = window.setTimeout(update, Math.min(delay, 2_147_483_647))
      onChange()
    }
    const resume = () => { if (document.visibilityState === 'visible') update() }
    update()
    document.addEventListener('visibilitychange', resume)
    window.addEventListener('focus', resume)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('visibilitychange', resume)
      window.removeEventListener('focus', resume)
    }
  }, [at, minimumTime])
  return useSyncExternalStore(subscribeDeadline, () => at !== undefined && Math.max(Date.now(), minimumTime) >= at)
}
