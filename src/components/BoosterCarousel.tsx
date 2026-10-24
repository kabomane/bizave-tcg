import { useEffect, useLayoutEffect, useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { BoosterDefinition } from '../game/types'
import { BoosterPack } from './BoosterPack'

export function BoosterCarousel({ choices, selectedId, onSelect, onOpen, disabled, canOpen, tearing }: { choices: readonly BoosterDefinition[]; selectedId: string; onSelect: (id: string) => void; onOpen: () => void; disabled: boolean; canOpen: boolean; tearing: boolean }) {
  const track = useRef<HTMLDivElement>(null), scrollTimer = useRef<number | undefined>(undefined)
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
  const dots = choices.slice(Math.max(0, Math.min(index - 3, choices.length - 7)), Math.max(0, Math.min(index - 3, choices.length - 7)) + 7)
  return <div className={`booster-carousel ${multiple ? '' : 'booster-carousel-single'} ${disabled ? 'is-busy' : ''}`} role={multiple ? 'region' : undefined} aria-roledescription={multiple ? 'carrousel' : undefined} aria-label={multiple ? 'Choisir un booster' : undefined}>
    <div ref={track} className="booster-carousel-track" tabIndex={multiple ? 0 : -1} aria-label={multiple ? 'Sélection des boosters' : undefined} onKeyDown={event => {
      if (disabled || !multiple || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
      event.preventDefault()
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? choices.length - 1 : Math.max(0, Math.min(choices.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)))
      onSelect(choices[next].id)
    }} onScroll={() => {
      if (disabled || !multiple) return
      window.clearTimeout(scrollTimer.current)
      scrollTimer.current = window.setTimeout(() => {
        const el = track.current
        if (!el?.clientWidth) return
        const nearest = choices[Math.max(0, Math.min(choices.length - 1, Math.round(el.scrollLeft / el.clientWidth)))]
        if (nearest && nearest.id !== selectedId) onSelect(nearest.id)
      }, 120)
    }}>
      {choices.map(choice => <div key={choice.id} className="booster-carousel-slide" aria-hidden={choice.id !== selectedId}><button className={`pack-interaction booster-size ${tearing && choice.id === selectedId ? 'is-opening' : ''}`} onClick={onOpen} tabIndex={choice.id === selectedId ? 0 : -1} disabled={disabled || !canOpen || choice.id !== selectedId} aria-label={`Ouvrir le booster ${choice.title}`} aria-busy={disabled && choice.id === selectedId}><BoosterPack booster={choice} tearing={tearing && choice.id === selectedId} /></button></div>)}
    </div>
    {multiple && <><button type="button" className="icon-button carousel-previous" aria-label="Booster précédent" disabled={disabled || index === 0} onClick={() => onSelect(choices[index - 1].id)}><ChevronLeft size={22} /></button><button type="button" className="icon-button carousel-next" aria-label="Booster suivant" disabled={disabled || index === choices.length - 1} onClick={() => onSelect(choices[index + 1].id)}><ChevronRight size={22} /></button><div className="booster-carousel-dots" aria-hidden="true">{dots.map(choice => <span key={choice.id} className={choice.id === selectedId ? 'is-current' : ''} />)}</div><span className="visually-hidden" role="status">{choices[index]?.title}, {index + 1} sur {choices.length}</span></>}
  </div>
}
