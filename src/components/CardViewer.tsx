import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Download, Gem, LoaderCircle, Send, Share2, Star, X } from 'lucide-react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useNavigate } from 'react-router-dom'
import type { CollectionEntry } from '../collection/view'
import { setFavorite } from '../collection/favorites'
import { db } from '../storage/database'
import { recycleDrops } from '../storage/services'
import { cardById } from '../data/cards'
import { getRecycleFragments, variantKey } from '../game/engine'
import { ART_LABELS, FINISH_LABELS } from '../game/config'
import { useSettings } from '../settings/useSettings'
import { useShareImage } from '../share/useShareImage'
import { ViewerCarousel, type ViewerCarouselHandle } from './ViewerCarousel'
import { CardBackdrop } from './CardBackdrop'
import { FinishDot } from './FinishDot'
import { ActionSheet } from './ActionSheet'
import { lockPageScroll } from './scrollLock'
import { ErrorNotice } from './ui'
import { errorText } from './format'
import { useGame } from './useGame'
import { SharedCardDetail } from './SharedCardDetail'
import type { SharedVariant } from '../collection/collectionSnapshot'

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const obtained = (entry: CollectionEntry) => entry.acquiredAt > 0 ? `Obtenue le ${dateFormat.format(entry.acquiredAt)}` : 'Aperçu · Mode dev'

type CardViewerProps = { sharedReadOnly: true; variants: readonly SharedVariant[]; onClose: () => void } | { sharedReadOnly?: false; receivedFrom?: string; entries: CollectionEntry[]; initialIndex?: number; onClose: () => void; preview?: boolean }
export function CardViewer(props: CardViewerProps) {
  if (props.sharedReadOnly) return props.variants.length ? <SharedCardDetail variants={props.variants} onClose={props.onClose} /> : null
  const { entries, initialIndex = 0, onClose, preview = false, receivedFrom } = props
  return entries.length ? <Viewer entries={entries} initialIndex={initialIndex} onClose={onClose} preview={preview} receivedFrom={receivedFrom} /> : null
}

