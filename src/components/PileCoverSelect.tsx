import { useEffect, useId, useRef, useState } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import type { CollectionDisplay } from '../collection/preferences'

const options = [
  { value: 'latest', label: 'Dernière obtenue' },
  { value: 'rarest', label: 'Plus rare' },
  { value: 'leastRare', label: 'Moins rare' },
] as const

export function PileCoverSelect({ value, onChange }: { value: CollectionDisplay['pileCover']; onChange: (value: CollectionDisplay['pileCover']) => void }) {
  const [open, setOpen] = useState(false)
  const id = useId()
  const root = useRef<HTMLDivElement>(null)
  const trigger = useRef<HTMLButtonElement>(null)
  const entries = useRef<(HTMLButtonElement | null)[]>([])
  const selected = options.findIndex(option => option.value === value)

  useEffect(() => {
    if (!open) return
    entries.current[selected]?.focus({ preventScroll: true })
    const dismiss = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', dismiss)
    return () => document.removeEventListener('pointerdown', dismiss)
  }, [open, selected])

  function close() { setOpen(false); trigger.current?.focus({ preventScroll: true }) }
  function choose(index: number) { onChange(options[index].value); close() }

  return <div className="settings-custom-select" ref={root}>
    <button ref={trigger} id="pile-cover" type="button" role="combobox" aria-label="Carte sur les piles" aria-haspopup="listbox" aria-expanded={open} aria-controls={id} onClick={() => setOpen(current => !current)} onKeyDown={event => {
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) { event.preventDefault(); setOpen(true) }
    }}><span>{options[selected].label}</span><ChevronDown size={15} aria-hidden="true" /></button>
    {open && <div id={id} className="settings-select-menu" role="listbox" aria-label="Carte sur les piles" onKeyDown={event => {
      const current = entries.current.indexOf(document.activeElement as HTMLButtonElement)
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close() }
      else if (event.key === 'Tab') close()
      else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault()
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
        entries.current[next]?.focus()
      }
    }}>
      {options.map((option, index) => <button ref={element => { entries.current[index] = element }} key={option.value} type="button" role="option" aria-selected={value === option.value} tabIndex={-1} onClick={() => choose(index)}><span>{option.label}</span>{value === option.value && <Check size={14} aria-hidden="true" />}</button>)}
    </div>}
  </div>
}
