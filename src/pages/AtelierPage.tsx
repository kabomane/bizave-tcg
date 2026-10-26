import { useMemo, useState } from 'react'
import { Gem, Layers3, Recycle } from 'lucide-react'
import { useGame } from '../components/useGame'
import { cardById } from '../data/cards'
import { getRecycleFragments, variantKey } from '../game/engine'
import { duplicateDrops, recycleDrops } from '../storage/services'
import { EmptyState, ErrorNotice, Modal } from '../components/ui'
import { errorText } from '../components/format'

export function AtelierPage() {
  const { drops } = useGame()
  const [selected, setSelected] = useState<string[]>([]), [confirm, setConfirm] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const duplicates = useMemo(() => duplicateDrops(drops), [drops])
  const groups = useMemo(() => {
    const map = new Map<string, typeof duplicates>()
    for (const drop of duplicates) { const key = variantKey(drop); map.set(key, [...(map.get(key) ?? []), drop]) }
    return [...map.values()]
  }, [duplicates])
  const safeSelection = selected.filter(id => duplicates.some(d => d.dropId === id))
  const gain = duplicates.filter(d => safeSelection.includes(d.dropId)).reduce((sum, d) => sum + getRecycleFragments(cardById.get(d.cardId)!.rarity, d.finish, d.artVariant), 0)
  async function recycle() {
    if (busy) return
    setBusy(true); setError('')
    try { await recycleDrops(safeSelection); setSelected([]); setConfirm(false) } catch (e) { setError(errorText(e)) } finally { setBusy(false) }
  }
  return <><div className="page-heading"><div className="title-with-count"><h1 className="page-title">Atelier</h1><span>{duplicates.length}</span></div><span className="heading-caption">Vos doublons</span></div>
    {groups.length ? <section className="recycle-section"><div className="selection-toolbar"><label className="checkbox-label"><input type="checkbox" checked={safeSelection.length === duplicates.length} onChange={e => setSelected(e.target.checked ? duplicates.map(d => d.dropId) : [])} /> Tout sélectionner</label><span>Une copie de chaque variante est conservée.</span></div><div className="duplicate-list">{groups.map(group => {
      const first = group[0], card = cardById.get(first.cardId)!, value = getRecycleFragments(card.rarity, first.finish, first.artVariant)
      const checked = group.every(d => safeSelection.includes(d.dropId))
      return <label key={variantKey(first)} className={`duplicate-row ${checked ? 'is-selected' : ''}`}><input type="checkbox" checked={checked} onChange={e => setSelected(current => e.target.checked ? [...new Set([...current, ...group.map(d => d.dropId)])] : current.filter(id => !group.some(d => d.dropId === id)))} /><img src={card.artwork[first.artVariant]} alt="" /><div><strong>{card.title}</strong><span>{group.length} carte{group.length > 1 ? 's' : ''}</span></div><b><Gem size={13} /> {value * group.length}</b></label>
    })}</div><div className="recycle-summary"><span>{safeSelection.length} sélectionné{safeSelection.length > 1 ? 's' : ''}</span><button className="primary-button" disabled={!safeSelection.length || busy} onClick={() => setConfirm(true)}><Recycle size={15} /> Recycler <span className="button-value">+{gain} <Gem size={12} /></span></button></div></section> : <EmptyState icon={<Layers3 size={25} />} title="Aucun doublon.">Ils apparaîtront ici.</EmptyState>}
    <ErrorNotice error={error} />
    {confirm && <Modal title="Recycler les doublons" onClose={() => { if (!busy) setConfirm(false) }}><div className="confirm-content"><div className="confirm-icon"><Recycle size={28} /></div><h3>{safeSelection.length} cartes → {gain} fragments</h3><p>Les cartes sélectionnées seront détruites. Vos dernières copies sont conservées.</p><ErrorNotice error={error} /><button className="primary-button" disabled={busy || !safeSelection.length} onClick={recycle}>Recycler</button><button className="text-button" disabled={busy} onClick={() => setConfirm(false)}>Annuler</button></div></Modal>}
  </>
}