function Viewer({ entries, initialIndex, onClose, preview, receivedFrom }: { receivedFrom?: string; entries: CollectionEntry[]; initialIndex: number; onClose: () => void; preview: boolean }) {
  const { actionBar: preferredActionBar, collectionDisplay, handedness } = useSettings()
  const actionBar = receivedFrom ? 'four' : preferredActionBar
  const { drops, notify } = useGame()
  const navigate = useNavigate()
  const [position, setPosition] = useState({ key: entries[initialIndex]?.key, index: initialIndex })
  const found = entries.findIndex(entry => entry.key === position.key)
  const index = found < 0 ? Math.min(position.index, entries.length - 1) : found
  const entry = entries[index], definition = cardById.get(entry.card.cardId)!
  const favorites = useLiveQuery(() => db.favorites.toArray(), [], [])
  const favorite = favorites.some(row => row.key === variantKey(entry.card))
  const [sheet, setSheet] = useState<'recycle' | 'share' | null>(null)
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const { image, error: shareError } = useShareImage(entry.card, definition)
  const dialog = useRef<HTMLDialogElement>(null), carousel = useRef<ViewerCarouselHandle>(null), dock = useRef<HTMLDivElement>(null)
  const actionLock = useRef(false)
  const [bounds, setBounds] = useState({ left: 14, width: 0, bottom: 14 })
  const value = getRecycleFragments(definition.rarity, entry.card.finish, entry.card.artVariant)
  const quantity = drops.filter(drop => drop.status === 'owned' && variantKey(drop) === variantKey(entry.card)).length
  const actionable = !preview && entry.ids.length > 0
  useLayoutEffect(() => {
    const origin = document.activeElement as HTMLElement | null, el = dialog.current!, unlock = lockPageScroll()
    el.showModal(); el.focus({ preventScroll: true })
    document.body.classList.add('card-viewer-open')
    return () => { el.close(); document.body.classList.remove('card-viewer-open'); unlock(); if (origin?.isConnected) origin.focus({ preventScroll: true }) }
  }, [])
  useEffect(() => { if (!message) return; const timer = setTimeout(() => setMessage(''), 3500); return () => clearTimeout(timer) }, [message])
  useLayoutEffect(() => {
    const measure = () => { const box = dock.current!.getBoundingClientRect(); setBounds({ left: box.left, width: box.width, bottom: window.innerHeight - box.bottom }) }
    const observer = new ResizeObserver(measure)
    observer.observe(dock.current!)
    window.addEventListener('resize', measure)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure) }
  }, [])
  function move(next: number) { if (!busy && !sheet) carousel.current?.move(next) }
  function openSheet(kind: 'recycle' | 'share') {
    const box = dock.current!.getBoundingClientRect()
    setBounds({ left: box.left, width: box.width, bottom: window.innerHeight - box.bottom })
    setSheet(kind)
  }
  async function toggleFavorite() {
    if (!actionable || actionLock.current) return
    actionLock.current = true; setBusy(true); setError('')
    try { await setFavorite(entry.card, !favorite) } catch (e) { setError(errorText(e)) } finally { actionLock.current = false; setBusy(false) }
  }
  async function recycle() {
    if (!actionable || actionLock.current) return
    actionLock.current = true; setBusy(true); setError('')
    try {
      await recycleDrops([entry.ids[entry.ids.length - 1]], true)
      setSheet(null)
      const text = `Recyclée · +${value} fragments`
      if (entries.length === 1 && entry.ids.length === 1) { notify(text); onClose() }
      else setMessage(text)
    } catch (e) { setError(errorText(e)) } finally { actionLock.current = false; setBusy(false) }
  }
  function share() {
    if (!image) return
    try {
      if (navigator.share && navigator.canShare?.({ files: [image.file] })) {
        // Must remain synchronous up to this call: iOS user activation expires across awaits.
        void navigator.share({ files: [image.file], title: definition.title }).catch(e => {
          if (e instanceof Error && e.name === 'AbortError') return
          setError('Le partage a échoué. Vous pouvez télécharger l’image.'); openSheet('share')
        })
      } else openSheet('share')
    } catch { setError('Le partage est indisponible. Vous pouvez télécharger l’image.'); openSheet('share') }
  }
  const favoriteButton = <button className={`viewer-favorite${favorite ? ' fav-on' : ''}`} disabled={!actionable || busy} aria-label={favorite ? 'Retirer des favoris' : 'Ajouter aux favoris'} aria-pressed={favorite} onClick={toggleFavorite}><Star size={21} fill={favorite ? 'currentColor' : 'none'} /><span>Favori</span></button>
  const shareButton = <button onClick={share} disabled={!image} aria-label="Partager" aria-busy={!image && !shareError}>{image || shareError ? <Share2 size={21} /> : <LoaderCircle size={21} className="share-loading" />}<span>{shareError ? 'Indisponible' : image ? 'Partager' : 'Préparation…'}</span></button>
  return <dialog ref={dialog} className={`card-viewer dock-${actionBar}${receivedFrom ? ' is-received' : ''}`} tabIndex={-1} aria-label={definition.title} onCancel={event => { event.preventDefault(); if (!busy) onClose() }} onKeyDownCapture={event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); event.stopPropagation(); move(index + (event.key === 'ArrowRight' ? 1 : -1)) }
  }}>
    <CardBackdrop className="viewer-backdrop" rarity={definition.rarity} />
    <div className={`viewer-top${handedness === 'left' ? ' close-left' : ''}`}>{!receivedFrom && actionBar === 'two' && <div className="viewer-top-actions">{favoriteButton}{shareButton}</div>}<button className="viewer-glass viewer-close" aria-label="Fermer" disabled={busy} onClick={onClose}><X size={20} /></button></div>
    <div className="viewer-main"><ViewerCarousel ref={carousel} entries={entries} index={index} disabled={busy || !!sheet} onIndexChange={next => { setPosition({ key: entries[next].key, index: next }); setError('') }} />
    <div className="viewer-meta" aria-live="polite"><span>{receivedFrom ? `Carte reçue de ${receivedFrom} · ajoutée à votre collection` : obtained(entry)}</span>{collectionDisplay.duplicates === 'hide' && entry.ids.length > 1 && <b>×{entry.ids.length}</b>}</div>
    <div className="viewer-dots">{entries.length > 1 && entries.map((item, i) => <button key={item.key} aria-current={i === index ? 'true' : undefined} aria-label={`${FINISH_LABELS[item.card.finish]}, ${ART_LABELS[item.card.artVariant]}, ${obtained(item).toLowerCase()}`} onClick={() => move(i)}><FinishDot card={item.card} active={i === index} /></button>)}</div></div>
    <div ref={dock} className="viewer-dock">{actionBar === 'four' && <>{favoriteButton}{shareButton}</>}{!receivedFrom && <><button className="viewer-give" disabled={!actionable || busy} onClick={() => { onClose(); navigate('/envoyer/' + entry.ids[entry.ids.length - 1]) }}><Send size={21} /><span>Donner</span></button><button aria-label="Recycler" disabled={!actionable || busy} onClick={() => openSheet('recycle')}><span className="viewer-recycle-icon"><Gem size={21} /><small>+{value}</small></span><span>Recycler{actionBar === 'two' && ` · +${value}`}</span></button></>}</div>
    {(error || shareError) && <div className="viewer-error"><ErrorNotice error={error || shareError || ''} /></div>}
    {message && <div className="viewer-message" role="status">{message}</div>}
    {sheet && <ActionSheet title={sheet === 'recycle' ? 'Recycler cet exemplaire ?' : 'Image de partage'} className="viewer-sheet" style={bounds} onClose={() => { if (!busy) setSheet(null) }}>
      <div className="action-sheet-group">{sheet === 'recycle' ? <><p><strong>Recycler cet exemplaire ?</strong>{quantity === 1 && 'C’est votre dernier exemplaire de cette variante. '}La carte sera détruite pour {value} fragments.</p><ErrorNotice error={error} /><button className="action-sheet-danger" disabled={busy} onClick={recycle}>Recycler · +{value}</button></> : image && <><div className="share-preview"><img src={image.url} alt={`Image de partage : ${definition.title}`} /><span>Appui long pour l’enregistrer</span></div><a className="action-sheet-download" href={image.url} download={image.file.name}><Download size={17} />Télécharger</a></>}</div>
      <button className="action-sheet-group action-sheet-cancel" disabled={busy} onClick={() => setSheet(null)}>Annuler</button>
    </ActionSheet>}
  </dialog>
}
