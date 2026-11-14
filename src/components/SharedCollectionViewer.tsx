import { useMemo, useState } from 'react'
import { Layers3, SlidersHorizontal } from 'lucide-react'
import type { VerifiedCollection } from '../collection/collectionCrypto'
import { EMPTY_CARD_FILTERS, matchesCardFilters } from '../collection/filters'
import { sharedCollectionView } from '../collection/sharedView'
import { matchesCardSearch } from '../game/cardSearch'
import { cardById } from '../data/cards'
import { FullscreenPanel } from './FullscreenPanel'
import { CardFilters } from './CardFilters'
import { CardSearchRow } from './CardSearchRow'
import { CollectionCardTile } from './CollectionCardTile'
import { updateSettings, useSettings } from '../settings/useSettings'
import { CollectionDisplayOptions } from './CollectionDisplayOptions'
import type { CollectionDisplay } from '../collection/preferences'
import { errorText } from './format'
import { EmptyState, ErrorNotice } from './ui'
import { CardViewer } from './CardViewer'
import { FUTURE_COLLECTION_SECONDS } from '../collection/collectionMemory'

export function SharedCollectionViewer({ snapshot, name, onClose, notice }: { snapshot: VerifiedCollection; name: string; onClose: () => void; notice?: string }) {
  const [openedAt] = useState(() => Math.floor(Date.now() / 1000))
  const [search, setSearch] = useState(''), [favoritesOnly, setFavoritesOnly] = useState(false), [filters, setFilters] = useState(EMPTY_CARD_FILTERS)
  const { sharedCollectionDisplay: display } = useSettings()
  const [opened, setOpened] = useState<string | null>(null)
  const [displayAnchor, setDisplayAnchor] = useState<DOMRect | null>(null), [displayError, setDisplayError] = useState('')
  function changeDisplay(value: CollectionDisplay) {
    try { updateSettings({ sharedCollectionDisplay: value }); setDisplayError('') } catch (error) { setDisplayError(errorText(error)) }
  }
  const filtered = useMemo(() => snapshot.variants.filter(variant => (!favoritesOnly || variant.favorite) && matchesCardFilters(variant, filters) && matchesCardSearch(cardById.get(variant.cardId)!, search)), [snapshot.variants, favoritesOnly, filters, search])
  const items = useMemo(() => sharedCollectionView(filtered, display), [filtered, display]), current = items.find(item => item.key === opened)
  return <FullscreenPanel title={name} accessibleTitle={`Collection de ${name}`} onClose={onClose} className="shared-collection">
    {(snapshot.issuedAt > openedAt + FUTURE_COLLECTION_SECONDS || notice) && <section className="shared-collection-heading">{snapshot.issuedAt > openedAt + FUTURE_COLLECTION_SECONDS && <p role="status">La date déclarée est dans le futur. Vérifiez-la auprès de votre ami.</p>}{notice && <p role="status">{notice}</p>}</section>}
    <div className="page-heading collection-heading"><div className="title-with-count"><h2 className="page-title">Collection</h2><span>{filtered.reduce((sum, variant) => sum + variant.quantity, 0)}</span></div><button type="button" className="text-button collection-display-trigger" aria-haspopup="dialog" aria-expanded={!!displayAnchor} onClick={event => { setDisplayError(''); setDisplayAnchor(event.currentTarget.getBoundingClientRect()) }}><SlidersHorizontal size={16} />Affichage</button></div>
    {displayAnchor && <CollectionDisplayOptions shared value={display} onChange={changeDisplay} onClose={() => setDisplayAnchor(null)} anchor={displayAnchor} error={<ErrorNotice error={displayError} />} />}
    <div className="collection-tools"><CardSearchRow search={search} onSearchChange={setSearch} favoritesOnly={favoritesOnly} onToggleFavorites={() => setFavoritesOnly(value => !value)} /><CardFilters value={filters} onChange={setFilters} /></div>
    <div className="collection-grid">{items.map(item => <CollectionCardTile key={item.key} card={item.cover} quantity={item.quantity} pileCards={item.entries.length > 1 ? item.entries : undefined} label={`${item.entries.length} variantes`} showValue={display.sort === 'value'} suspended={!!current} onOpen={() => setOpened(item.key)} />)}</div>
    {!items.length && <EmptyState icon={<Layers3 size={24} />} title="Aucune carte">{snapshot.variants.length ? 'Essayez une autre sélection.' : 'Cette collection est vide.'}</EmptyState>}
    {current && <CardViewer sharedReadOnly variants={current.entries} onClose={() => setOpened(null)} />}
  </FullscreenPanel>
}
