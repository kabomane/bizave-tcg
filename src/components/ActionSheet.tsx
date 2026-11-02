import { useLayoutEffect, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { lockPageScroll } from './scrollLock'

export function ActionSheet({ title, children, onClose, style, className = '' }: { title: string; children: ReactNode; onClose: () => void; style?: CSSProperties; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null)
  useLayoutEffect(() => {
    const dialog = ref.current!, origin = document.activeElement as HTMLElement | null, unlock = lockPageScroll()
    dialog.showModal(); dialog.focus({ preventScroll: true })
    return () => { dialog.close(); unlock(); if (origin?.isConnected) origin.focus({ preventScroll: true }) }
  }, [])
  return <dialog ref={ref} className={`action-sheet ${className}`} style={style} tabIndex={-1} aria-label={title} onCancel={event => { event.preventDefault(); event.stopPropagation(); onClose() }} onClick={event => {
    if (event.target !== event.currentTarget) return
    const box = event.currentTarget.getBoundingClientRect()
    if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) onClose()
  }}>{children}</dialog>
}
