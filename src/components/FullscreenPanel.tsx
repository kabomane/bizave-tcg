import { useLayoutEffect, useRef, useState } from 'react'
import type { ReactNode, KeyboardEventHandler } from 'react'
import { ArrowUp, X } from 'lucide-react'
import { useSettings } from '../settings/useSettings'
import { lockPageScroll } from './scrollLock'
import { CardBackdrop } from './CardBackdrop'
import '../styles/shared-collection.css'

export function FullscreenPanel({ title, onClose, children, className = '', header, onKeyDown, accessibleTitle, scrollToTop = false }: { title: string; onClose: () => void; children: ReactNode; className?: string; header?: ReactNode; onKeyDown?: KeyboardEventHandler<HTMLDialogElement>; accessibleTitle?: string; scrollToTop?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null), { handedness } = useSettings()
  const body = useRef<HTMLDivElement>(null), [scrolled, setScrolled] = useState(false)
  useLayoutEffect(() => {
    const origin = document.activeElement as HTMLElement | null, element = dialog.current!, unlock = lockPageScroll()
    element.showModal(); element.focus({ preventScroll: true })
    return () => { element.close(); unlock(); if (origin?.isConnected) origin.focus({ preventScroll: true }) }
  }, [])
  const closeButton = <button type="button" className="viewer-glass viewer-close" aria-label="Fermer" onClick={onClose}><X size={20} /></button>
  return <dialog ref={dialog} tabIndex={-1} className={`fullscreen-panel ${className}`} aria-label={accessibleTitle ?? title} onKeyDown={onKeyDown} onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose() }}>
    <CardBackdrop className="fullscreen-panel-backdrop" color="var(--accent)" />
    <header className={`fullscreen-panel-header${handedness === 'left' ? ' close-left' : ''}`}><div><span>{title}</span>{header}</div>{scrollToTop ? <div className="fullscreen-panel-actions"><button type="button" className="viewer-glass fullscreen-panel-scroll-top" aria-label="Remonter en haut" aria-hidden={!scrolled} disabled={!scrolled} onClick={() => body.current?.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><ArrowUp size={20} /></button>{closeButton}</div> : closeButton}</header>
    <div ref={body} className="fullscreen-panel-body" onScroll={scrollToTop ? event => setScrolled(event.currentTarget.scrollTop > 0) : undefined}>{children}</div>
  </dialog>
}
