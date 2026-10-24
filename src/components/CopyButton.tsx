import { useEffect, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import { copyText, errorText } from './format'

export function CopyButton({ text, label = 'Copier le code', onError, compact = false }: { text: string; label?: string; onError: (message: string) => void; compact?: boolean }) {
  const [copied, setCopied] = useState(false), [busy, setBusy] = useState(false)
  useEffect(() => { if (!copied) return; const timer = window.setTimeout(() => setCopied(false), 3000); return () => window.clearTimeout(timer) }, [copied])
  async function copy() {
    if (busy) return
    setBusy(true); setCopied(false)
    try { await copyText(text); setCopied(true) } catch (e) { onError(errorText(e)) } finally { setBusy(false) }
  }
  return <button type="button" className={`secondary-button copy-feedback ${compact ? 'copy-compact' : ''} ${copied ? 'is-confirmed' : ''}`} aria-label={copied ? 'Code copié !' : label} onClick={copy} disabled={busy}><span key={String(copied)} className={copied ? 'clipboard-confirm' : ''} aria-hidden="true">{copied ? <Check size={16} /> : <Copy size={16} />}</span><span role="status" aria-live="polite">{copied ? 'Code copié !' : label}</span></button>
}
