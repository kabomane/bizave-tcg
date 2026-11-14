import { useEffect, useRef } from 'react'
import type { Card, CardDefinition } from '../game/types'
import { CollectibleCard } from './CollectibleCard'

export function ViewerCard({ card, definition, presentation, ready, onReady, onActivate }: { card: Omit<Card, 'dropId'> & { dropId?: string }; definition: CardDefinition; presentation: 'detail' | 'thumbnail'; ready: boolean; onReady: (source: string) => void; onActivate?: () => void }) {
  const root = useRef<HTMLDivElement>(null)
  const source = definition.artwork[card.artVariant]
  useEffect(() => {
    if (ready) return
    let current = true
    const image = root.current!.querySelector<HTMLImageElement>('.custom-art')!
    image.loading = 'eager'
    // Decode the displayed image and settle typography before the reveal. A failed
    // illustration still reveals the card's text and native image fallback.
    void Promise.all([image.decode().catch(() => {}), document.fonts.ready.catch(() => {})]).then(() => {
      if (current) onReady(source)
    })
    return () => { current = false }
  }, [source, ready, onReady])
  return <div ref={root} className="viewer-card-shell" data-ready={ready} aria-busy={!ready}>
    <div className="viewer-card-face" inert={!ready}><CollectibleCard card={card} definition={definition} presentation={presentation} onActivate={onActivate} /></div>
    <div className="viewer-card-placeholder" aria-hidden="true" />
    {!ready && presentation === 'detail' && <span className="visually-hidden" role="status">Chargement de la carte</span>}
  </div>
}
