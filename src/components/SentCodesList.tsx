import { useState } from 'react'
import { Clock3, Gem, Send } from 'lucide-react'
import { OUTBOX_RETENTION_MS } from '../exchanges/outbox'
import { cardById } from '../data/cards'
import { useGame } from './useGame'
import { useSentCodes } from './useSentCodes'
import { ErrorNotice } from './ui'
import { TransferDeliveryButton } from './TransferDeliveryButton'

export function SentCodesList({ kind = 'all', limit, showHeading = true }: { kind?: 'all' | 'card' | 'fragments'; limit?: number; showHeading?: boolean }) {
  const { drops } = useGame(), { codes, now } = useSentCodes()
  const [expanded, setExpanded] = useState(false), [error, setError] = useState('')
  const visible = codes.filter(row => kind === 'all' || row.kind === kind)
  return <section className="sent-codes" aria-label="Codes envoyés">
    {showHeading && <div className="codes-heading"><h2>Codes envoyés <span className="codes-count">{visible.length}</span></h2></div>}
    <ErrorNotice error={error} />
    {visible.length ? <div className="transfer-list">{visible.map((row, index) => {
      const drop = row.kind === 'card' ? drops.find(item => item.dropId === row.dropId) : undefined
      const definition = drop && cardById.get(drop.cardId)
      const remaining = Math.min(OUTBOX_RETENTION_MS, row.createdAt + OUTBOX_RETENTION_MS - now)
      const minutes = Math.ceil(remaining / 60_000)
      return <article className={`transfer-row ${!expanded && limit && index >= limit ? 'code-after-limit' : ''}`} key={row.transferId}>
        <div className={`transfer-thumb ${row.kind === 'fragments' ? 'fragment-thumb' : ''}`}>{row.kind === 'fragments' ? <Gem size={18} /> : definition && drop ? <img src={definition.artwork[drop.artVariant]} alt="" /> : <Send size={18} />}</div>
        <div className="transfer-info"><strong>{row.kind === 'fragments' ? `${row.amount.toLocaleString('fr-FR')} fragments` : definition?.title || 'Carte envoyée'}</strong><small><Clock3 size={11} /><span>{Math.floor(minutes / 60)} h {String(minutes % 60).padStart(2, '0')} restantes · pour {row.recipientLabel || row.recipientId}</span></small><div className="code-lifetime" aria-hidden="true"><i style={{ width: `${Math.min(100, remaining / OUTBOX_RETENTION_MS * 100)}%` }} /></div></div>
        <TransferDeliveryButton transfer={row} onError={setError} />
      </article>
    })}</div> : <p className="codes-empty">Aucun code en cours. Quand vous donnez une carte ou des fragments, le code reste ici 24 h.</p>}
    {limit && !expanded && visible.length > limit && <div className="codes-more"><button type="button" className="text-button" onClick={() => setExpanded(true)}>Tout voir · {visible.length}</button></div>}
  </section>
}
