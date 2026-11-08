import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../storage/database'
import { memo, useCallback, useMemo, useState } from 'react'
import { Gem, Layers3, SlidersHorizontal } from 'lucide-react'
import { useGame } from '../components/useGame'
import { cardById } from '../data/cards'
import { matchesCardSearch } from '../game/cardSearch'
import { variantKey } from '../game/engine'
import type { Card } from '../game/types'
import { CollectibleCard } from '../components/CollectibleCard'
import { EmptyState, ErrorNotice } from '../components/ui'
import { CardFilters } from '../components/CardFilters'
import { CardSearchRow } from '../components/CardSearchRow'
import { EMPTY_CARD_FILTERS, matchesCardFilters } from '../collection/filters'
import { errorText } from '../components/format'

import { updateSettings, useSettings } from '../settings/useSettings'
import { createCatalogPreview, DEV_CATALOG_ENABLED } from '../dev/catalogPreview'
import { cardFragmentValue, collectionView, ownedVariants } from '../collection/view'
import type { CollectionEntry, CollectionVariant } from '../collection/view'
import type { CollectionDisplay } from '../collection/preferences'
import { CollectionDisplayOptions } from '../components/CollectionDisplayOptions'

import { CardViewer } from '../components/CardViewer'
import { FinishDot } from '../components/FinishDot'
const catalogPreview: CollectionVariant[] = DEV_CATALOG_ENABLED ? createCatalogPreview().map(group => ({ card: group.card, copies: [] })) : []

function FragmentValue({ card }: { card: Card }) {
  const value = cardFragmentValue(card)
  return <span className="card-fragment-value" aria-label={`${value} ${value === 1 ? 'fragment' : 'fragments'} par exemplaire`} title="Valeur de recyclage d’un exemplaire"><Gem size={12} aria-hidden="true" />{value}</span>
}

const CollectionEntryItem = memo(function CollectionEntryItem({ entry, showValue, onOpen, suspended = false }: { entry: CollectionEntry; showValue: boolean; suspended?: boolean; onOpen: (entry: CollectionEntry) => void }) {
  return <div className="collection-item"><div className="collection-face"><CollectibleCard deferred suspended={suspended} presentation="thumbnail" card={entry.card} definition={cardById.get(entry.card.cardId)!} onActivate={() => onOpen(entry)} /></div><div className={`card-caption card-caption-single${showValue ? ' card-caption-valued' : ''}`}>{entry.ids.length > 1 && <b>×{entry.ids.length}</b>}{showValue && <FragmentValue card={entry.card} />}</div></div>
})
const CollectionPileItem = memo(function CollectionPileItem({ item, label, showValue, onOpen, suspended }: { item: ReturnType<typeof collectionView>[number]; label: string; showValue: boolean; suspended: boolean; onOpen: (key: string) => void }) {
  return <div className="collection-item"><div className="collection-face"><div className="collection-pile"><CollectibleCard deferred suspended={suspended} presentation="thumbnail" card={item.card} definition={cardById.get(item.card.cardId)!} activationLabel={`Ouvrir la pile, ${label}`} onActivate={() => onOpen(item.key)} /></div></div><div className="card-caption"><span className="collection-finish-dots" aria-label={label}>{item.entries.map(entry => <FinishDot key={entry.key} card={entry.card} />)}</span>{showValue ? <FragmentValue card={item.card} /> : <Layers3 size={12} aria-hidden="true" />}</div></div>
})

