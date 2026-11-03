import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownLeft, Check, ClipboardPaste, FileUp, Gem } from 'lucide-react'
import { db } from '../storage/database'
import { receiveCode, type Received } from '../exchanges/services'
import { readTransferFile } from '../exchanges/transferFile'
import { unbase64url } from '../exchanges/crypto'
import { ErrorNotice, Modal } from './ui'
import { errorText } from './format'
import { CardViewer } from './CardViewer'
import { variantKey } from '../game/engine'
import { useGame } from './useGame'

export function ReceiveSheet({ onClose }: { onClose: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null), inFlight = useRef(false)
  const [received, setReceived] = useState<Received | null>(null), [sender, setSender] = useState('')
  const [code, setCode] = useState(''), [source, setSource] = useState(''), [error, setError] = useState('')
  const [busy, setBusy] = useState(false), [reading, setReading] = useState(false)
  const friends = useLiveQuery(() => db.friends.toArray(), [], [])
  const { player, drops } = useGame()
  async function receive() {
    if (inFlight.current) return
    inFlight.current = true; setBusy(true); setError('')
    try {
      const result = await receiveCode(code)
      // Only read the sender from a card envelope after receiveCode authenticated it.
      const senderId = result.kind === 'fragments' ? result.senderId : JSON.parse(new TextDecoder().decode(unbase64url(code.slice(4)))).payload.senderId as string
      setSender(friends.find(friend => friend.playerUuid === senderId)?.label || senderId)
      setReceived(result); setCode(''); setSource('')
    } catch (e) { setError(errorText(e)) }
    finally { inFlight.current = false; setBusy(false) }
  }
  if (received?.kind === 'card') return <CardViewer entries={[{ key: variantKey(received.card), card: received.card, ids: [received.card.dropId], acquiredAt: drops.find(drop => drop.dropId === received.card.dropId)?.updatedAt ?? 0 }]} receivedFrom={sender} onClose={onClose} />
  const title = received ? 'Fragments reçus' : 'Recevoir un code'
  return <Modal title={title} className="transfer-sheet receive-sheet" onClose={() => { if (!busy && !reading) onClose() }}>
    {received ? <div className="receive-result">
      <><div className="received-fragments"><Gem size={38} /><span className="fragment-number">+{received.amount.toLocaleString('fr-FR')}</span></div><h2>Fragments reçus</h2><p role="status">De {sender} · ajoutés à votre solde</p><p className="muted">Solde : <strong>{player.fragments.toLocaleString('fr-FR')}</strong></p></>
      <button type="button" className="primary-button" onClick={onClose}>Parfait</button>
    </div> : <form className="receive-form" onSubmit={event => { event.preventDefault(); void receive() }}>
      <p className="sheet-lead">Collez le code reçu ou importez le fichier <code>.btcg</code>. Une carte ou des fragments : le code sait ce qu’il contient.</p>
      <div className="receive-actions"><button type="button" className="secondary-button" disabled={busy || reading} onClick={async () => {
        setReading(true); setCode(''); setSource(''); setError('')
        try { const value = await navigator.clipboard.readText(); if (!value.trim()) throw new Error('Copiez d’abord le code de transfert reçu.'); setCode(value.trim()); setSource('Code de transfert prêt') }
        catch (e) { setError(e instanceof Error && e.message.startsWith('Copiez') ? e.message : 'Collage indisponible. Autorisez le presse-papiers ou importez le fichier .btcg.') }
        finally { setReading(false) }
      }}><ClipboardPaste size={16} /> Coller le code</button><button type="button" className="secondary-button" disabled={busy || reading} onClick={() => fileInput.current?.click()}><FileUp size={16} /> Importer un fichier</button></div>
      <input ref={fileInput} className="visually-hidden" tabIndex={-1} type="file" accept=".btcg" aria-label="Fichier de transfert .btcg" disabled={busy || reading} onChange={async event => {
        const file = event.target.files?.[0]; event.target.value = ''; if (!file) return
        setReading(true); setCode(''); setSource(''); setError('')
        try { setCode(await readTransferFile(file)); setSource(file.name) }
        catch (e) { setError(errorText(e)) } finally { setReading(false) }
      }} />
      {source && <p className="receive-ready" role="status"><Check size={16} /><span>{source}</span><button type="button" className="text-button" disabled={busy} onClick={() => { setCode(''); setSource(''); setError('') }}>Changer</button></p>}
      {!friends.length && <p className="field-help">Ajoutez d’abord le contact de l’expéditeur.</p>}
      <ErrorNotice error={error} /><button className="primary-button" disabled={busy || reading || !code || !friends.length}><ArrowDownLeft size={16} />{reading ? 'Lecture…' : busy ? 'Vérification…' : 'Recevoir'}</button>
    </form>}
  </Modal>
}
