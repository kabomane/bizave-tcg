import { useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownLeft, Check, ClipboardPaste, FileUp } from 'lucide-react'
import { db } from '../storage/database'
import { readCollection, memoryDecision, type VerifiedCollection } from '../collection/collectionCrypto'
import { readCollectionFile } from '../collection/collectionFile'
import { FUTURE_COLLECTION_SECONDS, saveCollectionMemory } from '../collection/collectionMemory'
import { COLLECTION_LIMITS } from '../collection/snapshotCodec'
import { readLocalPreferences } from '../settings/preferences'
import { useSettings } from '../settings/useSettings'
import { Modal, ErrorNotice } from './ui'
import { errorText } from './format'
import { SharedCollectionViewer } from './SharedCollectionViewer'

export function ReceiveCollectionSheet({ onClose, expectedSender, expectedName }: { onClose: () => void; expectedSender?: string; expectedName?: string }) {
  const [code, setCode] = useState(''), [source, setSource] = useState(''), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const [snapshot, setSnapshot] = useState<VerifiedCollection | null>(null), [opened, setOpened] = useState(false), [notice, setNotice] = useState('')
  const [confirmation, setConfirmation] = useState<string[]>([])
  const file = useRef<HTMLInputElement>(null), inFlight = useRef(false), alive = useRef(true)
  const settings = useSettings(), friends = useLiveQuery(() => db.friends.toArray(), [], [])
  function close() { alive.current = false; onClose() }
  async function receive() {
    if (inFlight.current) return
    inFlight.current = true; setBusy(true); setError(''); setNotice('')
    try {
      if (code.trim().length > COLLECTION_LIMITS.text) throw new Error('Ce code de collection dépasse 32 768 caractères.')
      const verified = await readCollection(code.trim())
      if (expectedSender && verified.senderId !== expectedSender) throw new Error('Cette collection appartient à un autre ami. Ouvrez sa fiche ami pour recevoir sa collection.')
      if (!alive.current) return
      setSnapshot(verified)
      const future = verified.issuedAt > Math.floor(Date.now() / 1000) + FUTURE_COLLECTION_SECONDS
      if (!readLocalPreferences().rememberCollections) { setNotice('Aperçu temporaire : cette collection n’est pas mémorisée.'); setOpened(true); return }
      try {
        const decision = await memoryDecision(verified, await db.friends.toArray())
        if (!alive.current) return
        const warnings: string[] = []
        if (future) warnings.push('La date déclarée dépasse les prochaines 24 heures. Voulez-vous mémoriser cet instantané ?')
        if (decision === 'older') warnings.push('Une collection plus récente de cet ami est déjà en mémoire. La remplacer ?')
        if (decision === 'sameTime') warnings.push('Un autre code de cet ami porte la même date. Remplacer la collection en mémoire ?')
        if (decision === 'invalid') warnings.push('La collection mémorisée est illisible ou ne se vérifie plus. La remplacer ?')
        if (warnings.length) { setConfirmation(warnings); return }
        if (decision === 'identical') setNotice('Cette collection est déjà en mémoire.')
        else if (readLocalPreferences().rememberCollections) { saveCollectionMemory(verified); setNotice('Collection mémorisée sur cet appareil.') }
      } catch (e) { setNotice(errorText(e)) }
      setOpened(true)
    } catch (e) { if (alive.current) setError(errorText(e)) } finally { inFlight.current = false; if (alive.current) setBusy(false) }
  }
  async function confirmMemory() {
    if (!snapshot || inFlight.current) return
    inFlight.current = true; setBusy(true)
    try {
      const verified = await readCollection(snapshot.code)
      if (readLocalPreferences().rememberCollections) { saveCollectionMemory(verified); setNotice('Collection mémorisée sur cet appareil.') }
      else setNotice('Aperçu temporaire : cette collection n’est pas mémorisée.')
      setConfirmation([]); setOpened(true)
    } catch (e) { setError(errorText(e)); setConfirmation([]); setSnapshot(null) } finally { inFlight.current = false; setBusy(false) }
  }
  if (opened && snapshot) return <SharedCollectionViewer snapshot={snapshot} name={friends.find(friend => friend.playerUuid === snapshot.senderId)?.label || snapshot.senderId} onClose={close} notice={notice} />
  return <Modal title={expectedName ? `Recevoir la collection de ${expectedName}` : 'Consulter une collection'} className="transfer-sheet receive-sheet" onClose={() => { if (!busy) close() }}>
    {confirmation.length && snapshot ? <div className="collection-memory-confirm">{confirmation.map(text => <p key={text}>{text}</p>)}<div className="collection-share-actions"><button type="button" className="primary-button" disabled={busy} onClick={() => void confirmMemory()}>Mémoriser et ouvrir</button><button type="button" className="secondary-button" disabled={busy} onClick={() => { setNotice('Collection consultée sans remplacer la mémoire.'); setConfirmation([]); setOpened(true) }}>Consulter seulement</button><button type="button" className="text-button" disabled={busy} onClick={() => { setConfirmation([]); setSnapshot(null) }}>Annuler</button></div></div> : <form className="receive-form" onSubmit={event => { event.preventDefault(); void receive() }}>
      <p className="sheet-lead">Collez le code reçu ou importez le fichier <code>.btcg</code>{expectedName && <> de {expectedName}</>}. Vous pourrez consulter sa collection sans modifier la vôtre.</p>
      <div className="receive-actions"><button type="button" className="secondary-button" disabled={busy} onClick={async () => { setBusy(true); setError(''); setCode(''); setSource(''); try { const text = await navigator.clipboard.readText(); if (text.length > COLLECTION_LIMITS.text) throw new Error('Ce code de collection dépasse 32 768 caractères.'); if (!text.trim()) throw new Error('Copiez d’abord un code de collection.'); setCode(text.trim()); setSource('Code de collection prêt') } catch (e) { setError(e instanceof Error && (e.message.startsWith('Copiez') || e.message.startsWith('Ce code')) ? e.message : 'Collage indisponible. Autorisez le presse-papiers ou importez le fichier .btcg.') } finally { setBusy(false) } }}><ClipboardPaste size={16} />Coller le code</button><button type="button" className="secondary-button" disabled={busy} onClick={() => file.current?.click()}><FileUp size={16} />Importer un fichier</button></div>
      <input className="visually-hidden" ref={file} type="file" tabIndex={-1} accept=".btcg" aria-label="Fichier de collection .btcg" disabled={busy} onChange={async event => { const selected = event.target.files?.[0]; event.target.value = ''; if (!selected) return; setBusy(true); setError(''); setCode(''); setSource(''); try { setCode(await readCollectionFile(selected)); setSource(selected.name) } catch (e) { setError(errorText(e)) } finally { setBusy(false) } }} />
      {source && <p className="receive-ready" role="status"><Check size={16} /><span>{source}</span><button type="button" className="text-button" disabled={busy} onClick={() => { setCode(''); setSource(''); setError('') }}>Changer</button></p>}
      <p className="field-help">{settings.rememberCollections ? 'La collection vérifiée sera mémorisée sur cet appareil.' : 'Aperçu temporaire. Activez « Collection en mémoire » dans les paramètres pour la conserver.'}</p><ErrorNotice error={error} /><button type="submit" className="primary-button" disabled={busy || !code.trim()}><ArrowDownLeft size={16} />{busy ? 'Vérification…' : 'Recevoir'}</button>
    </form>}
  </Modal>
}
