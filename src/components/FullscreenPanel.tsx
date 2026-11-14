import { useLayoutEffect, useRef } from 'react'
import type { ReactNode, KeyboardEventHandler } from 'react'
import { X } from 'lucide-react'
import { useSettings } from '../settings/useSettings'
import { lockPageScroll } from './scrollLock'
import { CardBackdrop } from './CardBackdrop'
import '../styles/shared-collection.css'

export function FullscreenPanel({ title, onClose, children, className = '', header, onKeyDown, accessibleTitle }: { title: string; onClose: () => void; children: ReactNode; className?: string; header?: ReactNode; onKeyDown?: KeyboardEventHandler<HTMLDialogElement>; accessibleTitle?: string }) {
  const dialog = useRef<HTMLDialogElement>(null), { handedness } = useSettings()
  useLayoutEffect(() => {
    const origin = document.activeElement as HTMLElement | null, element = dialog.current!, unlock = lockPageScroll()
    element.showModal(); element.focus({ preventScroll: true })
    return () => { element.close(); unlock(); if (origin?.isConnected) origin.focus({ preventScroll: true }) }
  }, [])
  return <dialog ref={dialog} tabIndex={-1} className={`fullscreen-panel ${className}`} aria-label={accessibleTitle ?? title} onKeyDown={onKeyDown} onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose() }}>
    <CardBackdrop className="fullscreen-panel-backdrop" color="var(--accent)" />
    <header className={`fullscreen-panel-header${handedness === 'left' ? ' close-left' : ''}`}><div><span>{title}</span>{header}</div><button type="button" className="viewer-glass viewer-close" aria-label="Fermer" onClick={onClose}><X size={20} /></button></header>
    <div className="fullscreen-panel-body">{children}</div>
  </dialog>
}
