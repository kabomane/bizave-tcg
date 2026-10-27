import { useState } from 'react'
import { Copy } from 'lucide-react'
import { copyText, errorText } from './format'
import { ConfirmationButton } from './ConfirmationButton'
import { useTransientFlag } from './useTransientFlag'

export function CopyButton({ text, label = 'Copier le code', onError, compact = false }: { text: string; label?: string; onError: (message: string) => void; compact?: boolean }) {
  const [copied, setCopied] = useTransientFlag(), [busy, setBusy] = useState(false)
  async function copy() {
    if (busy) return
    setBusy(true); setCopied(false)
    try { await copyText(text); setCopied(true) } catch (e) { onError(errorText(e)) } finally { setBusy(false) }
  }
  return <ConfirmationButton icon={Copy} label={label} confirmation="Code copié !" confirmed={copied} className={`secondary-button copy-feedback ${compact ? 'copy-compact' : ''} ${copied ? 'is-confirmed' : ''}`} action={copy} disabled={busy} live="polite" />
}
