import { useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Send } from 'lucide-react'
import { Link, useParams } from 'react-router-dom'
import { useGame } from '../components/useGame'
import { cardById } from '../data/cards'
import { FriendPicker } from '../components/FriendPicker'
import { TransferDeliveryButton } from '../components/TransferDeliveryButton'
import { EmptyState, ErrorNotice } from '../components/ui'
import { copyPromisedText, errorText } from '../components/format'
import { sendTransfer } from '../exchanges/services'
import { useSettings } from '../settings/useSettings'
import { downloadTransferFile } from '../exchanges/transferFile'
import type { OutgoingTransferRow } from '../game/types'

export function SendCardPage() {
  const { dropId } = useParams(), { drops } = useGame()
  const [busy, setBusy] = useState(false), [error, setError] = useState('')
  const [created, setCreated] = useState<OutgoingTransferRow | null>(null), [copied, setCopied] = useState(false)
  const { transferMode } = useSettings()
  const [delivery, setDelivery] = useState<'code' | 'file'>('code')
  const inFlight = useRef(false)
  const drop = drops.find(item => item.dropId === dropId), definition = drop && cardById.get(drop.cardId)
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
  if (created) return <section className="send-page transfer-success"><span className="transfer-success-mark clipboard-confirm"><Check size={28} /></span><h1 className="page-title">{delivery === 'file' ? 'Fichier de transfert prêt !' : copied ? 'Code de transfert copié !' : 'Transfert créé'}</h1><p>{definition?.title} · {created.recipientLabel || created.recipientId}</p><div className="transfer-codebox"><code>{created.code}</code><TransferDeliveryButton transfer={created} onError={setError} /></div><p className="muted">{error || (delivery === 'file' ? 'Envoyez le fichier .btcg à votre ami.' : copied ? 'Transmettez-le à votre ami.' : 'Retrouvez le code dans Codes envoyés pour le copier.')}</p><Link className="primary-button" to="/echanges">{delivery === 'file' ? 'Voir les transferts' : 'Voir les codes de transfert'} <ArrowRight size={14} /></Link></section>
  if (!drop || drop.status !== 'owned') return <EmptyState icon={<Send size={24} />} title="Cet exemplaire n’est plus disponible." action={<Link className="secondary-button" to="/echanges">Codes envoyés</Link>}>Retrouvez vos codes dans Codes envoyés.</EmptyState>
  return <section className="send-page"><Link className="text-button send-back" to="/collection"><ArrowLeft size={15} /> Collection</Link><div className="send-heading"><h1 className="page-title">Donner une carte</h1><p>{definition?.title}</p></div><p className="send-explainer">Choisissez un ami. Cet exemplaire quittera votre collection.</p><ErrorNotice error={error} /><FriendPicker disabled={busy} actionLabel="Donner à" onPick={friend => void send(friend.playerUuid)} /></section>
}
