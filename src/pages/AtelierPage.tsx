import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../storage/database'
import { ArrowLeftRight, Gem, Layers3, Recycle } from 'lucide-react'
import { useGame } from '../components/useGame'
import { cardById } from '../data/cards'
import { matchesCardSearch } from '../game/cardSearch'
import { getRecycleFragments, variantKey } from '../game/engine'
import { duplicateDrops, recycleDrops } from '../storage/services'
import { EmptyState, ErrorNotice } from '../components/ui'
import { CardFilters } from '../components/CardFilters'
import { CardSearchRow } from '../components/CardSearchRow'
import { EMPTY_CARD_FILTERS, matchesCardFilters } from '../collection/filters'
import type { CardFilterValue } from '../collection/filters'
import { ActionSheet } from '../components/ActionSheet'
import { errorText } from '../components/format'

export function AtelierPage() {
  const { drops } = useGame()
  const favorites = useLiveQuery(() => db.favorites.toArray(), [], undefined)
  const favoriteKeys = useMemo(() => new Set(favorites?.map(row => row.key)), [favorites])
  const [selected, setSelected] = useState<string[]>([]), [confirm, setConfirm] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const [includeLast, setIncludeLast] = useState(false), [filters, setFilters] = useState(EMPTY_CARD_FILTERS)
  const [search, setSearch] = useState(''), [favoritesOnly, setFavoritesOnly] = useState(false)
  const owned = useMemo(() => drops.filter(drop => drop.status === 'owned'), [drops])
  const duplicates = useMemo(() => duplicateDrops(owned), [owned])
  const candidates = useMemo(() => favorites === undefined ? [] : (includeLast ? owned : duplicates).filter(drop => favoriteKeys.has(variantKey(drop)) === favoritesOnly), [includeLast, owned, duplicates, favorites, favoriteKeys, favoritesOnly])
  const visible = useMemo(() => candidates.filter(drop => matchesCardFilters(drop, filters) && matchesCardSearch(cardById.get(drop.cardId)!, search)), [candidates, filters, search])
  const groups = useMemo(() => {
    const map = new Map<string, typeof visible>()
    for (const drop of visible) { const key = variantKey(drop); map.set(key, [...(map.get(key) ?? []), drop]) }
    return [...map.values()]
  }, [visible])
  const visibleIds = new Set(visible.map(drop => drop.dropId))
  const safeSelection = selected.filter(id => visibleIds.has(id)), selectedIds = new Set(safeSelection)
  const gain = visible.filter(drop => selectedIds.has(drop.dropId)).reduce((sum, drop) => sum + getRecycleFragments(cardById.get(drop.cardId)!.rarity, drop.finish, drop.artVariant), 0)
  const remainingVariants = new Set(owned.filter(drop => !selectedIds.has(drop.dropId)).map(variantKey))
  const lastCopies = new Set(owned.filter(drop => selectedIds.has(drop.dropId) && !remainingVariants.has(variantKey(drop))).map(variantKey)).size
  function resetSelection() { setSelected([]); setConfirm(false); setError('') }
  function changeFilters(value: CardFilterValue) { setFilters(value); resetSelection() }
  async function recycle() {
    if (busy || !safeSelection.length) return
    setBusy(true); setError('')
    try { await recycleDrops(safeSelection, includeLast, db, Date.now(), !favoritesOnly); resetSelection() } catch (e) { setError(errorText(e)) } finally { setBusy(false) }
  }
  return <><div className="page-heading"><div className="title-with-count"><h1 className="page-title">Atelier</h1><span>{visible.length}</span></div><button type="button" className="text-button heading-caption atelier-mode" aria-pressed={includeLast} disabled={busy} onClick={() => { setIncludeLast(value => !value); resetSelection() }}><span>{includeLast ? 'Toutes vos cartes' : 'Vos doublons'}</span><ArrowLeftRight size={13} aria-hidden="true" /></button></div>
    <div className="collection-tools">
      <CardSearchRow search={search} onSearchChange={value => { setSearch(value); resetSelection() }} favoritesOnly={favoritesOnly} onToggleFavorites={() => { setFavoritesOnly(value => !value); resetSelection() }} />
      <CardFilters value={filters} onChange={changeFilters} />
    </div>
    {includeLast && <p className="settings-note">Ce mode permet de recycler toutes vos cartes, y compris vos dernières copies.</p>}
    {groups.length ? <section className="recycle-section"><div className="selection-toolbar"><label className="checkbox-label"><input type="checkbox" checked={safeSelection.length === visible.length} disabled={busy} onChange={event => setSelected(event.target.checked ? visible.map(drop => drop.dropId) : [])} /> Tout sélectionner</label>{!includeLast && <span>Une copie de chaque variante est conservée.</span>}</div><div className="duplicate-list">{groups.map(group => {
      const first = group[0], card = cardById.get(first.cardId)!, value = getRecycleFragments(card.rarity, first.finish, first.artVariant)
      const checked = group.every(drop => selectedIds.has(drop.dropId))
      return <label key={variantKey(first)} className={`duplicate-row ${checked ? 'is-selected' : ''}`}>
        <input type="checkbox" checked={checked} disabled={busy} onChange={event => setSelected(current => event.target.checked ? [...new Set([...current, ...group.map(drop => drop.dropId)])] : current.filter(id => !group.some(drop => drop.dropId === id)))} />
        <img src={card.artwork[first.artVariant]} alt="" />
        <div><strong>{card.title}</strong><span>{group.length} carte{group.length > 1 ? 's' : ''}</span></div>
        <b><Gem size={13} /> {value * group.length}</b>
      </label>
    })}</div><div className="recycle-summary"><span>{safeSelection.length} sélectionné{safeSelection.length > 1 ? 's' : ''}</span><button className="primary-button" disabled={!safeSelection.length || busy} onClick={() => setConfirm(true)}><Recycle size={15} /> Recycler <span className="button-value">+{gain} <Gem size={12} /></span></button></div></section> : <EmptyState icon={<Layers3 size={25} />} title={candidates.length ? 'Aucune carte ne correspond.' : favoritesOnly ? (includeLast ? 'Aucun favori.' : 'Aucun doublon favori.') : includeLast ? owned.length ? 'Aucune carte à recycler.' : 'Votre collection est vide.' : 'Aucun doublon.'}>{candidates.length ? 'Essayez une autre sélection.' : favoritesOnly ? 'Les favoris se gèrent dans la Collection.' : includeLast ? owned.length ? 'Activez le filtre Favoris pour afficher vos cartes favorites.' : 'Ouvrez un booster pour obtenir des cartes.' : 'Ils apparaîtront ici.'}</EmptyState>}
    <ErrorNotice error={error} />
    {confirm && <ActionSheet title={includeLast ? 'Recycler les cartes sélectionnées' : 'Recycler les doublons'} onClose={() => { if (!busy) setConfirm(false) }}><div className="action-sheet-group"><p><strong>{safeSelection.length} cartes → {gain} fragments</strong>Les cartes sélectionnées seront détruites. {lastCopies ? `Vous recyclez la dernière copie de ${lastCopies} variante${lastCopies > 1 ? 's' : ''}.` : 'Vos dernières copies sont conservées.'}</p><ErrorNotice error={error} /><button className="action-sheet-danger" disabled={busy || !safeSelection.length} onClick={recycle}>Recycler</button></div><button className="action-sheet-group action-sheet-cancel" disabled={busy} onClick={() => setConfirm(false)}>Annuler</button></ActionSheet>}
  </>
}
