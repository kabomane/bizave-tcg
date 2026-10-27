import { Download } from 'lucide-react'
import { useSettings } from '../settings/useSettings'
import { downloadTransferFile } from '../exchanges/transferFile'
import type { OutgoingTransferRow } from '../game/types'
import { CopyButton } from './CopyButton'
import { errorText } from './format'
import { ConfirmationButton } from './ConfirmationButton'
import { useTransientFlag } from './useTransientFlag'

export function TransferDeliveryButton({ transfer, onError }: { transfer: OutgoingTransferRow; onError: (message: string) => void }) {
  const { transferMode } = useSettings()
  const [ready, setReady] = useTransientFlag()
  if (transferMode === 'code') return <CopyButton text={transfer.code} label="Copier" compact onError={onError} />
  return <ConfirmationButton icon={Download} label="Télécharger" confirmation="Fichier prêt !" confirmed={ready} className={`secondary-button copy-feedback copy-compact ${ready ? 'is-confirmed' : ''}`} action={() => { try { downloadTransferFile(transfer); setReady(true) } catch (e) { onError(errorText(e)) } }} />
}
