import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Download, Gem, LoaderCircle, Send, Share2, Star, X } from 'lucide-react'
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
import { ViewerCard } from './ViewerCard'
import { CardBackdrop } from './CardBackdrop'
import { FinishDot } from './FinishDot'
import { ActionSheet } from './ActionSheet'
import { lockPageScroll } from './scrollLock'
import { ErrorNotice } from './ui'
import { errorText } from './format'
import { useGame } from './useGame'

const dateFormat = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
const obtained = (entry: CollectionEntry) => entry.acquiredAt > 0 ? `Obtenue le ${dateFormat.format(entry.acquiredAt)}` : 'Aperçu · Mode dev'

export function CardViewer({ entries, initialIndex = 0, onClose, preview = false, receivedFrom }: { receivedFrom?: string; entries: CollectionEntry[]; initialIndex?: number; onClose: () => void; preview?: boolean }) {
  return entries.length ? <Viewer entries={entries} initialIndex={initialIndex} onClose={onClose} preview={preview} receivedFrom={receivedFrom} /> : null
}

function Viewer({ entries, initialIndex, onClose, preview, receivedFrom }: { receivedFrom?: string; entries: CollectionEntry[]; initialIndex: number; onClose: () => void; preview: boolean }) {
  const { actionBar: preferredActionBar, collectionDisplay, handedness } = useSettings()
  const actionBar = receivedFrom ? 'four' : preferredActionBar
  const { drops, notify } = useGame()
  const navigate = useNavigate()
  const [position, setPosition] = useState({ key: entries[initialIndex]?.key, index: initialIndex })
  // Keep decoded artwork ready across presentation changes and distant slides
  // being unmounted. This cache is released with the viewer.
  const [readyArtwork, setReadyArtwork] = useState<ReadonlySet<string>>(() => new Set())
  const markArtworkReady = useCallback((source: string) => {
    setReadyArtwork(previous => previous.has(source) ? previous : new Set([...previous, source]))
  }, [])
  const found = entries.findIndex(entry => entry.key === position.key)
  const index = found < 0 ? Math.min(position.index, entries.length - 1) : found
  const entry = entries[index], definition = cardById.get(entry.card.cardId)!
  const favorites = useLiveQuery(() => db.favorites.toArray(), [], [])
  const favorite = favorites.some(row => row.key === variantKey(entry.card))
  const [sheet, setSheet] = useState<'recycle' | 'share' | null>(null)
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const { image, error: shareError } = useShareImage(entry.card, definition)
  const dialog = useRef<HTMLDialogElement>(null), track = useRef<HTMLDivElement>(null), dock = useRef<HTMLDivElement>(null)
  const actionLock = useRef(false)
  const scrollTimer = useRef<number | undefined>(undefined)
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
  useLayoutEffect(() => {
    const el = track.current!
    const align = () => {
      const slide = el.firstElementChild as HTMLElement
      el.scrollTo({ left: index * slide.getBoundingClientRect().width, behavior: 'instant' })
    }
    align()
    const observer = new ResizeObserver(align)
    observer.observe(el)
    return () => observer.disconnect()
  }, [index, entries.length])
  useEffect(() => () => clearTimeout(scrollTimer.current), [])
  useEffect(() => { if (!message) return; const timer = setTimeout(() => setMessage(''), 3500); return () => clearTimeout(timer) }, [message])
  useLayoutEffect(() => {
    const measure = () => { const box = dock.current!.getBoundingClientRect(); setBounds({ left: box.left, width: box.width, bottom: window.innerHeight - box.bottom }) }
    const observer = new ResizeObserver(measure)
    observer.observe(dock.current!)
    window.addEventListener('resize', measure)
    return () => { observer.disconnect(); window.removeEventListener('resize', measure) }
  }, [])
  function move(next: number) {
    if (busy || sheet || next < 0 || next >= entries.length) return
    const el = track.current!, width = el.firstElementChild!.getBoundingClientRect().width
    el.scrollTo({ left: next * width, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
  }
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
    <div className="viewer-main"><div className="viewer-stage">
      <div ref={track} className="viewer-track" style={busy ? { overflowX: 'hidden' } : undefined} onScroll={event => {
        const el = event.currentTarget
        clearTimeout(scrollTimer.current)
        scrollTimer.current = window.setTimeout(() => {
          const width = el.firstElementChild!.getBoundingClientRect().width
          const next = Math.max(0, Math.min(entries.length - 1, Math.round(el.scrollLeft / width)))
          if (next !== index) { setPosition({ key: entries[next].key, index: next }); setError('') }
        }, 120)
      }}>{entries.map((item, i) => <div key={item.key} className={`viewer-slide${i === index ? ' is-current' : ''}`} aria-label={`${i + 1} sur ${entries.length}`}><div className="viewer-card">{Math.abs(i - index) <= 1 && <ViewerCard card={item.card} definition={cardById.get(item.card.cardId)!} presentation={i === index ? 'detail' : 'thumbnail'} ready={readyArtwork.has(cardById.get(item.card.cardId)!.artwork[item.card.artVariant])} onReady={markArtworkReady} onActivate={i === index ? undefined : () => move(i)} />}</div></div>)}</div>
      {entries.length > 1 && <><button className="viewer-glass viewer-previous" aria-label="Carte précédente" disabled={index === 0 || busy} onClick={() => move(index - 1)}><ArrowLeft size={18} /></button><button className="viewer-glass viewer-next" aria-label="Carte suivante" disabled={index === entries.length - 1 || busy} onClick={() => move(index + 1)}><ArrowRight size={18} /></button></>}
    </div><div className="viewer-meta" aria-live="polite"><span>{receivedFrom ? `Carte reçue de ${receivedFrom} · ajoutée à votre collection` : obtained(entry)}</span>{collectionDisplay.duplicates === 'hide' && entry.ids.length > 1 && <b>×{entry.ids.length}</b>}</div>
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
