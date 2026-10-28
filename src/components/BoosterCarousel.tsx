import { useEffect, useLayoutEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { BoosterDefinition } from '../game/types'
import { BoosterPack } from './BoosterPack'

export function BoosterCarousel({ choices, selectedId, onSelect, onOpen, onMovingChange, disabled = false, canOpen = true, tearing = false }: { choices: readonly BoosterDefinition[]; selectedId: string; onSelect: (id: string) => void; onOpen?: () => void; onMovingChange?: (moving: boolean) => void; disabled?: boolean; canOpen?: boolean; tearing?: boolean }) {
  const track = useRef<HTMLDivElement>(null), scrollTimer = useRef<number | undefined>(undefined)
  const moving = useRef(false), touching = useRef(false)
  const touchOrigin = useRef<{ x: number; y: number } | null>(null), lastScrollLeft = useRef(0)
  const current = useRef({ choices, selectedId, onSelect, onMovingChange, disabled })
  useLayoutEffect(() => { current.current = { choices, selectedId, onSelect, onMovingChange, disabled } })
  const index = Math.max(0, choices.findIndex(choice => choice.id === selectedId))
  const targetIndex = useRef(index), positioned = useRef(false)
  const multiple = choices.length > 1
  useLayoutEffect(() => {
    const el = track.current
    targetIndex.current = index
    if (el) {
      const smooth = positioned.current && !matchMedia('(prefers-reduced-motion: reduce)').matches
      el.scrollTo({ left: index * el.clientWidth, behavior: smooth ? 'smooth' : 'instant' })
      positioned.current = true
    }
  }, [index, choices.length])
  useEffect(() => {
    const el = track.current
    if (!el) return
    const observer = new ResizeObserver(() => el.scrollTo({ left: targetIndex.current * el.clientWidth, behavior: 'instant' }))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])
  useEffect(() => () => window.clearTimeout(scrollTimer.current), [choices, disabled])
  function startMoving() {
    if (moving.current) return
    moving.current = true
    current.current.onMovingChange?.(true)
  }
  function settle() {
    window.clearTimeout(scrollTimer.current)
    scrollTimer.current = window.setTimeout(() => {
      const el = track.current, state = current.current
      if (!el?.clientWidth || touching.current || state.disabled) return
      const nearestIndex = Math.max(0, Math.min(state.choices.length - 1, Math.round(el.scrollLeft / el.clientWidth)))
      const nearest = state.choices[nearestIndex]
      if (nearest && nearest.id !== state.selectedId) {
        state.onSelect(nearest.id)
        settle()
        return
      }
      // Wait for snapping as well as the selected offer's React commit before unlocking.
      if (Math.abs(el.scrollLeft - nearestIndex * el.clientWidth) > 1) {
        el.scrollTo({ left: nearestIndex * el.clientWidth, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
        settle()
        return
      }
      moving.current = false
      state.onMovingChange?.(false)
    }, 150)
  }
  function select(id: string) {
    if (id === selectedId && !moving.current) return
    startMoving()
    onSelect(id)
    settle()
  }
  function releaseTouch() { touching.current = false; touchOrigin.current = null; if (moving.current) settle() }
  const dots = choices.slice(Math.max(0, Math.min(index - 3, choices.length - 7)), Math.max(0, Math.min(index - 3, choices.length - 7)) + 7)
  return <div className={`booster-carousel ${multiple ? '' : 'booster-carousel-single'} ${disabled ? 'is-busy' : ''}`} role={multiple ? 'region' : undefined} aria-roledescription={multiple ? 'carrousel' : undefined} aria-label={multiple ? 'Choisir un booster' : undefined}>
    <div ref={track} className="booster-carousel-track" tabIndex={multiple ? 0 : -1} aria-label={multiple ? 'Sélection des boosters' : undefined} onKeyDown={event => {
      if (disabled || !multiple || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : Math.max(0, Math.min(choices.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)))
      select(choices[next].id)
    }} onTouchStart={event => {
      if (disabled || !multiple) return
      touching.current = false
      const touch = event.touches?.[0]
      touchOrigin.current = touch ? { x: touch.clientX, y: touch.clientY } : null
    }} onTouchMove={event => {
      if (disabled || !multiple) return
      const touch = event.touches?.[0], origin = touchOrigin.current
      if (!touch || !origin) return
      const dx = Math.abs(touch.clientX - origin.x), dy = Math.abs(touch.clientY - origin.y)
      if (dx < 6 || dx <= dy) return
      touching.current = true
      startMoving()
      settle()
    }} onTouchEnd={releaseTouch} onTouchCancel={releaseTouch} onWheel={event => {
      if (disabled || !multiple || Math.abs(event.deltaX) <= Math.abs(event.deltaY)) return
      startMoving()
      settle()
    }} onScroll={event => {
      const left = event.currentTarget.scrollLeft
      if (left === lastScrollLeft.current) return
      lastScrollLeft.current = left
      if (disabled || !multiple) return
      startMoving()
      settle()
    }}>
      {choices.map(choice => <div key={choice.id} className="booster-carousel-slide" aria-hidden={choice.id !== selectedId}>{onOpen ? <button className={`pack-interaction booster-size ${tearing && choice.id === selectedId ? 'is-opening' : ''}`} onClick={onOpen} tabIndex={choice.id === selectedId ? 0 : -1} disabled={disabled || !canOpen || choice.id !== selectedId} aria-label={`Ouvrir le booster ${choice.title}`} aria-busy={disabled && choice.id === selectedId}><BoosterPack booster={choice} tearing={tearing && choice.id === selectedId} /></button> : <div className="pack-preview booster-size"><BoosterPack booster={choice} /></div>}</div>)}
    </div>
    {multiple && <><button type="button" className="icon-button carousel-previous" aria-label="Booster précédent" disabled={disabled || index === 0} onClick={() => select(choices[index - 1].id)}><ChevronLeft size={22} /></button><button type="button" className="icon-button carousel-next" aria-label="Booster suivant" disabled={disabled || index === choices.length - 1} onClick={() => select(choices[index + 1].id)}><ChevronRight size={22} /></button><div className="booster-carousel-dots" aria-hidden="true">{dots.map(choice => <span key={choice.id} className={choice.id === selectedId ? 'is-current' : ''} />)}</div><span className="visually-hidden" role="status">{choices[index]?.title}, {index + 1} sur {choices.length}</span></>}
  </div>
}
