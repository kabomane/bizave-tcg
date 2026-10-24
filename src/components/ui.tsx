import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { lockPageScroll } from './scrollLock'

export function Modal({ title, children, onClose, wide = false, showTitle = true, className = '', headerStart, headerCenter, viewKey }: { title: string; children: ReactNode; onClose: () => void; wide?: boolean; showTitle?: boolean; className?: string; headerStart?: ReactNode; headerCenter?: ReactNode; viewKey?: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  useLayoutEffect(() => {
    const unlock = lockPageScroll()
    const el = dialog.current!; el.showModal(); el.focus({ preventScroll: true })
    return () => { el.close(); unlock() }
  }, [])
  useLayoutEffect(() => {
    if (viewKey === undefined) return
    dialog.current!.scrollTop = 0
    dialog.current!.focus({ preventScroll: true })
  }, [viewKey])
  return <dialog ref={dialog} tabIndex={-1} className={`modal ${wide ? 'modal-wide' : ''} ${className}`} onCancel={event => { event.preventDefault(); onClose() }} onClick={event => { if (event.target === event.currentTarget) { const r = event.currentTarget.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) onClose() } }} aria-label={title}>
    <div className={`modal-header ${showTitle ? '' : 'modal-header-titleless'} ${headerStart ? 'modal-header-with-start' : ''} ${headerCenter ? 'modal-header-with-center' : ''}`}>{headerStart}{showTitle && <h2>{title}</h2>}{headerCenter && <div className="modal-header-center">{headerCenter}</div>}<button className="icon-button" aria-label="Fermer" onClick={onClose}><X size={19} /></button></div>{children}
  </dialog>
}
export function EmptyState({ icon, title, children, action }: { icon: ReactNode; title: string; children: ReactNode; action?: ReactNode }) {
  return <div className="empty-state"><div className="empty-icon">{icon}</div><h2>{title}</h2><p>{children}</p>{action}</div>
}
export function ErrorNotice({ error }: { error: string }) { return error ? <p role="alert" className="error-notice">{error}</p> : null }
