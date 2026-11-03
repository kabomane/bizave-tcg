import { useEffect, useRef, useState, type ReactNode } from 'react'

export function HoldButton({ onConfirm, disabled = false, children }: { onConfirm: () => void; disabled?: boolean; children: ReactNode }) {
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const [holding, setHolding] = useState(false)
  function cancel() { clearTimeout(timer.current); timer.current = undefined; setHolding(false) }
  useEffect(() => () => clearTimeout(timer.current), [])
  useEffect(() => { if (disabled) clearTimeout(timer.current) }, [disabled])
  return <button type="button" className={`primary-button hold-button ${holding && !disabled ? 'is-holding' : ''}`} disabled={disabled}
    onContextMenu={event => event.preventDefault()}
    onPointerDown={event => {
      if (disabled || event.button !== 0) return
      event.preventDefault(); event.currentTarget.focus(); event.currentTarget.setPointerCapture(event.pointerId)
      cancel(); setHolding(true)
      timer.current = setTimeout(() => { cancel(); onConfirm() }, 900)
    }} onPointerUp={cancel} onPointerCancel={cancel} onLostPointerCapture={cancel} onBlur={cancel}
    onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); cancel(); if (!disabled && !event.repeat) onConfirm() } }}
    onClick={event => { if (event.detail === 0 && !disabled) onConfirm() }}>
    <span className="hold-fill" aria-hidden="true" /><span className="hold-label">{children}</span>
  </button>
}
