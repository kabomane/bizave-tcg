import { useLayoutEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { ART_LABELS, FINISH_LABELS, RARITY_LABELS } from '../game/config'
import { resolveBoosterRates } from '../game/boosterRates'
import { CardBackdrop } from './CardBackdrop'
import { ShopCarousel } from './ShopCarousel'
import { lockPageScroll } from './scrollLock'
import { useSettings } from '../settings/useSettings'
import '../styles/rates-viewer.css'

type RatesEntry = { id: string; title: string; group?: string; meta: string; rates: ReturnType<typeof resolveBoosterRates> }
const axes = [
  { id: 'rarity', title: 'Rareté', labels: RARITY_LABELS },
  { id: 'finish', title: 'Finition', labels: FINISH_LABELS },
  { id: 'illustration', title: 'Illustration', labels: ART_LABELS },
] as const
const carouselLabels = { region: 'Catégories des taux', selection: 'Choisir une catégorie de taux', previous: 'Catégorie précédente', next: 'Catégorie suivante' }

export function RatesViewer({ entries, initialId, onClose }: { entries: RatesEntry[]; initialId?: string; onClose: () => void }) {
  const [selected, setSelected] = useState(initialId ?? entries[0]?.id)
  const [axis, setAxis] = useState<(typeof axes)[number]['id']>('rarity')
  const dialog = useRef<HTMLDialogElement>(null)
  const { handedness } = useSettings()
  useLayoutEffect(() => {
    // Safari does not focus buttons on pointer clicks; keep the actual opener.
    const origin = document.querySelector<HTMLElement>('.booster-section-heading .drop-rates-trigger') ?? document.activeElement as HTMLElement | null
    const el = dialog.current!, unlock = lockPageScroll()
    el.showModal(); el.focus({ preventScroll: true })
    document.body.classList.add('card-viewer-open')
    return () => { el.close(); document.body.classList.remove('card-viewer-open'); unlock(); if (origin?.isConnected) origin.focus({ preventScroll: true }) }
  }, [])
  const entry = entries.find(e => e.id === selected) ?? entries[0]
  const groups = [...new Set(entries.map(e => e.group ?? 'Boosters'))]
  if (!entry) return null
  return <dialog ref={dialog} tabIndex={-1} className="rates-viewer" aria-label="Taux de drop" onCancel={e => { e.preventDefault(); onClose() }}>
    <CardBackdrop className="rates-viewer-backdrop" color="var(--accent)" />
    <header className={`viewer-top rates-viewer-top${handedness === 'left' ? ' close-left' : ''}`}><span>Taux de drop</span><button className="viewer-glass viewer-close" aria-label="Fermer" onClick={onClose}><X size={20} /></button></header>
    <div className="rates-viewer-content">
      <nav className={`rates-tags${groups.length === 1 ? ' is-single-group' : ''}`} aria-label="Choisir les taux de drop">{groups.map(group => <section className="rates-tag-group" key={group} aria-label={group}><h2>{group}</h2><div>{entries.filter(e => (e.group ?? 'Boosters') === group).map(e => <button key={e.id} aria-label={e.title} aria-pressed={entry.id === e.id} onClick={() => setSelected(e.id)}>{e.title}</button>)}</div></section>)}</nav>
      <main className="rates-viewer-stage">
        <ShopCarousel choices={axes} selectedId={axis} onSelect={setAxis} labels={carouselLabels} renderChoice={category => <section className="rates-axis" aria-label={category.title}>
          <h2>{category.title}</h2>
          <div className="rates-description"><p className="rates-entry-meta">{entry.meta}</p><p className="rates-independence">Taux par carte · Les trois tirages sont indépendants.</p></div>
          <dl>{Object.entries(category.labels).map(([id, label]) => {
            const rate = (entry.rates[category.id] as Record<string, number>)[id]
            return <div key={id} className={rate === 0 ? 'is-zero' : undefined}><dt>{label}</dt><span className="rates-bar" aria-hidden="true"><i style={{ width: `${rate}%` }} /></span><dd>{rate} <small>%</small></dd></div>
          })}</dl>
        </section>} />
      </main>
    </div>
  </dialog>
}