export function CollectionPage() {
  const { devCatalog, collectionDisplay } = useSettings()
  const preview = DEV_CATALOG_ENABLED && devCatalog
  const { drops } = useGame()
  const [filters, setFilters] = useState(EMPTY_CARD_FILTERS)
  const favoriteRows = useLiveQuery(() => db.favorites.toArray(), [], [])
  const favoriteKeys = useMemo(() => new Set(favoriteRows.map(row => row.key)), [favoriteRows])
  const [favoritesOnly, setFavoritesOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [displayAnchor, setDisplayAnchor] = useState<DOMRect | null>(null), [displayError, setDisplayError] = useState('')
  const [viewerKey, setViewerKey] = useState<string | null>(null)
  // Keep favorite-filter membership stable until the whole preview (including its pile) closes.
  const [previewFavoriteKeys, setPreviewFavoriteKeys] = useState<ReadonlySet<string> | null>(null)
  const filterFavoriteKeys = previewFavoriteKeys ?? favoriteKeys
  const savedVariants = useMemo(() => ownedVariants(drops), [drops])
  const variants = preview ? catalogPreview : savedVariants
  const showValue = collectionDisplay.sort === 'value'
  const filtered = useMemo(() => variants.filter(group => {
    const card = cardById.get(group.card.cardId)!
    return (!favoritesOnly || filterFavoriteKeys.has(variantKey(group.card))) && matchesCardFilters(group.card, filters) && matchesCardSearch(card, search)
  }), [variants, search, filters, favoritesOnly, filterFavoriteKeys])
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
  const viewerItem = visible.find(item => item.key === viewerKey)
  const close = useCallback(() => { setViewerKey(null); setPreviewFavoriteKeys(null) }, [])
  if (viewerKey && !viewerItem) { setViewerKey(null); setPreviewFavoriteKeys(null) }
  const openEntry = useCallback((entry: CollectionEntry) => { setPreviewFavoriteKeys(favoriteKeys); setViewerKey(allItems.find(item => item.entries.some(candidate => candidate.key === entry.key))?.key ?? entry.key) }, [favoriteKeys, allItems])
  const openPile = useCallback((key: string) => { setPreviewFavoriteKeys(favoriteKeys); setViewerKey(key) }, [favoriteKeys])
  function changeDisplay(value: CollectionDisplay) {
    try { updateSettings({ collectionDisplay: value }); setDisplayError('') } catch (e) { setDisplayError(errorText(e)) }
  }
  function renderEntry(entry: CollectionEntry) {
    return <CollectionEntryItem key={entry.key} entry={entry} showValue={showValue} onOpen={openEntry} suspended={!!viewerKey} />
  }
  return <>
    <div className="page-heading collection-heading"><div className="title-with-count"><h1 className="page-title">Collection</h1><span>{preview ? 'Mode dev' : filteredQuantity}</span></div><button type="button" className="text-button collection-display-trigger" aria-haspopup="dialog" aria-expanded={!!displayAnchor} onClick={event => { setDisplayError(''); setDisplayAnchor(event.currentTarget.getBoundingClientRect()) }}><SlidersHorizontal size={16} /> Affichage</button></div>
    {displayAnchor && <CollectionDisplayOptions value={collectionDisplay} onChange={changeDisplay} onClose={() => setDisplayAnchor(null)} anchor={displayAnchor} error={<ErrorNotice error={displayError} />} />}
    <div className="collection-tools">
      <CardSearchRow search={search} onSearchChange={setSearch} favoritesOnly={favoritesOnly} onToggleFavorites={() => setFavoritesOnly(value => !value)} />
      <CardFilters value={filters} onChange={setFilters} />
    </div>
    {variants.length ? <><div className="collection-grid">{visible.map(item => {
      if (item.entries.length === 1) return renderEntry(item.entries[0])
      const label = collectionDisplay.duplicates === 'show' ? `${item.entries.length} cartes` : `${item.variantCount} variantes`
      return <CollectionPileItem key={item.key} item={item} label={label} showValue={showValue} onOpen={openPile} suspended={!!viewerKey} />
    })}</div>{!visible.length && <EmptyState icon={<Layers3 size={24} />} title="Aucune carte">Essayez une autre sélection.</EmptyState>}</> : <EmptyState icon={<Layers3 size={25} />} title="La première vous attend.">Ouvrez votre premier booster.</EmptyState>}
    {viewerItem && <CardViewer entries={viewerItem.entries} preview={preview} onClose={close} />}
  </>
}
