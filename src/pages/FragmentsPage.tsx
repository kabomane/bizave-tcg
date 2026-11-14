import { useRef, useState } from 'react'
import { ArrowDownLeft, Check, Gem, Send } from 'lucide-react'
import { useGame } from '../components/useGame'
import { useSettings } from '../settings/useSettings'
import { FriendPicker } from '../components/FriendPicker'
import { FragmentAmountPicker } from '../components/FragmentAmountPicker'
import { ReceiveSheet } from '../components/ReceiveSheet'
import { SentCodesList } from '../components/SentCodesList'
import { TransferDeliveryButton } from '../components/TransferDeliveryButton'
import { ErrorNotice, Modal } from '../components/ui'
import { copyPromisedText, errorText } from '../components/format'
import { sendFragments } from '../exchanges/services'
import { MAX_FRAGMENT_TRANSFER } from '../exchanges/crypto'
import type { FriendContactRow, OutgoingTransferRow } from '../game/types'

export function FragmentsPage() {
  const { player } = useGame(), { transferMode } = useSettings()
  const [sheet, setSheet] = useState<'send' | 'receive' | null>(null)
  const [friend, setFriend] = useState<FriendContactRow | null>(null), [amount, setAmount] = useState(0)
  const [created, setCreated] = useState<OutgoingTransferRow | null>(null), [copied, setCopied] = useState(false)
  const [delivery, setDelivery] = useState<'code' | 'file'>('code'), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const inFlight = useRef(false)
  const max = Math.min(player.fragments, MAX_FRAGMENT_TRANSFER), value = Math.min(amount, max)
  function openSend() { setFriend(null); setAmount(0); setCreated(null); setError(''); setSheet('send') }
  async function send() {
    if (!friend || value < 1 || inFlight.current) return
    inFlight.current = true; setBusy(true); setError('')
    try {
      const mode = transferMode, transfer = sendFragments(value, friend.playerUuid)
      const copying = mode === 'code' ? copyPromisedText(transfer.then(row => row.code)).then(() => true, () => false) : Promise.resolve(false)
      const row = await transfer
      setCreated(row); setDelivery(mode); setCopied(await copying)
    } catch (e) { setError(errorText(e)) }
    finally { inFlight.current = false; setBusy(false) }
  }
  return <>
    <div className="fragments-page">
      <section className="fragment-main"><header className="fragment-heading"><h1 className="page-title">Fragments</h1><p>Gagnés en recyclant vos cartes, à partager avec vos amis.</p></header>
        <div className="fragment-balance"><Gem size={46} /><div><strong className="fragment-number">{player.fragments.toLocaleString('fr-FR')}</strong><small>Fragments</small></div></div>
        <div className="fragment-actions"><button className="primary-button" disabled={player.fragments === 0} onClick={openSend}><Send size={16} /> Envoyer</button><button className="secondary-button" onClick={() => setSheet('receive')}><ArrowDownLeft size={16} /> Recevoir</button></div>
      </section>
      <div className="fragment-inline-codes"><SentCodesList kind="fragments" limit={2} /></div>
    </div>
    {sheet === 'receive' && <ReceiveSheet origin="fragments" onClose={() => setSheet(null)} />}
    {sheet === 'send' && <Modal title={created ? 'Transfert créé' : friend ? 'Quel montant ?' : 'À qui ?'} showTitle={!created} className="transfer-sheet" onClose={() => { if (!busy) setSheet(null) }}>
      {created ? <div className="fragment-success"><span className="transfer-success-mark clipboard-confirm"><Check size={28} /></span><h2>{delivery === 'file' ? 'Fichier de transfert prêt !' : copied ? 'Code de transfert copié !' : 'Transfert créé'}</h2><p><Gem size={15} />{created.kind === 'fragments' && created.amount.toLocaleString('fr-FR')} fragments · {created.recipientLabel || created.recipientId}</p><div className="transfer-codebox"><code>{created.code}</code><TransferDeliveryButton transfer={created} onError={setError} /></div><p className="muted">{delivery === 'file' ? 'Envoyez le fichier .btcg à votre ami.' : 'Transmettez ce code à votre ami.'}</p><ErrorNotice error={error} /><button className="primary-button" onClick={() => setSheet(null)}>Terminé</button></div> : friend ? <>
        <button type="button" className="recipient-chip" disabled={busy} onClick={() => setFriend(null)}><span className="friend-avatar">{(friend.label || friend.playerUuid).slice(0, 1)}</span><strong>À {friend.label || friend.playerUuid}</strong><span>Changer</span></button>
        <fieldset className="fragment-amount-fields" disabled={busy}><FragmentAmountPicker value={value} max={max} balance={player.fragments} onChange={setAmount} disabled={busy} /></fieldset>
        <ErrorNotice error={error} /><button type="button" className="primary-button fragment-send-button" disabled={busy || value < 1} onClick={() => void send()}>{busy ? 'Création…' : value ? `Envoyer ${value.toLocaleString('fr-FR')} fragments` : 'Choisissez un montant'}</button><p className="hold-hint">À la création du code, les fragments quittent votre solde.</p>
      </> : <><p className="sheet-step">Envoyer des fragments · 1 / 2</p><FriendPicker onPick={setFriend} /></>}
    </Modal>}
  </>
}
