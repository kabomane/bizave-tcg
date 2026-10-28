import { useEffect, useLayoutEffect, useRef } from 'react'
import { MAX_CARD_TILT_DEGREES } from '../game/config'

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))

/** Full-size card interaction only; thumbnail taps never allocate a spring or RAF loop. */
export function useCardTilt(enabled: boolean, onActivate?: () => void) {
  const wrapperRef = useRef<HTMLDivElement>(null), elementRef = useRef<HTMLElement>(null)
  const draggedRef = useRef(false)
  const activate = useRef(onActivate)
  useLayoutEffect(() => { activate.current = onActivate }, [onActivate])
  useEffect(() => {
    if (!enabled) return
    const el = elementRef.current!
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    const state = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0 }
    let raf = 0, last = 0, pointerActive = false
    let pointerIdleTimer: number | undefined
    el.dataset.interacting = 'false'
    const apply = () => {
      let x = clamp(state.x, -.6, .6), y = clamp(state.y, -.6, .6)
      // Hard cap on combined rotation, including spring overshoot and keyboard flicks.
      const magnitude = Math.hypot(x, y)
      if (magnitude > .5) { x *= .5 / magnitude; y *= .5 / magnitude }
      if (reduced.matches) { x = 0; y = 0 }
      el.dataset.interacting = String(pointerActive || Math.abs(state.x - state.tx) + Math.abs(state.y - state.ty) + Math.abs(state.vx) + Math.abs(state.vy) > .002)
      const tilt = clamp(Math.hypot(x, y) * 2.2, 0, 1)
      const vars: Record<string, string> = {
        '--rx': `${-y * MAX_CARD_TILT_DEGREES * 2}deg`, '--ry': `${x * MAX_CARD_TILT_DEGREES * 2}deg`,
        '--px': `${-x * 16}px`, '--py': `${-y * 16}px`, '--hx': `${50 + x * 110}%`, '--hy': `${50 + y * 110}%`,
        '--hx2': `${50 - x * 80}%`, '--hy2': `${50 - y * 80}%`, '--tilt': `${tilt}`, '--angle': `${Math.atan2(x, -y)}rad`,
        '--sx': `${-x * 34}`, '--sy': `${-y * 34}`, '--s1': `${clamp(x * 2.6, 0, 1)}`, '--s2': `${clamp(-x * 2.6, 0, 1)}`, '--s3': `${clamp(Math.abs(y) * 2.6 - Math.abs(x), 0, 1)}`,
      }
      for (const [key, value] of Object.entries(vars)) el.style.setProperty(key, value)
    }
    function tick(now: number) {
      const dt = Math.min(.032, (now - last) / 1000); last = now
      state.vx += ((state.tx - state.x) * 210 - state.vx * 19) * dt; state.x += state.vx * dt
      state.vy += ((state.ty - state.y) * 210 - state.vy * 19) * dt; state.y += state.vy * dt
      apply()
      raf = Math.abs(state.x - state.tx) + Math.abs(state.y - state.ty) + Math.abs(state.vx) + Math.abs(state.vy) > .001 ? requestAnimationFrame(tick) : 0
    }
    const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick) } }
    const releaseIdle = () => {
      window.clearTimeout(pointerIdleTimer)
      pointerIdleTimer = window.setTimeout(() => { pointerActive = false; wake() }, 650)
    }
    let touchStart: { x: number; y: number } | null = null
    const aim = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' && touchStart && !el.hasPointerCapture(e.pointerId)) {
        const dx = Math.abs(e.clientX - touchStart.x), dy = Math.abs(e.clientY - touchStart.y)
        if (dy > 8 && dy >= dx) touchStart = null
        else if (dx > 8 && dx > dy) { el.setPointerCapture(e.pointerId); draggedRef.current = true }
      }
      if (e.pointerType !== 'mouse' && !el.hasPointerCapture(e.pointerId)) return
      pointerActive = true
      el.dataset.interacting = 'true'
      const rect = wrapperRef.current!.getBoundingClientRect()
      state.tx = clamp((e.clientX - rect.left) / rect.width - .5, -.5, .5)
      state.ty = clamp((e.clientY - rect.top) / rect.height - .5, -.5, .5); wake()
      if (e.pointerType === 'mouse') releaseIdle()
    }
    const reset = () => { window.clearTimeout(pointerIdleTimer); pointerActive = false; state.tx = state.ty = 0; wake() }
    // Wait for a horizontal gesture before capturing touch; vertical gestures scroll natively.
    const down = (e: PointerEvent) => { window.clearTimeout(pointerIdleTimer); pointerActive = true; el.dataset.interacting = 'true'; draggedRef.current = false; if (e.pointerType !== 'mouse') touchStart = { x: e.clientX, y: e.clientY } }
    const up = (e: PointerEvent) => { touchStart = null; if (e.pointerType !== 'mouse') reset(); else releaseIdle() }
    const key = (e: KeyboardEvent) => {
      if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        e.preventDefault(); state.vx += e.key === 'ArrowLeft' ? -4 : e.key === 'ArrowRight' ? 4 : 0
        state.vy += e.key === 'ArrowUp' ? -4 : e.key === 'ArrowDown' ? 4 : 0; wake()
      }
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (activate.current) activate.current(); else { state.vx += 4; state.vy -= 2.5; wake() } }
    }
    el.addEventListener('pointermove', aim); el.addEventListener('pointerleave', reset)
    el.addEventListener('pointerdown', down); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', reset); el.addEventListener('keydown', key)
    return () => { window.clearTimeout(pointerIdleTimer); cancelAnimationFrame(raf); el.removeEventListener('pointermove', aim); el.removeEventListener('pointerleave', reset); el.removeEventListener('pointerdown', down); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', reset); el.removeEventListener('keydown', key) }
  }, [enabled])
  return { wrapperRef, elementRef, draggedRef }
}
