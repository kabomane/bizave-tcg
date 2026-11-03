import { useEffect, useRef, type CSSProperties, type KeyboardEvent } from 'react'
import { Minus, Plus } from 'lucide-react'

export function FragmentAmountPicker({ value, max, onChange, disabled = false, balance = max }: { value: number; max: number; onChange: (amount: number) => void; disabled?: boolean; balance?: number }) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const slider = useRef<HTMLDivElement>(null)
  const current = useRef(value)
  const bounds = useRef(max)
  const update = useRef(onChange)
  useEffect(() => { current.current = value; bounds.current = max; update.current = onChange }, [value, max, onChange])
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => { slider.current?.focus({ preventScroll: true }) }, [])
  function set(amount: number) { current.current = Math.max(0, Math.min(bounds.current, Math.round(amount))); update.current(current.current) }
  function stop() { clearTimeout(timer.current) }
  function repeat(direction: number) {
    stop(); let count = 0
    const tick = () => {
      set(current.current + direction * (count > 28 ? 10 : count > 12 ? 5 : 1)); count++
      timer.current = setTimeout(tick, count === 1 ? 380 : count > 12 ? 50 : 90)
    }
    tick()
  }
  function keyboard(event: KeyboardEvent) {
    if (disabled || event.ctrlKey || event.metaKey || event.altKey) return
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      event.preventDefault(); set(value + (/Right|Up/.test(event.key) ? 1 : -1) * (event.shiftKey ? 10 : 1))
    } else if (/^[0-9]$/.test(event.key)) { event.preventDefault(); set(Number(`${value || ''}${event.key}`)) }
    else if (event.key === 'Backspace') { event.preventDefault(); set(Math.floor(value / 10)) }
    else if (event.key === 'Home') { event.preventDefault(); set(0) }
    else if (event.key === 'End') { event.preventDefault(); set(max) }
  }
  return <div className="fragment-amount" onKeyDown={keyboard}>
    <div className="fragment-fine">{[-1, 1].map(direction => <button key={direction} type="button" className="amount-step" aria-label={direction < 0 ? 'Diminuer le montant' : 'Augmenter le montant'} disabled={disabled || (direction < 0 ? value <= 0 : value >= max)}
      onPointerDown={event => { if (event.button !== 0) return; event.preventDefault(); event.currentTarget.setPointerCapture(event.pointerId); repeat(direction) }} onPointerUp={stop} onPointerCancel={stop} onLostPointerCapture={stop} onBlur={stop} onContextMenu={event => event.preventDefault()} onClick={event => { if (event.detail === 0) set(value + direction) }}>{direction < 0 ? <Minus size={19} /> : <Plus size={19} />}</button>)}<output className="fragment-number" aria-label="Montant">{value.toLocaleString('fr-FR')}</output></div>
    <p className="amount-balance">Solde {balance.toLocaleString('fr-FR')} · après envoi {(balance - value).toLocaleString('fr-FR')}</p>
    <div className="fragment-ruler" style={{ '--amount-position': `${max ? Math.sqrt(value / max) * 100 : 0}%` } as CSSProperties}>
      <div ref={slider} role="slider" tabIndex={disabled ? -1 : 0} aria-disabled={disabled || undefined} aria-label="Montant à envoyer" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${value} fragments`} className="fragment-slider"
        onPointerDown={event => { if (disabled || event.button !== 0) return; event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId); const box = event.currentTarget.getBoundingClientRect(); set(max * Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)) ** 2) }}
        onPointerMove={event => { if (!disabled && event.currentTarget.hasPointerCapture(event.pointerId)) { const box = event.currentTarget.getBoundingClientRect(); set(max * Math.max(0, Math.min(1, (event.clientX - box.left) / box.width)) ** 2) } }}>
        <span className="ruler-ticks" /><span className="ruler-fill" /><span className="ruler-thumb" />
      </div>
      <div className="ruler-ends"><span>0</span><button type="button" className="text-button" disabled={disabled} onClick={() => set(max)}>Max · {max.toLocaleString('fr-FR')}</button></div>
    </div>
  </div>
}
