import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../storage/database'
import { setFavorite } from '../collection/favorites'
import { memo, useCallback, useMemo, useState } from 'react'
import { ArrowLeft, Gem, Layers3, Search, Send, SlidersHorizontal, Star, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useGame } from '../components/useGame'
import { cardById } from '../data/cards'
import { matchesCardSearch } from '../game/cardSearch'
import { getRecycleFragments, variantKey } from '../game/engine'
import type { Card } from '../game/types'
import { recycleDrops } from '../storage/services'
import { CollectibleCard } from '../components/CollectibleCard'
import { EmptyState, ErrorNotice, Modal } from '../components/ui'
import { CardFilters } from '../components/CardFilters'
import { EMPTY_CARD_FILTERS, matchesCardFilters } from '../collection/filters'
import { errorText } from '../components/format'

import { updateSettings, useSettings } from '../settings/useSettings'
import { createCatalogPreview, DEV_CATALOG_ENABLED } from '../dev/catalogPreview'
import { cardFragmentValue, collectionView, ownedVariants } from '../collection/view'
import type { CollectionEntry, CollectionVariant } from '../collection/view'
import type { CollectionDisplay } from '../collection/preferences'
import { CollectionDisplayOptions } from '../components/CollectionDisplayOptions'

const obtainedDateFormat = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const catalogPreview: CollectionVariant[] = DEV_CATALOG_ENABLED ? createCatalogPreview().map(group => ({ card: group.card, copies: [] })) : []

function FragmentValue({ card }: { card: Card }) {
  const value = cardFragmentValue(card)
  return <span className="card-fragment-value" aria-label={`${value} ${value === 1 ? 'fragment' : 'fragments'} par exemplaire`} title="Valeur de recyclage d’un exemplaire"><Gem size={12} aria-hidden="true" />{value}</span>
}

const CollectionEntryItem = memo(function CollectionEntryItem({ entry, showValue, onOpen }: { entry: CollectionEntry; showValue: boolean; onOpen: (entry: CollectionEntry) => void }) {
  return <div className="collection-item"><CollectibleCard deferred presentation="thumbnail" card={entry.card} definition={cardById.get(entry.card.cardId)!} onActivate={() => onOpen(entry)} /><div className={`card-caption card-caption-single${showValue ? ' card-caption-valued' : ''}`}>{showValue && <FragmentValue card={entry.card} />}{entry.ids.length > 1 && <b>×{entry.ids.length}</b>}</div></div>
})
const CollectionPileItem = memo(function CollectionPileItem({ item, label, showValue, onOpen }: { item: ReturnType<typeof collectionView>[number]; label: string; showValue: boolean; onOpen: (key: string) => void }) {
  return <div className="collection-item"><div className="collection-pile"><CollectibleCard deferred presentation="thumbnail" card={item.card} definition={cardById.get(item.card.cardId)!} activationLabel={`Ouvrir la pile, ${label}`} onActivate={() => onOpen(item.key)} /></div><div className="card-caption"><span>{label}</span>{showValue ? <FragmentValue card={item.card} /> : <Layers3 size={12} aria-hidden="true" />}</div></div>
})

