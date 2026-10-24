import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ART_LABELS, FINISH_LABELS, MAX_CARD_TILT_DEGREES, RARITY_LABELS } from '../game/config'
import type { Card, CardDefinition, Finish, Rarity } from '../game/types'

const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n))
const rarityPaths: Record<Rarity, string> = {
  common: '<circle cx="12" cy="12" r="6" fill="currentColor"/>',
  uncommon: '<path d="M12 3 20 12 12 21 4 12Z" fill="currentColor"/>',
  rare: '<path d="M12 2c1 5 3 8 10 10-7 2-9 5-10 10-1-5-3-8-10-10 7-2 9-5 10-10Z" fill="currentColor"/>',
  epic: '<path d="M12 2l2.6 5.5 6.1-.5-3.3 5 3.3 5-6.1-.5L12 22l-2.6-5.5-6.1.5 3.3-5-3.3-5 6.1.5Z" fill="currentColor"/>',
  legendary: '<path d="M3 17h18l-1.6-10-4.6 4.2L12 4l-2.8 7.2L4.6 7Z" fill="currentColor"/><rect x="3" y="18.5" width="18" height="2.5" rx="1.2" fill="currentColor"/>',
}
const finishPaths: Record<Finish, string> = {
  normal: '<rect x="5" y="5" width="14" height="14" rx="2.5" fill="currentColor"/>',
  glossy: '<path d="M12 3 21.5 19.5h-19Z" fill="url(#ic-holo)"/><path d="M12 3v16.5" stroke="rgba(255,255,255,.6)" stroke-width="1"/>',
  alternative: '<path d="M7 4h10l4.5 5.2L12 20.5 2.5 9.2Z" fill="url(#ic-gold)"/><path d="M2.5 9.2h19M7 4l5 16.5M17 4l-5 16.5" stroke="rgba(70,40,0,.45)" stroke-width=".9" fill="none"/>',
}
export function CardSvgDefinitions() {
  return <svg aria-hidden="true" width="0" height="0" style={{ position: 'absolute', overflow: 'hidden' }}><defs>
    <linearGradient id="ic-holo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#ff8fa3" /><stop offset=".25" stopColor="#ffe07a" /><stop offset=".5" stopColor="#8dffb8" /><stop offset=".75" stopColor="#8ad8ff" /><stop offset="1" stopColor="#c79bff" /></linearGradient>
    <linearGradient id="ic-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fcf6ba" /><stop offset=".45" stopColor="#bf953f" /><stop offset=".7" stopColor="#fbf5b7" /><stop offset="1" stopColor="#aa771c" /></linearGradient>
  </defs></svg>
}
// Markup and finish layers reproduce the supplied demo. The artwork alone is replaced.
type CardProps = { card: Card; definition: CardDefinition; onActivate?: () => void; activationLabel?: string; deferred?: boolean }

/** Only nearby collection cards allocate the layered foil surfaces. Slots keep scroll geometry stable. */
export function CollectibleCard({ deferred = false, ...props }: CardProps) {
  const slot = useRef<HTMLDivElement>(null)
  const [nearby, setNearby] = useState(!deferred)
  useEffect(() => {
    if (!deferred || !slot.current) return
    const observer = new IntersectionObserver(([entry]) => setNearby(entry.isIntersecting), { rootMargin: '240px 0px' })
    observer.observe(slot.current)
    return () => observer.disconnect()
  }, [deferred])
  return <div ref={slot} className={`card-slot ${deferred ? 'card-thumbnail' : ''}`}>
    {nearby ? <CardFace {...props} /> : <button className="card-placeholder" onClick={props.onActivate} aria-label={`${props.definition.title}${props.activationLabel ? `. ${props.activationLabel}` : ''}`} />}
  </div>
}

