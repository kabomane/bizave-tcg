import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ART_LABELS, FINISH_LABELS, RARITY_LABELS } from '../game/config'
import type { Card, CardDefinition, Finish, Rarity } from '../game/types'
import { useCardTilt } from './useCardTilt'
import holoPreviewTexture from '../assets/holo-preview.webp'

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
// Reference layouts are shared. Thumbnails use baked foil; details retain the full finish layers.
type CardPresentation = 'thumbnail' | 'detail'
type CardProps = { card: Card; definition: CardDefinition; onActivate?: () => void; activationLabel?: string; deferred?: boolean; presentation?: CardPresentation }
type CardFaceProps = Omit<CardProps, 'deferred' | 'presentation'> & { presentation: CardPresentation }

/** Distant faces are unmounted; the presentation is independent from lazy loading. */
export function CollectibleCard({ deferred = false, presentation = 'detail', ...props }: CardProps) {
  const slot = useRef<HTMLDivElement>(null)
  const [nearby, setNearby] = useState(!deferred)
  useEffect(() => {
    if (!deferred || !slot.current) return
    const observer = new IntersectionObserver(([entry]) => setNearby(entry.isIntersecting), { root: slot.current.closest('dialog'), rootMargin: '240px 0px' })
    observer.observe(slot.current)
    return () => observer.disconnect()
  }, [deferred])
  return <div ref={slot} className={`card-slot ${presentation === 'thumbnail' ? 'card-thumbnail' : ''}`}>
    {!deferred || nearby ? <CardFace {...props} presentation={presentation} /> : <button className="card-placeholder" onClick={props.onActivate} aria-label={`${props.definition.title}${props.activationLabel ? `. ${props.activationLabel}` : ''}`} />}
  </div>
}

function CardFace({ card, definition, onActivate, activationLabel, presentation }: CardFaceProps) {
  const thumbnail = presentation === 'thumbnail'
  const { wrapperRef, elementRef, draggedRef } = useCardTilt(!thumbnail, onActivate)
  const [scale, setScale] = useState(1)
  const pointerOrigin = useRef<{ x: number; y: number } | null>(null)
  useLayoutEffect(() => {
    setScale(wrapperRef.current!.getBoundingClientRect().width / 326)
    const observer = new ResizeObserver(entries => setScale(entries[0].contentRect.width / 326))
    if (wrapperRef.current) observer.observe(wrapperRef.current)
    return () => observer.disconnect()
  }, [wrapperRef])
  useEffect(() => {
    if (card.finish !== 'glossy') return
    const el = elementRef.current!
    let visible = false
    const sync = () => { el.dataset.holoIdle = String(visible && !document.hidden) }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync() }, { root: el.closest('dialog') })
    observer.observe(wrapperRef.current!)
    document.addEventListener('visibilitychange', sync)
    return () => { observer.disconnect(); document.removeEventListener('visibilitychange', sync); delete el.dataset.holoIdle }
  }, [card.finish, elementRef, wrapperRef])
  const f = card.finish, micro = f === 'normal' ? 'Mate' : f === 'glossy' ? 'Holographique' : 'Alternative'
  const rarity = RARITY_LABELS[definition.rarity]
  const title = f === 'alternative' ? <h2 className="foil-text" data-text={definition.title}>{definition.title}</h2> : <h2 className="card-title">{definition.title}</h2>
  return <div ref={wrapperRef} className={`card-scene layout-${card.artVariant === 'fullArt' ? 'gundam' : 'fusion'}`} style={{ borderRadius: 20 * scale }}>
    <div className="card-scale" style={{ transform: `scale(${scale})` }}>
      <article ref={elementRef} className={`card has-custom ${f === 'normal' ? 'standard' : f}`} data-presentation={presentation} data-rarity={definition.rarity} data-art={card.artVariant} tabIndex={0} role="button" aria-label={`${definition.title}, ${rarity}, ${FINISH_LABELS[f]}, ${ART_LABELS[card.artVariant]}${activationLabel ? `. ${activationLabel}` : ''}`} onClick={() => { if (!draggedRef.current) onActivate?.(); draggedRef.current = false }} onKeyDown={thumbnail ? event => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onActivate?.() }
      } : undefined} onPointerDown={thumbnail ? event => { draggedRef.current = false; pointerOrigin.current = { x: event.clientX, y: event.clientY } } : undefined} onPointerMove={thumbnail ? event => {
        const origin = pointerOrigin.current
        if (origin && Math.hypot(event.clientX - origin.x, event.clientY - origin.y) > 8) draggedRef.current = true
      } : undefined} onPointerUp={thumbnail ? () => { pointerOrigin.current = null } : undefined} onPointerCancel={thumbnail ? () => { pointerOrigin.current = null; draggedRef.current = true } : undefined} onContextMenu={event => event.preventDefault()} onDragStart={event => event.preventDefault()}>
        <header className="name-bar"><span className={`nb-title ${f === 'alternative' ? 'foil-text' : ''}`} data-text={definition.title}>{definition.title}</span><span className="nb-meta"><span className="rarity-text">{rarity}</span><span className="rarity-icon"><svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: rarityPaths[definition.rarity] }} /></span></span><span className="nb-finish" title={FINISH_LABELS[f]}><svg viewBox="0 0 24 24" aria-hidden="true" dangerouslySetInnerHTML={{ __html: finishPaths[f] }} /></span></header>
        <div className="art"><img className="custom-art" src={definition.artwork[card.artVariant]} style={{ objectPosition: definition.artworkPosition?.[card.artVariant] }} alt={definition.artwork[card.artVariant].endsWith('.svg') ? 'Illustration à venir' : `Illustration de ${definition.title}`} loading="lazy" draggable={false} /></div>
        {f === 'glossy' && (thumbnail ? <div className="holo-preview" style={{ backgroundImage: `url("${holoPreviewTexture}")` }} aria-hidden="true"><div className="holo-preview-reflection" /></div> : <><div className="holo" /><div className="sparkle s1" /><div className="sparkle s2" /><div className="sparkle s3" /></>)}
        <div className="type-line"><span className="tl-rarity"><span className="rarity-text">{rarity}</span></span><span className="tl-sep"> — </span><span className="tl-fin">{micro}</span></div>
        <div className="card-info">{title}<p className="description">{definition.description}</p><div className="finish-name"><span className="rarity-text">{rarity}</span> · {micro}</div></div>
        {f === 'glossy' ? <div className={thumbnail ? 'holo-preview-frame' : 'foil-frame'} aria-hidden="true" /> : f === 'alternative' ? <><div className="gold-frame" /><div className="gold-inner" /></> : <div className="matte-frame" />}
        <div className="shade" />
      </article>
    </div>
  </div>
}