export function CollectionPage() {
  const navigate = useNavigate()
  const { devCatalog, collectionDisplay } = useSettings()
  const preview = DEV_CATALOG_ENABLED && devCatalog
  const { drops } = useGame()
  const [filters, setFilters] = useState(EMPTY_CARD_FILTERS)
  const favoriteRows = useLiveQuery(() => db.favorites.toArray(), [], [])
  const favoriteKeys = useMemo(() => new Set(favoriteRows.map(row => row.key)), [favoriteRows])
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [detailKey, setDetailKey] = useState<string | null>(null)
  const [recycleConfirm, setRecycleConfirm] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const [displayAnchor, setDisplayAnchor] = useState<DOMRect | null>(null), [displayError, setDisplayError] = useState('')
  const [stackKey, setStackKey] = useState<string | null>(null)
  const savedVariants = useMemo(() => ownedVariants(drops), [drops])
  const variants = preview ? catalogPreview : savedVariants
  const showValue = collectionDisplay.sort === 'value'
  const filtered = useMemo(() => variants.filter(group => {
    const card = cardById.get(group.card.cardId)!
    return (!favoritesOnly || favoriteKeys.has(variantKey(group.card))) && matchesCardFilters(group.card, filters) && matchesCardSearch(card, search)
  }), [variants, search, filters, favoritesOnly, favoriteKeys])
  const filteredQuantity = filtered.reduce((sum, variant) => sum + variant.copies.length, 0)
  const allItems = useMemo(() => collectionView(variants, collectionDisplay), [variants, collectionDisplay])
  const visible = useMemo(() => {
    if (filtered.length === variants.length) return allItems
    const items = new Map(allItems.map(item => [item.key, item])), entries = new Map(allItems.flatMap(item => item.entries.map(entry => [entry.key, entry] as const)))
    return collectionView(filtered, collectionDisplay).map(item => {
      const original = items.get(item.key)
      if (original && original.entries.length === item.entries.length && original.entries.every((entry, index) => entry.key === item.entries[index].key)) return original
      return { ...item, entries: item.entries.map(entry => entries.get(entry.key) || entry) }
    })
  }, [filtered, variants, collectionDisplay, allItems])
  const detail = visible.flatMap(item => item.entries).find(entry => entry.key === detailKey)
  const definition = detail ? cardById.get(detail.card.cardId)! : undefined
  const obtainedDate = detail && !preview && Number.isFinite(detail.acquiredAt) && detail.acquiredAt > 0 ? new Date(detail.acquiredAt) : undefined
  const stack = visible.find(item => item.key === stackKey)
  const variantQuantity = detail ? savedVariants.find(variant => variantKey(variant.card) === variantKey(detail.card))?.copies.length || 0 : 0
  function close(all = true) { setDetailKey(null); if (all) setStackKey(null); setRecycleConfirm(false); setError('') }
  const openEntry = useCallback((entry: CollectionEntry) => { setDetailKey(entry.key); setRecycleConfirm(false); setError('') }, [])
  const openPile = useCallback((key: string) => { setStackKey(key); setDetailKey(null); setError('') }, [])
  function changeDisplay(value: CollectionDisplay) {
    try { updateSettings({ collectionDisplay: value }); setDisplayError('') } catch (e) { setDisplayError(errorText(e)) }
  }
  function renderEntry(entry: CollectionEntry) {
    return <CollectionEntryItem key={entry.key} entry={entry} showValue={showValue} onOpen={openEntry} />
  }
  async function toggleFavorite() {
    if (!detail || preview || busy) return
    setBusy(true); setError('')
    try { await setFavorite(detail.card, !favoriteKeys.has(variantKey(detail.card))) } catch (e) { setError(errorText(e)) } finally { setBusy(false) }
  }
  async function recycle() {
    if (preview || !detail?.ids.length || busy) return
    setBusy(true); setError('')
    try { await recycleDrops([detail.ids[detail.ids.length - 1]], true); close(false) } catch (e) { setError(errorText(e)) } finally { setBusy(false) }
  }
  return <>
    <div className="page-heading collection-heading"><div className="title-with-count"><h1 className="page-title">Collection</h1><span>{preview ? 'Mode dev' : filteredQuantity}</span></div><button type="button" className="text-button collection-display-trigger" aria-haspopup="dialog" aria-expanded={!!displayAnchor} onClick={event => { setDisplayError(''); setDisplayAnchor(event.currentTarget.getBoundingClientRect()) }}><SlidersHorizontal size={16} /> Affichage</button></div>
    {displayAnchor && <CollectionDisplayOptions value={collectionDisplay} onChange={changeDisplay} onClose={() => setDisplayAnchor(null)} anchor={displayAnchor} error={<ErrorNotice error={displayError} />} />}
    <div className="collection-tools"><div className="collection-search-row"><label className="collection-search"><Search size={17} /><input type="search" aria-label="Rechercher une carte" placeholder="Rechercher une carte…" value={search} onChange={event => setSearch(event.target.value)} />{search && <button type="button" className="icon-button" aria-label="Effacer la recherche" onClick={() => setSearch('')}><X size={15} /></button>}</label><button type="button" className="icon-button favorites-filter" aria-label="Afficher uniquement les favoris" aria-pressed={favoritesOnly} onClick={() => setFavoritesOnly(value => !value)}><Star size={18} fill={favoritesOnly ? 'currentColor' : 'none'} /></button></div>
      <CardFilters value={filters} onChange={setFilters} />
    </div>
    {variants.length ? <><div className="collection-grid">{visible.map(item => {
      if (item.entries.length === 1) return renderEntry(item.entries[0])
      const label = collectionDisplay.duplicates === 'show' ? `${item.entries.length} cartes` : `${item.variantCount} variantes`
      return <CollectionPileItem key={item.key} item={item} label={label} showValue={showValue} onOpen={openPile} />
    })}</div>{!visible.length && <EmptyState icon={<Layers3 size={24} />} title="Aucune carte">Essayez une autre sélection.</EmptyState>}</> : <EmptyState icon={<Layers3 size={25} />} title="La première vous attend.">Ouvrez votre premier booster.</EmptyState>}
    {(detail && definition || stack) && <Modal headerEnd={detail && !preview && detail.ids.length > 0 ? <button type="button" className="icon-button favorite-toggle" disabled={busy} aria-label={favoriteKeys.has(variantKey(detail.card)) ? 'Retirer des favoris' : 'Ajouter aux favoris'} aria-pressed={favoriteKeys.has(variantKey(detail.card))} onClick={toggleFavorite}><Star size={18} fill={favoriteKeys.has(variantKey(detail.card)) ? 'currentColor' : 'none'} /></button> : undefined} headerCenter={obtainedDate && <time dateTime={obtainedDate.toISOString()}>obtenu le {obtainedDateFormat.format(obtainedDate)}</time>} viewKey={detail?.key || stack?.key} title={detail && definition ? definition.title : cardById.get(stack!.card.cardId)!.title + (collectionDisplay.groupBy === 'format' ? stack!.card.artVariant === 'fullArt' ? ' · Full Art' : ' · Classique' : '')} showTitle={!detail} onClose={() => { if (!busy) close() }} wide={!!detail} className={detail ? '' : 'collection-stack-modal'} headerStart={detail && stack ? <button type="button" className="text-button pile-back" aria-label="Retour à la pile" disabled={busy} onClick={() => close(false)}><ArrowLeft size={16} /> La pile</button> : undefined}>
      {detail && definition ? <><div className="card-detail-layout"><div className="detail-card"><CollectibleCard card={detail.card} definition={definition} /></div><div className="detail-info">{preview && <p className="muted">Aperçu · Mode dev</p>}
      {!preview && detail.ids.length > 0 && !recycleConfirm && <div className="detail-actions"><button className="secondary-button" onClick={() => { const id = detail.ids[detail.ids.length - 1]; close(); navigate('/envoyer/' + id) }}><Send size={15} /> Envoyer</button><button className="secondary-button" onClick={() => setRecycleConfirm(true)}><Gem size={15} /> Recycler · +{getRecycleFragments(definition.rarity, detail.card.finish, detail.card.artVariant)}</button></div>}
      {!preview && recycleConfirm && <div className="confirmation-panel"><h4>Recycler cet exemplaire ?</h4><p>{variantQuantity === 1 && 'C’est votre dernière copie de cette variante. '}La carte sera détruite pour <strong>{getRecycleFragments(definition.rarity, detail.card.finish, detail.card.artVariant)} fragments</strong>.</p><div className="save-split-actions"><button className="secondary-button" onClick={() => setRecycleConfirm(false)} disabled={busy}>Annuler</button><button className="primary-button" onClick={recycle} disabled={busy}>Recycler</button></div></div>}
      <ErrorNotice error={error} /></div></div></> : <div className="collection-grid stack-grid">{stack!.entries.map(renderEntry)}</div>}</Modal>}
  </>
}
