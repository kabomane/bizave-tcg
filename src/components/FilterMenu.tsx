import { useEffect, useId, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

export function FilterMenu({ label, active = false, count, children }: { label: string; active?: boolean; count?: number; children: ReactNode }) {
  const [open, setOpen] = useState(false)
  const id = useId(), root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), panel = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    panel.current?.querySelector<HTMLElement>('[role^="menuitem"]')?.focus()
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('pointerdown', outside)
    return () => document.removeEventListener('pointerdown', outside)
  }, [open])
  return <div ref={root} className={`filter-menu ${active ? 'filter-active' : ''}`} onBlur={event => { if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) setOpen(false) }}>
    <button ref={trigger} className="filter-trigger" aria-haspopup="menu" aria-expanded={open} aria-controls={id} onClick={() => setOpen(value => !value)} onKeyDown={event => { if (event.key === 'ArrowDown' || event.key === 'ArrowUp') { event.preventDefault(); setOpen(true) } }}>{label}{count ? <span className="filter-count">{count}</span> : null}<ChevronDown size={14} className={open ? 'chevron-open' : ''} /></button>
    {open && <div ref={panel} id={id} role="menu" aria-label={label} className="filter-panel" onKeyDown={event => {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); setOpen(false); trigger.current?.focus() }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
        event.preventDefault()
        const options = [...event.currentTarget.querySelectorAll<HTMLElement>('[role^="menuitem"]')]
        const index = options.indexOf(document.activeElement as HTMLElement)
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? options.length - 1 : (index + (event.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length
        options[next]?.focus()
      }
    }}>{children}</div>}
  </div>
}
