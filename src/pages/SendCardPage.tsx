import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowLeft, ArrowRight, Check, Search, Send, UserRound } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { db } from '../storage/database'
import { useGame } from '../components/useGame'
import { cardById } from '../data/cards'
import { normalize } from '../game/cardSearch'
import { EmptyState, ErrorNotice } from '../components/ui'
import { copyPromisedText, errorText } from '../components/format'
import { sendTransfer } from '../exchanges/services'
import { useSettings } from '../settings/useSettings'
import { downloadTransferFile } from '../exchanges/transferFile'
import type { OutgoingTransferRow } from '../game/types'

export function SendCardPage() {
  const { dropId } = useParams(), { drops } = useGame()
  const friends = useLiveQuery(() => db.friends.toArray(), [], [])
  const [search, setSearch] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [created, setCreated] = useState<OutgoingTransferRow | null>(null), [copied, setCopied] = useState(false)
  const { transferMode } = useSettings()
  const [delivery, setDelivery] = useState<'code' | 'file'>('code')
  const inFlight = useRef(false)
  const drop = drops.find(item => item.dropId === dropId), definition = drop && cardById.get(drop.cardId)
  const visible = friends.filter(friend => normalize(friend.label || friend.playerUuid).includes(normalize(search.trim()))).sort((a, b) => (a.label || a.playerUuid).localeCompare(b.label || b.playerUuid, 'fr'))
  async function send(friendId: string) {
    if (!drop || drop.status !== 'owned' || inFlight.current) return
    inFlight.current = true; setBusy(true); setError('')
    try {
      const transfer = sendTransfer(drop.dropId, friendId)
      // Register the clipboard operation immediately, preserving the tap's activation on Safari.
      const mode = transferMode
      const copying = mode === 'code' ? copyPromisedText(transfer.then(row => row.code)).then(() => true, () => false) : Promise.resolve(false)
      const row = await transfer
      setCreated(row); setDelivery(mode); setCopied(await copying)
      if (mode === 'file') downloadTransferFile(row)
    } catch (e) { setError(errorText(e)) }
    finally { inFlight.current = false; setBusy(false) }
  }
  if (created) return <section className="send-page transfer-success"><span className="transfer-success-mark clipboard-confirm"><Check size={28} /></span><h1 className="page-title">{delivery === 'file' ? 'Fichier de transfert prêt !' : copied ? 'Code de transfert copié !' : 'Transfert créé'}</h1><p>{definition?.title} · {created.recipientLabel || created.recipientId}</p><p className="muted">{error || (delivery === 'file' ? 'Envoyez le fichier .btcg à votre ami.' : copied ? 'Transmettez-le à votre ami.' : 'Retrouvez le code dans vos envois pour le copier.')}</p><Link className="primary-button" to="/echanges?onglet=envois">{delivery === 'file' ? 'Voir les transferts' : 'Voir les codes de transfert'} <ArrowRight size={14} /></Link></section>
  if (!drop || drop.status !== 'owned') return <EmptyState icon={<Send size={24} />} title="Cet exemplaire n’est plus disponible." action={<Link className="secondary-button" to="/echanges?onglet=envois">Mes envois</Link>}>Retrouvez vos codes dans Envois.</EmptyState>
  return <section className="send-page"><Link className="text-button send-back" to="/collection"><ArrowLeft size={15} /> Collection</Link><div className="send-heading"><h1 className="page-title">Envoyer une carte</h1><p>{definition?.title}</p></div><p className="send-explainer">Choisissez un ami. Cet exemplaire quittera votre collection.</p><label className="collection-search"><Search size={17} /><input type="search" aria-label="Rechercher un ami" placeholder="Rechercher un ami…" value={search} onChange={event => setSearch(event.target.value)} /></label><ErrorNotice error={error} />{friends.length ? <div className="send-friend-list" aria-label="Destinataires" aria-busy={busy}>{visible.map(friend => <button key={friend.playerUuid} className="send-friend" aria-label={`Envoyer à ${friend.label || friend.playerUuid}`} disabled={busy} onClick={() => send(friend.playerUuid)}><span className="friend-avatar"><UserRound size={20} /></span><strong>{friend.label || friend.playerUuid}</strong><ArrowRight size={17} /></button>)}{!visible.length && <p className="muted">Aucun ami trouvé.</p>}</div> : <EmptyState icon={<UserRound size={24} />} title="Ajoutez votre premier ami." action={<Link className="secondary-button" to="/echanges">Amis</Link>}>Son code ami est nécessaire pour lui envoyer une carte.</EmptyState>}</section>
}
