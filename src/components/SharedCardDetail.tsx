import { useLayoutEffect, useRef, useState } from 'react'
import { Star, X } from 'lucide-react'
import type { SharedVariant } from '../collection/collectionSnapshot'
import { cardById } from '../data/cards'
import { variantKey } from '../game/engine'
import { ART_LABELS, FINISH_LABELS } from '../game/config'
import { useSettings } from '../settings/useSettings'
import { ViewerCarousel, type ViewerCarouselHandle } from './ViewerCarousel'
import { FinishDot } from './FinishDot'
import { CardBackdrop } from './CardBackdrop'
import { lockPageScroll } from './scrollLock'

// Read-only presentation using the personal collection's native scroll-snap carousel.
export function SharedCardDetail({ variants, onClose }: { variants: readonly SharedVariant[]; onClose: () => void }) {
  const [index, setIndex] = useState(0)
  const dialog = useRef<HTMLDialogElement>(null), carousel = useRef<ViewerCarouselHandle>(null)
  const { handedness } = useSettings()
  const variant = variants[index], definition = cardById.get(variant.cardId)!
  useLayoutEffect(() => {
    const origin = document.activeElement as HTMLElement | null, element = dialog.current!, unlock = lockPageScroll()
    element.showModal(); element.focus({ preventScroll: true }); document.body.classList.add('card-viewer-open')
    return () => { element.close(); document.body.classList.remove('card-viewer-open'); unlock(); if (origin?.isConnected) origin.focus({ preventScroll: true }) }
  }, [])
  const move = (next: number) => carousel.current?.move(next)
  return <dialog ref={dialog} tabIndex={-1} className="card-viewer shared-card-detail" aria-label={definition.title} onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose() }} onKeyDownCapture={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); event.stopPropagation(); move(index + (event.key === 'ArrowRight' ? 1 : -1)) } }}>
    <CardBackdrop className="viewer-backdrop" rarity={definition.rarity} />
    <div className={`viewer-top${handedness === 'left' ? ' close-left' : ''}`}><button type="button" className="viewer-glass viewer-close" aria-label="Fermer" onClick={onClose}><X size={20} /></button></div>
    <div className="viewer-main"><ViewerCarousel ref={carousel} entries={variants.map(card => ({ key: variantKey(card), card }))} index={index} onIndexChange={setIndex} />
      <div className="viewer-meta shared-detail-meta" aria-live="polite"><span className="shared-detail-label"><span>{FINISH_LABELS[variant.finish]} · {ART_LABELS[variant.artVariant]}</span><b>×{variant.quantity}</b></span>{variant.favorite && <span className="shared-favorite" role="img" aria-label="Favori"><Star size={14} fill="currentColor" aria-hidden="true" /></span>}</div>
      <div className="viewer-dots">{variants.length > 1 && variants.map((item, i) => <button type="button" key={variantKey(item)} aria-current={i === index ? 'true' : undefined} aria-label={`${FINISH_LABELS[item.finish]}, ${ART_LABELS[item.artVariant]}, ${item.quantity} exemplaires`} onClick={() => move(i)}><FinishDot card={item} active={index === i} /></button>)}</div>
    </div>
  </dialog>
}
