import { useEffect, useState } from 'react'
import { Check, Download } from 'lucide-react'
import { useSettings } from '../settings/useSettings'
import { downloadTransferFile } from '../exchanges/transferFile'
import type { OutgoingTransferRow } from '../game/types'
import { CopyButton } from './CopyButton'
import { errorText } from './format'

export function TransferDeliveryButton({ transfer, onError }: { transfer: OutgoingTransferRow; onError: (message: string) => void }) {
  const { transferMode } = useSettings()
  const [ready, setReady] = useState(false)
  useEffect(() => { if (!ready) return; const timer = window.setTimeout(() => setReady(false), 3000); return () => window.clearTimeout(timer) }, [ready])
  if (transferMode === 'code') return <CopyButton text={transfer.code} label="Copier" compact onError={onError} />
  return <button type="button" aria-label={ready ? 'Fichier prêt !' : 'Télécharger'} className={`secondary-button copy-feedback copy-compact ${ready ? 'is-confirmed' : ''}`} onClick={() => { try { downloadTransferFile(transfer); setReady(true) } catch (e) { onError(errorText(e)) } }}><span key={String(ready)} className={ready ? 'clipboard-confirm' : ''} aria-hidden="true">{ready ? <Check size={16} /> : <Download size={16} />}</span><span role="status">{ready ? 'Fichier prêt !' : 'Télécharger'}</span></button>
}
