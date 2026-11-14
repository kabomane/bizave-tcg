import { useRef, useState } from 'react'
import { ArrowLeft, Check, Send } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useGame } from '../components/useGame'
import { cardById } from '../data/cards'
import { FriendPicker } from '../components/FriendPicker'
import { FullscreenPanel } from '../components/FullscreenPanel'
import { TransferDeliveryButton } from '../components/TransferDeliveryButton'
import { EmptyState, ErrorNotice } from '../components/ui'
import { copyPromisedText, errorText } from '../components/format'
import { sendTransfer } from '../exchanges/services'
import { useSettings } from '../settings/useSettings'
import type { OutgoingTransferRow } from '../game/types'

export function SendCardPage() {
  const { dropId } = useParams(), { drops } = useGame(), navigate = useNavigate()
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
    } catch (e) { setError(errorText(e)) }
    finally { inFlight.current = false; setBusy(false) }
  }
  if (created) return <FullscreenPanel title="Transfert créé" className="card-transfer-confirmation" onClose={() => navigate('/collection')}><section className="send-page transfer-success"><span className="transfer-success-mark clipboard-confirm"><Check size={28} /></span><h1 className="page-title">{delivery === 'file' ? 'Fichier de transfert prêt !' : copied ? 'Code de transfert copié !' : 'Transfert créé'}</h1><p>{definition?.title} · {created.recipientLabel || created.recipientId}</p><div className="transfer-codebox"><code>{created.code}</code><TransferDeliveryButton transfer={created} onError={setError} /></div><p className="muted">{delivery === 'file' ? 'Envoyez le fichier .btcg à votre ami.' : copied ? 'Transmettez-le à votre ami.' : 'Retrouvez le code dans Codes envoyés pour le copier.'}</p><ErrorNotice error={error} /><Link className="primary-button" to="/echanges">Voir les transferts</Link></section></FullscreenPanel>
  if (!drop || drop.status !== 'owned') return <EmptyState icon={<Send size={24} />} title="Cet exemplaire n’est plus disponible." action={<Link className="secondary-button" to="/echanges">Codes envoyés</Link>}>Retrouvez vos codes dans Codes envoyés.</EmptyState>
  return <section className="send-page"><Link className="text-button send-back" to="/collection"><ArrowLeft size={15} /> Collection</Link><div className="send-heading"><h1 className="page-title">Donner une carte</h1><p>{definition?.title}</p></div><p className="send-explainer">Choisissez un ami. Cet exemplaire quittera votre collection.</p><ErrorNotice error={error} /><FriendPicker disabled={busy} actionLabel="Donner à" onPick={friend => void send(friend.playerUuid)} /></section>
}
