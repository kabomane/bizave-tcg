import { useSyncExternalStore } from 'react'

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
