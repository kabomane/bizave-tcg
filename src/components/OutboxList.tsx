import { useLiveQuery } from 'dexie-react-hooks'
import { Clock3, Send } from 'lucide-react'
import { db } from '../storage/database'
import { OUTBOX_RETENTION_MS } from '../exchanges/services'
import { cardById } from '../data/cards'
import type { FriendContactRow } from '../game/types'
import { useGame } from './useGame'
import { useNow } from './useNow'
import { EmptyState } from './ui'
import { TransferDeliveryButton } from './TransferDeliveryButton'
import { formatCountdown } from './format'

export function OutboxList({ friends }: { friends: FriendContactRow[] }) {
  const { drops, notify } = useGame(), now = useNow()
  const outbox = useLiveQuery(() => db.outbox.orderBy('createdAt').reverse().toArray(), [], [])
  const activeOutbox = outbox.filter(row => row.createdAt + OUTBOX_RETENTION_MS > now)
  return activeOutbox.length ? <div className="transfer-list">{activeOutbox.map(row => {
        const drop = drops.find(item => item.dropId === row.dropId), definition = drop && cardById.get(drop.cardId)
        const friendName = friends.find(friend => friend.playerUuid === row.recipientId)?.label || row.recipientLabel || row.recipientId
        return <article className="transfer-row" key={row.transferId}><div className="transfer-thumb">{definition && drop ? <img src={definition.artwork[drop.artVariant]} alt="" /> : <Send size={19} />}</div><div className="transfer-info"><strong>{definition?.title || 'Carte envoyée'}</strong><span>À {friendName}</span><small title="Suppression de cette entrée après 24 h"><Clock3 size={11} />{formatCountdown(row.createdAt + OUTBOX_RETENTION_MS - now)}</small></div><TransferDeliveryButton transfer={row} onError={notify} /></article>
      })}</div> : <EmptyState icon={<Send size={25} />} title="Aucun envoi en cours.">Les transferts restent disponibles ici pendant 24 h.</EmptyState>
}
