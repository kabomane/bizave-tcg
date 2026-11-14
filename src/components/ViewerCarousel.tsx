import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState } from 'react'
import type { Ref } from 'react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import type { Card } from '../game/types'
import { cardById } from '../data/cards'
import { ViewerCard } from './ViewerCard'

type VisualEntry = { key: string; card: Omit<Card, 'dropId'> }
export type ViewerCarouselHandle = { move: (next: number) => void }

/** Common presentation only: no collection ownership, mutation or image-export hooks. */
export function ViewerCarousel({ entries, index, onIndexChange, disabled = false, ref }: { entries: readonly VisualEntry[]; index: number; onIndexChange: (index: number) => void; disabled?: boolean; ref?: Ref<ViewerCarouselHandle> }) {
  const track = useRef<HTMLDivElement>(null), scrollTimer = useRef<number | undefined>(undefined)
  const [ready, setReady] = useState<ReadonlySet<string>>(() => new Set())
  const markReady = useCallback((source: string) => setReady(previous => previous.has(source) ? previous : new Set([...previous, source])), [])
  useLayoutEffect(() => {
    const element = track.current!
    const align = () => { const slide = element.firstElementChild as HTMLElement; element.scrollTo({ left: index * slide.getBoundingClientRect().width, behavior: 'instant' }) }
    align()
    const observer = new ResizeObserver(align); observer.observe(element)
    return () => observer.disconnect()
  }, [index, entries.length])
  useEffect(() => () => clearTimeout(scrollTimer.current), [])
  function move(next: number) {
    if (disabled || next < 0 || next >= entries.length) return
    const element = track.current!, width = element.firstElementChild!.getBoundingClientRect().width
    element.scrollTo({ left: next * width, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
  useImperativeHandle(ref, () => ({ move }))
  return <div className="viewer-stage"><div ref={track} className="viewer-track" style={disabled ? { overflowX: 'hidden' } : undefined} onScroll={event => {
    const element = event.currentTarget
    clearTimeout(scrollTimer.current)
    scrollTimer.current = window.setTimeout(() => {
      const width = element.firstElementChild!.getBoundingClientRect().width
      const next = Math.max(0, Math.min(entries.length - 1, Math.round(element.scrollLeft / width)))
      if (next !== index) onIndexChange(next)
    }, 120)
  }}>{entries.map((entry, i) => {
    const definition = cardById.get(entry.card.cardId)!
    return <div key={entry.key} className={`viewer-slide${i === index ? ' is-current' : ''}`} aria-label={`${i + 1} sur ${entries.length}`}><div className="viewer-card">{Math.abs(i - index) <= 1 && <ViewerCard card={entry.card} definition={definition} presentation={i === index ? 'detail' : 'thumbnail'} ready={ready.has(definition.artwork[entry.card.artVariant])} onReady={markReady} onActivate={i === index ? undefined : () => move(i)} />}</div></div>
  })}</div>{entries.length > 1 && <><button type="button" className="viewer-glass viewer-previous" aria-label="Carte précédente" disabled={!index || disabled} onClick={() => move(index - 1)}><ArrowLeft size={18} /></button><button type="button" className="viewer-glass viewer-next" aria-label="Carte suivante" disabled={index === entries.length - 1 || disabled} onClick={() => move(index + 1)}><ArrowRight size={18} /></button></>}</div>
}
