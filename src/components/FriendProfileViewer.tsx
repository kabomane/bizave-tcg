import { useEffect, useState } from 'react'
import { BookOpen, Pencil, ArrowDownLeft, Share2, Trash2 } from 'lucide-react'
import type { FriendContactRow } from '../game/types'
import { renameFriend, removeFriend } from '../exchanges/services'
import { COLLECTION_MEMORY_EVENT, forgetCollection, readCollectionMemory } from '../collection/collectionMemory'
import { readCollection, type VerifiedCollection } from '../collection/collectionCrypto'
import { useSettings } from '../settings/useSettings'
import { FullscreenPanel } from './FullscreenPanel'
import { ErrorNotice } from './ui'
import { errorText } from './format'
import { ReceiveCollectionSheet } from './ReceiveCollectionSheet'
import { ShareCollectionSheet } from './ShareCollectionSheet'
import { SharedCollectionViewer } from './SharedCollectionViewer'
import { snapshotDate } from './format'

export function FriendProfileViewer({ friend, onClose }: { friend: FriendContactRow; onClose: () => void }) {
  const [mode, setMode] = useState<'profile' | 'rename' | 'remove'>('profile'), [name, setName] = useState(friend.label || '')
  const [error, setError] = useState(''), [busy, setBusy] = useState(false), [receiving, setReceiving] = useState(false), [sharing, setSharing] = useState(false)
  const [memory, setMemory] = useState<VerifiedCollection | null>(null), [memoryError, setMemoryError] = useState(''), [memoryExists, setMemoryExists] = useState(false), [checking, setChecking] = useState(true)
  const [opened, setOpened] = useState<VerifiedCollection | null>(null), [revision, setRevision] = useState(0), settings = useSettings()
  useEffect(() => {
    const refresh = () => setRevision(value => value + 1)
    window.addEventListener('storage', refresh); window.addEventListener(COLLECTION_MEMORY_EVENT, refresh)
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener(COLLECTION_MEMORY_EVENT, refresh) }
  }, [])
  useEffect(() => {
    let current = true
    async function load() {
      setChecking(true); setMemory(null); setMemoryError(''); setMemoryExists(false)
      try {
        if (!settings.rememberCollections) return
        // Mark corrupted records as present too, so the user can explicitly forget them.
        setMemoryExists(true)
        const saved = readCollectionMemory(friend.playerUuid)
        if (!saved) { if (current) setMemoryExists(false); return }
        const verified = await readCollection(saved.code)
        if (verified.senderId !== friend.playerUuid) throw new Error('Cette collection mémorisée ne correspond pas à cet ami.')
        if (current) setMemory(verified)
      } catch (e) { if (current) setMemoryError(errorText(e)) } finally { if (current) setChecking(false) }
    }
    void load()
    return () => { current = false }
  }, [friend.playerUuid, friend.fingerprint, settings.rememberCollections, revision])
  async function save(remove = false) {
    if (busy) return
    setBusy(true); setError('')
    try { if (remove) { await removeFriend(friend.playerUuid); onClose() } else { await renameFriend(friend.playerUuid, name); setMode('profile') } } catch (e) { setError(errorText(e)) } finally { setBusy(false) }
  }
  async function openMemory() {
    if (busy || !memory) return
    setBusy(true); setError('')
    try { const saved = readCollectionMemory(friend.playerUuid); if (!saved) throw new Error('Cette collection n’est plus en mémoire.'); const verified = await readCollection(saved.code); if (verified.senderId !== friend.playerUuid) throw new Error('Cette collection ne correspond pas à cet ami.'); setOpened(verified) } catch (e) { setMemory(null); setMemoryError(errorText(e)) } finally { setBusy(false) }
  }
  return <><FullscreenPanel title="Fiche ami" onClose={() => { if (!busy) onClose() }}>
    <div className="friend-profile-full"><h1>{friend.label || friend.playerUuid}</h1><p>ID {friend.playerUuid}</p>
      {mode === 'profile' ? <><div className="friend-memory-note">{checking ? <span role="status">Vérification de la collection…</span> : memory ? <>Instantané du {snapshotDate(memory.issuedAt)}</> : settings.rememberCollections ? 'Aucune collection vérifiée en mémoire.' : 'Activez « Collection en mémoire » dans les paramètres pour retrouver ici les collections reçues.'}</div><ErrorNotice error={memoryError} />{memory && <div className="friend-collection-actions"><button type="button" className="primary-button" disabled={busy} onClick={() => void openMemory()}><BookOpen size={17} />Voir la collection</button><button type="button" className="secondary-button" onClick={() => { try { forgetCollection(friend.playerUuid); setRevision(value => value + 1) } catch (e) { setError(errorText(e)) } }}>Oublier cette collection</button></div>}<button type="button" className="secondary-button" onClick={() => setReceiving(true)}><ArrowDownLeft size={16} />{memory ? 'Mettre à jour sa collection' : 'Recevoir sa collection'}</button><button type="button" className="secondary-button" onClick={() => setSharing(true)}><Share2 size={16} />Partager ma collection</button>{memoryExists && !memory && <button type="button" className="text-button" onClick={() => { try { forgetCollection(friend.playerUuid); setRevision(value => value + 1) } catch (e) { setError(errorText(e)) } }}>Oublier cette collection</button>}<button type="button" className="secondary-button" onClick={() => setMode('rename')}><Pencil size={16} />Renommer</button><button type="button" className="text-button danger-text" onClick={() => setMode('remove')}><Trash2 size={14} />Retirer de vos amis</button></> : mode === 'rename' ? <form className="friend-edit-form" onSubmit={event => { event.preventDefault(); void save() }}><label className="field-label">Nom de l’ami<input value={name} required maxLength={80} disabled={busy} onChange={event => setName(event.target.value)} /></label><button className="primary-button" disabled={busy || !name.trim()}>Enregistrer</button><button type="button" className="text-button" disabled={busy} onClick={() => setMode('profile')}>Retour</button></form> : <><p>Cet ami sera retiré et sa collection mémorisée effacée. Ses codes de dons en cours restent valables.</p><button type="button" className="primary-button danger-button" disabled={busy} onClick={() => void save(true)}>Retirer {friend.label || friend.playerUuid}</button><button type="button" className="text-button" disabled={busy} onClick={() => setMode('profile')}>Annuler</button></>}<ErrorNotice error={error} />
    </div>
  </FullscreenPanel>{receiving && <ReceiveCollectionSheet expectedSender={friend.playerUuid} expectedName={friend.label || friend.playerUuid} onClose={() => { setReceiving(false); setRevision(value => value + 1) }} />}{sharing && <ShareCollectionSheet recipientName={friend.label || friend.playerUuid} onClose={() => setSharing(false)} />}{opened && <SharedCollectionViewer snapshot={opened} name={friend.label || friend.playerUuid} onClose={() => setOpened(null)} />}</>
}