function CardFace({ card, definition, onActivate, activationLabel }: CardProps) {
  const wrapper = useRef<HTMLDivElement>(null), element = useRef<HTMLElement>(null)
  const [scale, setScale] = useState(1)
  const dragged = useRef(false), activate = useRef(onActivate)
  useLayoutEffect(() => { activate.current = onActivate }, [onActivate])
  useLayoutEffect(() => {
    setScale(wrapper.current!.getBoundingClientRect().width / 326)
    const observer = new ResizeObserver(entries => setScale(entries[0].contentRect.width / 326))
    if (wrapper.current) observer.observe(wrapper.current)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (card.finish !== 'glossy') return
    const el = element.current!
    let visible = false
    const sync = () => { el.dataset.holoIdle = String(visible && !document.hidden) }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() }, { root: el.closest('dialog') })
    observer.observe(wrapper.current!)
    document.addEventListener('visibilitychange', sync)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); delete el.dataset.holoIdle }
  }, [card.finish])
  useEffect(() => {
    const el = element.current!
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
        else if (dx > 8 && dx > dy) { el.setPointerCapture(e.pointerId); dragged.current = true }
      }
      if (e.pointerType !== 'mouse' && !el.hasPointerCapture(e.pointerId)) return
      pointerActive = true
      el.dataset.interacting = 'true'
      const rect = wrapper.current!.getBoundingClientRect()
      state.tx = clamp((e.clientX - rect.left) / rect.width - .5, -.5, .5)
      state.ty = clamp((e.clientY - rect.top) / rect.height - .5, -.5, .5); wake()
      if (e.pointerType === 'mouse') releaseIdle()
    }
    const reset = () => { window.clearTimeout(pointerIdleTimer); pointerActive = false; state.tx = state.ty = 0; wake() }
    // Wait for a horizontal gesture before capturing touch; vertical gestures scroll natively.
    const down = (e: PointerEvent) => { window.clearTimeout(pointerIdleTimer); pointerActive = true; el.dataset.interacting = 'true'; dragged.current = false; if (e.pointerType !== 'mouse') touchStart = { x: e.clientX, y: e.clientY } }
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
  }, [])
  const f = card.finish, micro = f === 'normal' ? 'Mate' : f === 'glossy' ? 'Holographique' : 'Alternative'
  const rarity = RARITY_LABELS[definition.rarity]
  const title = f === 'alternative' ? <h2 className="foil-text" data-text={definition.title}>{definition.title}</h2> : <h2 className="card-title">{definition.title}</h2>
  return <div ref={wrapper} className={`card-scene layout-${card.artVariant === 'fullArt' ? 'gundam' : 'fusion'}`} style={{ borderRadius: 20 * scale }}>
    <div className="card-scale" style={{ transform: `scale(${scale})` }}>
      <article ref={element} className={`card has-custom ${f === 'normal' ? 'standard' : f}`} data-rarity={definition.rarity} data-art={card.artVariant} tabIndex={0} role="button" aria-label={`${definition.title}, ${rarity}, ${FINISH_LABELS[f]}, ${ART_LABELS[card.artVariant]}${activationLabel ? `. ${activationLabel}` : ''}`} onClick={() => { if (!dragged.current) onActivate?.(); dragged.current = false }} onContextMenu={event => event.preventDefault()} onDragStart={event => event.preventDefault()}>
        <header className="name-bar"><span className={`nb-title ${f === 'alternative' ? 'foil-text' : ''}`} data-text={definition.title}>{definition.title}</span><span className="nb-meta"><span className="rarity-text">{rarity}</span><span className="rarity-icon"><svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: rarityPaths[definition.rarity] }} /></span></span><span className="nb-finish" title={FINISH_LABELS[f]}><svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: finishPaths[f] }} /></span></header>
        <div className="art"><img className="custom-art" src={definition.artwork[card.artVariant]} style={{ objectPosition: definition.artworkPosition?.[card.artVariant] }} alt={definition.artwork[card.artVariant].endsWith('.svg') ? 'Illustration à venir' : `Illustration de ${definition.title}`} loading="lazy" draggable={false} /></div>
        {f === 'glossy' && <><div className="holo" /><div className="sparkle s1" /><div className="sparkle s2" /><div className="sparkle s3" /></>}
        <div className="type-line"><span className="tl-rarity"><span className="rarity-text">{rarity}</span></span><span className="tl-sep"> — </span><span className="tl-fin">{micro}</span></div>
        <div className="card-info">{title}<p className="description">{definition.description}</p><div className="finish-name"><span className="rarity-text">{rarity}</span> · {micro}</div></div>
        {f === 'glossy' ? <div className="foil-frame" /> : f === 'alternative' ? <><div className="gold-frame" /><div className="gold-inner" /></> : <div className="matte-frame" />}
        <div className="shade" />
      </article>
    </div>
  </div>
}
