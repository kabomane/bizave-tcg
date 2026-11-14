import { useEffect, useState } from 'react'
import { Check, Download, Layers3 } from 'lucide-react'
import { exportCollection, type VerifiedCollection } from '../collection/collectionCrypto'
import { collectionCounts } from '../collection/collectionSnapshot'
import { downloadCollectionFile } from '../collection/collectionFile'
import { CopyButton } from './CopyButton'
import { ConfirmationButton } from './ConfirmationButton'
import { useSettings } from '../settings/useSettings'
import { ErrorNotice, Modal } from './ui'
import { errorText } from './format'
import { snapshotDate } from './format'

export function ShareCollectionSheet({ onClose, recipientName }: { onClose: () => void; recipientName?: string }) {
  const { transferMode } = useSettings()
  const [copied, setCopied] = useState(false), [fileReady, setFileReady] = useState(false)
  const [snapshot, setSnapshot] = useState<VerifiedCollection | null>(null), [error, setError] = useState(''), [generation, setGeneration] = useState(0)
  useEffect(() => {
    let current = true
    exportCollection().then(result => { if (current) setSnapshot(result) }).catch(e => { if (current) setError(errorText(e)) })
    return () => { current = false }
  }, [generation])
  const counts = snapshot && collectionCounts(snapshot.variants)
  return <Modal title={recipientName ? `Partager ma collection avec ${recipientName}` : 'Partager ma collection'} showTitle={false} className="transfer-sheet" onClose={onClose}>
    {snapshot && counts ? <div className="fragment-success">
      <span className="transfer-success-mark clipboard-confirm"><Check size={28} /></span>
      <h2>{transferMode === 'file' ? 'Fichier de collection prêt !' : copied ? 'Code de collection copié !' : 'Votre collection est prête'}</h2>
      <p><Layers3 size={15} />{counts.quantity} {counts.quantity === 1 ? 'exemplaire' : 'exemplaires'} · {counts.variants} {counts.variants === 1 ? 'variante' : 'variantes'}{recipientName && <> · {recipientName}</>}</p>
      <div className="transfer-codebox"><code>{snapshot.code}</code><>{transferMode === 'code' ? <CopyButton text={snapshot.code} label="Copier" compact onError={setError} onCopied={() => setCopied(true)} /> : <ConfirmationButton icon={Download} label="Télécharger" confirmation="Fichier prêt !" confirmed={fileReady} className={`secondary-button copy-feedback copy-compact${fileReady ? ' is-confirmed' : ''}`} action={() => { try { downloadCollectionFile(snapshot.code, snapshot.senderId, snapshot.issuedAt); setFileReady(true); setError('') } catch (e) { setError(errorText(e)) } }} />}</></div>
      <p className="muted">{transferMode === 'file' ? 'Envoyez le fichier .btcg à votre ami.' : recipientName ? `Transmettez ce code à ${recipientName}.` : 'Transmettez ce code à votre ami.'}</p>
      <p className="collection-share-summary">Instantané du {snapshotDate(snapshot.issuedAt)}</p>
      <ErrorNotice error={error} /><button type="button" className="primary-button" onClick={onClose}>Terminé</button>
    </div> : <><p role="status">{error ? '' : 'Préparation de l’instantané…'}</p><ErrorNotice error={error} />{error && <button type="button" className="secondary-button" onClick={() => { setError(''); setGeneration(value => value + 1) }}>Réessayer</button>}</>}
  </Modal>
}
