import { useLayoutEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { DEFAULT_COLLECTION_DISPLAY } from '../collection/preferences'
import type { CollectionDisplay } from '../collection/preferences'
import { Modal } from './ui'

function Choices<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: readonly { value: T; label: string }[]; onChange: (value: T) => void }) {
  return <fieldset className="display-field"><legend>{label}</legend><div className="display-segmented">{options.map(option => <button key={option.value} type="button" aria-pressed={value === option.value} className="display-option" onClick={() => onChange(option.value)}>{option.label}</button>)}</div></fieldset>
}

export function CollectionDisplayOptions({ value, onChange, onClose, anchor, error }: { value: CollectionDisplay; onChange: (value: CollectionDisplay) => void; onClose: () => void; anchor: DOMRect; error: ReactNode }) {
  const position = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const dialog = position.current?.closest('dialog')
    if (!dialog) return
    dialog.style.setProperty('--display-left', `${Math.max(16, Math.min(anchor.right - 340, window.innerWidth - 356))}px`)
    dialog.style.setProperty('--display-top', `${Math.max(16, Math.min(anchor.bottom + 10, window.innerHeight - 220))}px`)
  }, [anchor])
  const directions = value.sort === 'name' ? ['A → Z', 'Z → A'] : value.sort === 'number' ? ['Croissant', 'Décroissant'] : ['Plus ancien', 'Plus récent']
  return <Modal title="Affichage" className="collection-display-modal" onClose={onClose}><div ref={position}>
    <Choices label="Trier par" value={value.sort} options={[{ value: 'name', label: 'Nom' }, { value: 'number', label: 'Ordre des cartes' }, { value: 'obtained', label: 'Date d’obtention' }]} onChange={sort => onChange({ ...value, sort })} />
    <Choices label="Sens" value={value.direction} options={[{ value: 'asc', label: directions[0] }, { value: 'desc', label: directions[1] }]} onChange={direction => onChange({ ...value, direction })} />
    <Choices label="Regrouper" value={value.groupBy} options={[{ value: 'none', label: 'Aucun' }, { value: 'card', label: 'Par carte' }, { value: 'format', label: 'Par carte et format' }]} onChange={groupBy => onChange({ ...value, groupBy })} />
    <Choices label="Doublons" value={value.duplicates} options={[{ value: 'hide', label: 'Cacher' }, { value: 'show', label: 'Afficher' }]} onChange={duplicates => onChange({ ...value, duplicates })} />
    {error}<button type="button" className="text-button display-reset" onClick={() => onChange({ ...DEFAULT_COLLECTION_DISPLAY })}>Réinitialiser</button>
  </div></Modal>
}
