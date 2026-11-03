import { useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowRight, Search, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { db } from '../storage/database'
import { normalize } from '../game/cardSearch'
import type { FriendContactRow } from '../game/types'
import { EmptyState } from './ui'

export function FriendPicker({ onPick, disabled = false, emptyAction, actionLabel = 'Choisir' }: { onPick: (friend: FriendContactRow) => void; disabled?: boolean; emptyAction?: ReactNode; actionLabel?: string }) {
  const friends = useLiveQuery(() => db.friends.toArray(), [], [])
  const [search, setSearch] = useState('')
  const visible = friends.filter(friend => normalize(`${friend.label || ''} ${friend.playerUuid}`).includes(normalize(search.trim()))).sort((a, b) => (a.label || a.playerUuid).localeCompare(b.label || b.playerUuid, 'fr'))
  if (!friends.length) return <EmptyState icon={<Users size={24} />} title="Ajoutez votre premier ami" action={emptyAction ?? <Link className="secondary-button" to="/echanges">Amis</Link>}>Son code ami est nécessaire pour lui envoyer une carte ou des fragments.</EmptyState>
  return <div className="friend-picker">
    <label className="collection-search"><Search size={17} /><input type="search" aria-label="Rechercher un ami" placeholder="Rechercher un ami…" value={search} disabled={disabled} onChange={event => setSearch(event.target.value)} /></label>
    <div className="send-friend-list" aria-label="Destinataires" aria-busy={disabled}>{visible.map(friend => <button type="button" key={friend.playerUuid} className="send-friend" aria-label={`${actionLabel} ${friend.label || friend.playerUuid}`} disabled={disabled} onClick={() => onPick(friend)}><span className="friend-avatar" aria-hidden="true">{(friend.label || friend.playerUuid).slice(0, 1)}</span><strong>{friend.label || friend.playerUuid}</strong><ArrowRight size={17} /></button>)}{!visible.length && <p className="muted">Aucun ami trouvé.</p>}</div>
  </div>
}
