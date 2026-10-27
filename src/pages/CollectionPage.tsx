import { memo, useCallback, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Gem, Layers3, Search, Send, SlidersHorizontal, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useGame } from '../components/useGame'
import { cardById, cards } from '../data/cards'
import { boosters } from '../data/boosters'
import { FINISH_LABELS, RARITY_COLORS, RARITY_LABELS } from '../game/config'
import { matchesCardSearch } from '../game/cardSearch'
import { getRecycleFragments, variantKey } from '../game/engine'
import type { Card, Finish, Rarity } from '../game/types'
import { recycleDrops } from '../storage/services'
import { CollectibleCard } from '../components/CollectibleCard'
import { EmptyState, ErrorNotice, Modal } from '../components/ui'
import { FilterMenu } from '../components/FilterMenu'
import { errorText } from '../components/format'

import { updateSettings, useSettings } from '../settings/useSettings'
import { createCatalogPreview, DEV_CATALOG_ENABLED } from '../dev/catalogPreview'
import { cardFragmentValue, collectionView, ownedVariants } from '../collection/view'
import { collectionBoosters, selectedBoosterCardIds } from '../collection/boosters'
import type { CollectionEntry, CollectionVariant } from '../collection/view'
import type { CollectionDisplay } from '../collection/preferences'
import { CollectionDisplayOptions } from '../components/CollectionDisplayOptions'

const obtainedDateFormat = new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })
const catalogPreview: CollectionVariant[] = DEV_CATALOG_ENABLED ? createCatalogPreview().map(group => ({ card: group.card, copies: [] })) : []
const boosterOptions = collectionBoosters(boosters, cards)

function FragmentValue({ card }: { card: Card }) {
  const value = cardFragmentValue(card)
  return <span className="card-fragment-value" aria-label={`${value} ${value === 1 ? 'fragment' : 'fragments'} par exemplaire`} title="Valeur de recyclage d’un exemplaire"><Gem size={12} aria-hidden="true" />{value}</span>
}

const CollectionEntryItem = memo(function CollectionEntryItem({ entry, showValue, onOpen }: { entry: CollectionEntry; showValue: boolean; onOpen: (entry: CollectionEntry) => void }) {
  return <div className="collection-item"><CollectibleCard deferred card={entry.card} definition={cardById.get(entry.card.cardId)!} onActivate={() => onOpen(entry)} /><div className={`card-caption card-caption-single${showValue ? ' card-caption-valued' : ''}`}>{showValue && <FragmentValue card={entry.card} />}{entry.ids.length > 1 && <b>×{entry.ids.length}</b>}</div></div>
})
const CollectionPileItem = memo(function CollectionPileItem({ item, label, showValue, onOpen }: { item: ReturnType<typeof collectionView>[number]; label: string; showValue: boolean; onOpen: (key: string) => void }) {
  return <div className="collection-item"><div className="collection-pile"><CollectibleCard deferred card={item.card} definition={cardById.get(item.card.cardId)!} activationLabel={`Ouvrir la pile, ${label}`} onActivate={() => onOpen(item.key)} /></div><div className="card-caption"><span>{label}</span>{showValue ? <FragmentValue card={item.card} /> : <Layers3 size={12} aria-hidden="true" />}</div></div>
})

