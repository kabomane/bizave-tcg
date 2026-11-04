import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Check, Gem, ShoppingBag, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useSettings } from '../settings/useSettings'
import { CardBackdrop } from './CardBackdrop'
import { lockPageScroll } from './scrollLock'
import { useCardTilt } from './useCardTilt'

export type ReceiveOrigin = 'fragments' | 'friends'
const format = (value: number) => value.toLocaleString('fr-FR')

export function ReceivedFragmentsViewer({ amount, balance, sender, origin, onClose }: { amount: number; balance: number; sender: string; origin: ReceiveOrigin; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const { handedness } = useSettings()
  const navigate = useNavigate()
  const { wrapperRef, elementRef } = useCardTilt(true)
  const [progress, setProgress] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0)
  useLayoutEffect(() => {
    const previous = document.activeElement as HTMLElement | null, el = dialog.current!, unlock = lockPageScroll()
    el.showModal(); el.focus({ preventScroll: true }); document.body.classList.add('card-viewer-open')
    return () => { el.close(); document.body.classList.remove('card-viewer-open'); unlock(); if (previous?.isConnected) previous.focus({ preventScroll: true }) }
  }, [])
  useEffect(() => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)')
    let frame = 0
    const start = performance.now() + 450
    const tick = (now: number) => {
      const fraction = reduced.matches ? 1 : Math.max(0, Math.min(1, (now - start) / 900))
      setProgress(1 - (1 - fraction) ** 3)
      if (fraction < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])
  function go(path: string) { onClose(); navigate(path) }
  const displayedAmount = Math.round(amount * progress)
  return <dialog ref={dialog} tabIndex={-1} className="card-viewer is-received received-fragments-viewer" aria-label="Fragments reçus" onCancel={event => { event.preventDefault(); onClose() }}>
    <CardBackdrop className="viewer-backdrop" color="var(--accent)" />
    <div className={`viewer-top${handedness === 'left' ? ' close-left' : ''}`}><button type="button" className="viewer-glass viewer-close" aria-label="Fermer" onClick={onClose}><X size={20} /></button></div>
    <div className="viewer-main">
      <div className="viewer-card received-fragment-arrival">
        <div ref={wrapperRef} className="received-fragment-tilt">
          <article ref={elementRef} className="received-fragment-card" tabIndex={0} aria-label={`${format(amount)} fragments, de la part de ${sender}`}>
            <i className="received-fragment-ornament" aria-hidden="true" />
            <span className="received-fragment-brand">Bizave · TCG</span>
            <Gem className="received-fragment-gem" aria-hidden="true" strokeWidth={1.1} />
            <span className={`received-fragment-amount${format(amount).length > 6 ? ' is-large' : ''}`} aria-hidden="true">+{format(displayedAmount)}</span>
            <span className="received-fragment-unit">{amount === 1 ? 'fragment' : 'fragments'}</span>
            <span className="received-fragment-sender">de la part de {sender}</span>
            <i className="received-fragment-sheen" aria-hidden="true" />
          </article>
        </div>
      </div>
      <p className="received-fragment-balance" aria-hidden="true"><Gem size={13} />Nouveau solde · <b>{format(balance - amount + displayedAmount)}</b></p>
      <p className="visually-hidden" role="status">{format(amount)} fragments reçus de {sender}. Nouveau solde : {format(balance)} fragments.</p>
    </div>
    <div className="viewer-dock"><button type="button" onClick={() => go('/boutique')}><ShoppingBag size={21} /><span>Boutique</span></button>{origin === 'fragments'
      ? <button type="button" onClick={onClose}><Check size={21} /><span>Terminé</span></button>
      : <button type="button" onClick={() => go('/fragments')}><Gem size={21} /><span>Mes fragments</span></button>}</div>
  </dialog>
}