export function CollectionPage() {
  const navigate = useNavigate()
  const { devCatalog, collectionDisplay } = useSettings()
  const preview = DEV_CATALOG_ENABLED && devCatalog
  const { drops } = useGame()
  const [rarities, setRarities] = useState<Rarity[]>([]), [finishes, setFinishes] = useState<Finish[]>([]), [fullArt, setFullArt] = useState(false)
  const [search, setSearch] = useState('')
  const [selectedBoosters, setSelectedBoosters] = useState<string[]>([])
  const [detailKey, setDetailKey] = useState<string | null>(null)
  const [recycleConfirm, setRecycleConfirm] = useState(false), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const [displayAnchor, setDisplayAnchor] = useState<DOMRect | null>(null), [displayError, setDisplayError] = useState('')
  const [stackKey, setStackKey] = useState<string | null>(null)
  const savedVariants = useMemo(() => ownedVariants(drops), [drops])
  const variants = preview ? catalogPreview : savedVariants
  const boosterCardIds = useMemo(() => selectedBoosterCardIds(boosterOptions, selectedBoosters), [selectedBoosters])
  const showValue = collectionDisplay.sort === 'value'
  const filtered = useMemo(() => variants.filter(group => {
    const card = cardById.get(group.card.cardId)!
    return (!boosterCardIds || boosterCardIds.has(card.id)) && matchesCardSearch(card, search) && (!rarities.length || rarities.includes(card.rarity)) && (!finishes.length || finishes.includes(group.card.finish)) && (!fullArt || group.card.artVariant === 'fullArt')
  }), [variants, search, rarities, finishes, fullArt, boosterCardIds])
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
  async function recycle() {
    if (preview || !detail?.ids.length || busy) return
    setBusy(true); setError('')
    try { await recycleDrops([detail.ids[detail.ids.length - 1]], true); close(false) } catch (e) { setError(errorText(e)) } finally { setBusy(false) }
  }
  return <>
    <div className="page-heading collection-heading"><div className="title-with-count"><h1 className="page-title">Collection</h1><span>{preview ? 'Mode dev' : drops.filter(d => d.status === 'owned').length}</span></div><button type="button" className="text-button collection-display-trigger" aria-haspopup="dialog" aria-expanded={!!displayAnchor} onClick={event => { setDisplayError(''); setDisplayAnchor(event.currentTarget.getBoundingClientRect()) }}><SlidersHorizontal size={16} /> Affichage</button></div>
    {displayAnchor && <CollectionDisplayOptions value={collectionDisplay} onChange={changeDisplay} onClose={() => setDisplayAnchor(null)} anchor={displayAnchor} error={<ErrorNotice error={displayError} />} />}
    <div className="collection-tools"><label className="collection-search"><Search size={17} /><input type="search" aria-label="Rechercher une carte" placeholder="Rechercher une carte…" value={search} onChange={event => setSearch(event.target.value)} />{search && <button type="button" className="icon-button" aria-label="Effacer la recherche" onClick={() => setSearch('')}><X size={15} /></button>}</label>
      <div className="collection-filters">
        {boosterOptions.length > 1 && <FilterMenu label="Boosters" active={!!selectedBoosters.length} count={selectedBoosters.length}>{boosterOptions.map(booster => <button className="filter-option" role="menuitemcheckbox" aria-checked={selectedBoosters.includes(booster.id)} key={booster.id} onClick={() => setSelectedBoosters(current => current.includes(booster.id) ? current.filter(id => id !== booster.id) : [...current, booster.id])}>{booster.title}<span className="option-check">{selectedBoosters.includes(booster.id) && <Check size={12} />}</span></button>)}{selectedBoosters.length > 0 && <button role="menuitem" className="filter-reset" onClick={() => setSelectedBoosters([])}>Réinitialiser</button>}</FilterMenu>}
        <FilterMenu label="Rareté" active={!!rarities.length} count={rarities.length}>{(Object.entries(RARITY_LABELS) as [Rarity, string][]).map(([id, label]) => <button className="filter-option" role="menuitemcheckbox" aria-checked={rarities.includes(id)} key={id} onClick={() => setRarities(current => current.includes(id) ? current.filter(r => r !== id) : [...current, id])}><span className="rarity-dot" style={{ background: RARITY_COLORS[id] }} />{label}<span className="option-check">{rarities.includes(id) && <Check size={12} />}</span></button>)}{rarities.length > 0 && <button role="menuitem" className="filter-reset" onClick={() => setRarities([])}>Réinitialiser</button>}</FilterMenu>
        <FilterMenu label="Finitions" active={!!finishes.length || fullArt} count={finishes.length + Number(fullArt)}>{(Object.entries(FINISH_LABELS) as [Finish, string][]).map(([id, label]) => <button className="filter-option" role="menuitemcheckbox" aria-checked={finishes.includes(id)} key={id} onClick={() => setFinishes(current => current.includes(id) ? current.filter(f => f !== id) : [...current, id])}>{label}<span className="option-check">{finishes.includes(id) && <Check size={12} />}</span></button>)}<div className="filter-divider" /><button className="filter-option" role="menuitemcheckbox" aria-checked={fullArt} onClick={() => setFullArt(value => !value)}>Full Art<span className="option-check">{fullArt && <Check size={12} />}</span></button>{(finishes.length > 0 || fullArt) && <button role="menuitem" className="filter-reset" onClick={() => { setFinishes([]); setFullArt(false) }}>Réinitialiser</button>}</FilterMenu>
      </div>
    </div>
    {variants.length ? <><div className="collection-grid">{visible.map(item => {
      if (item.entries.length === 1) return renderEntry(item.entries[0])
      const label = collectionDisplay.duplicates === 'show' ? `${item.entries.length} cartes` : `${item.variantCount} variantes`
      return <CollectionPileItem key={item.key} item={item} label={label} showValue={showValue} onOpen={openPile} />
    })}</div>{!visible.length && <EmptyState icon={<Layers3 size={24} />} title="Aucune carte">Essayez une autre sélection.</EmptyState>}</> : <EmptyState icon={<Layers3 size={25} />} title="La première vous attend." action={<Link className="primary-button" to="/">Phantom Blood <ArrowRight size={15} /></Link>}>Ouvrez votre premier booster.</EmptyState>}
    {(detail && definition || stack) && <Modal headerCenter={obtainedDate && <time dateTime={obtainedDate.toISOString()}>obtenu le {obtainedDateFormat.format(obtainedDate)}</time>} viewKey={detail?.key || stack?.key} title={detail && definition ? definition.title : cardById.get(stack!.card.cardId)!.title + (collectionDisplay.groupBy === 'format' ? stack!.card.artVariant === 'fullArt' ? ' · Full Art' : ' · Classique' : '')} showTitle={!detail} onClose={() => { if (!busy) close() }} wide={!!detail} className={detail ? '' : 'collection-stack-modal'} headerStart={detail && stack ? <button type="button" className="text-button pile-back" aria-label="Retour à la pile" disabled={busy} onClick={() => close(false)}><ArrowLeft size={16} /> La pile</button> : undefined}>
      {detail && definition ? <><div className="card-detail-layout"><div className="detail-card"><CollectibleCard card={detail.card} definition={definition} /></div><div className="detail-info">{preview && <p className="muted">Aperçu · Mode dev</p>}
      {!preview && detail.ids.length > 0 && !recycleConfirm && <div className="detail-actions"><button className="secondary-button" onClick={() => { const id = detail.ids[detail.ids.length - 1]; close(); navigate('/envoyer/' + id) }}><Send size={15} /> Envoyer</button><button className="text-button" onClick={() => setRecycleConfirm(true)}><Gem size={15} /> Recycler · +{getRecycleFragments(definition.rarity, detail.card.finish, detail.card.artVariant)}</button></div>}
      {!preview && recycleConfirm && <div className="confirmation-panel"><h4>Recycler cet exemplaire ?</h4><p>{variantQuantity === 1 && 'C’est votre dernière copie de cette variante. '}La carte sera détruite pour <strong>{getRecycleFragments(definition.rarity, detail.card.finish, detail.card.artVariant)} fragments</strong>.</p><button className="primary-button" onClick={recycle} disabled={busy}>Recycler</button><button className="text-button" onClick={() => setRecycleConfirm(false)} disabled={busy}>Annuler</button></div>}
      <ErrorNotice error={error} /></div></div></> : <div className="collection-grid stack-grid">{stack!.entries.map(renderEntry)}</div>}</Modal>}
  </>
}
