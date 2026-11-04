import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { ArrowDownLeft, Check, ClipboardPaste, Pencil, Plus, Users } from 'lucide-react'
import { db } from '../storage/database'
import { addContact, ensureIdentity, renameFriend, removeFriend } from '../exchanges/services'
import { createContactCode, parseContactCode } from '../exchanges/crypto'
import { EmptyState, ErrorNotice, Modal } from '../components/ui'
import { SentCodesList } from '../components/SentCodesList'
import { ReceiveSheet } from '../components/ReceiveSheet'
import { CopyButton } from '../components/CopyButton'
import { useSentCodes } from '../components/useSentCodes'
import { errorText } from '../components/format'

export function ExchangesPage() {
  const contactOperation = useRef(0)
  const [receiving, setReceiving] = useState(false), [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string | null>(null), [editName, setEditName] = useState('')
  const [editMode, setEditMode] = useState<'profile' | 'rename' | 'remove'>('profile'), [editError, setEditError] = useState('')
  const [contact, setContact] = useState(''), [label, setLabel] = useState('')
  const [contactChecked, setContactChecked] = useState(false)
  const [addDialogVersion, setAddDialogVersion] = useState(0)
  const [identityError, setIdentityError] = useState(''), [contactError, setContactError] = useState('')
  const [busy, setBusy] = useState(false), [pasting, setPasting] = useState(false)
  const [pendingFriendKey, setPendingFriendKey] = useState<string | null>(null)
  const identity = useLiveQuery(() => db.identity.get('local'))
  const friends = useLiveQuery(() => db.friends.toArray(), [], [])
  const { codes } = useSentCodes()
  const editingFriend = friends.find(friend => friend.playerUuid === editing)
  const sorted = [...friends].sort((a, b) => (a.label || a.playerUuid).localeCompare(b.label || b.playerUuid, 'fr'))
  useEffect(() => { ensureIdentity().catch(e => setIdentityError(errorText(e))) }, [])
  useEffect(() => {
    if (!adding || !pendingFriendKey || !friends.some(friend => `${friend.playerUuid}:${friend.fingerprint}` === pendingFriendKey)) return
    // Close as soon as the committed contact is visible, even if the browser delays
    // resolution of the IndexedDB transaction's promise.
    const frame = requestAnimationFrame(() => { setAdding(false); setPendingFriendKey(null); setBusy(false) })
    return () => cancelAnimationFrame(frame)
  }, [adding, pendingFriendKey, friends])
  function openAdd() { contactOperation.current++; setBusy(false); setPasting(false); setContact(''); setContactChecked(false); setLabel(''); setContactError(''); setPendingFriendKey(null); setAdding(true) }
  function closeAdd() { contactOperation.current++; setAdding(false); setBusy(false); setPasting(false); setPendingFriendKey(null) }
  async function pasteContact() {
    const operation = ++contactOperation.current
    setPasting(true); setContactChecked(false); setContact(''); setContactError('')
    let timer: ReturnType<typeof setTimeout> | undefined
    try {
      const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new Error('La lecture du code a pris trop de temps. Réessayez.')), 8000) })
      let value: string
      try { value = await Promise.race([navigator.clipboard.readText(), deadline]) }
      catch { throw new Error('Collage indisponible. Vérifiez l’autorisation du presse-papiers puis réessayez.') }
      if (operation !== contactOperation.current) return
      if (!value.trim()) throw new Error('Copiez d’abord le code ami de votre contact.')
      const friend = await Promise.race([parseContactCode(value), deadline])
      if (operation !== contactOperation.current) return
      if (friend.playerUuid === identity?.playerUuid) throw new Error('Ce code est le vôtre. Copiez celui de votre ami.')
      setContact(value.trim())
      setContactChecked(true)
    } catch (e) {
      if (operation === contactOperation.current) {
        setContact(''); setContactError(errorText(e))
        // Recreate the native dialog after the clipboard interaction so Safari
        // releases its old focus/top-layer state. Form values stay in this page.
        setAddDialogVersion(version => version + 1)
      }
    }
    finally { clearTimeout(timer); if (operation === contactOperation.current) setPasting(false) }
  }
  async function add() {
    if (busy || pasting) return
    if (!label.trim()) { setContactError('Donnez un nom à votre ami.'); return }
    if (!contact) { setContactError('Collez le code ami avant de continuer.'); return }
    const operation = ++contactOperation.current
    setBusy(true); setContactError('')
    try {
      const friend = await parseContactCode(contact)
      if (operation !== contactOperation.current) return
      setPendingFriendKey(`${friend.playerUuid}:${friend.fingerprint}`)
      await addContact(contact, label)
      if (operation !== contactOperation.current) return
      setAdding(false); setPendingFriendKey(null); setContact(''); setLabel('')
    }
    catch (e) { if (operation === contactOperation.current) { setPendingFriendKey(null); setContactError(errorText(e)); setAddDialogVersion(version => version + 1) } } finally { if (operation === contactOperation.current) setBusy(false) }
  }
  async function saveFriend(remove = false) {
    if (!editingFriend || busy) return
    setBusy(true); setEditError('')
    try {
      if (remove) await removeFriend(editingFriend.playerUuid)
      else await renameFriend(editingFriend.playerUuid, editName)
      setEditing(null)
    } catch (e) { setEditError(errorText(e)) } finally { setBusy(false) }
  }
  return <>
    <ErrorNotice error={identityError} />
    <div className="friends-page">
      <header className="friends-hero"><div><div className="title-with-count"><h1 className="page-title">Amis</h1><span>{friends.length}</span></div><p>Vos amis, les codes reçus et ceux que vous avez envoyés.</p></div>
        {!!friends.length && <div className="friends-actions"><button className="primary-button" onClick={() => setReceiving(true)}><ArrowDownLeft size={16} /> Recevoir</button><button className="secondary-button" disabled={!identity} onClick={openAdd}><Plus size={16} /> Ajouter un ami</button></div>}
      </header>
      {!!(friends.length || codes.some(row => row.kind === 'card')) && <div className="friends-codes"><SentCodesList kind="card" limit={3} /></div>}
      {friends.length ? <section className="friends-people" aria-label="Vos amis"><div className="codes-heading"><h2>Vos amis <span className="codes-count">{friends.length}</span></h2></div><div className="friend-list">{sorted.map(friend => <button type="button" className="friend-row" key={friend.playerUuid} aria-label={`Modifier ${friend.label || friend.playerUuid}`} onClick={() => { setEditing(friend.playerUuid); setEditName(friend.label || ''); setEditMode('profile'); setEditError('') }}><div className="friend-avatar" aria-hidden="true">{(friend.label || friend.playerUuid).slice(0, 1)}</div><div><strong>{friend.label || friend.playerUuid}</strong><span>{friend.playerUuid}</span></div><Pencil size={16} /></button>)}</div></section> : <EmptyState icon={<Users size={25} />} title="Votre cercle commence ici." action={<button className="secondary-button" disabled={!identity} onClick={openAdd}><Plus size={15} /> Ajouter un ami</button>}>Échangez vos codes de contact.</EmptyState>}
    </div>
    {receiving && <ReceiveSheet origin="friends" onClose={() => setReceiving(false)} />}
    {adding && <Modal key={addDialogVersion} title="Ajouter un ami" className="transfer-sheet" onClose={closeAdd}>
      {identity && <><div className="friend-code-row"><div className="friend-code-avatar" aria-hidden="true">b.</div><div className="friend-code-label"><strong>Votre code ami</strong><small>À envoyer à votre ami en premier</small></div><CopyButton text={createContactCode(identity)} label="Copier" compact onError={setContactError} /></div><div className="friend-code-then">puis</div></>}
      <form className="contact-form" onSubmit={event => { event.preventDefault(); void add() }}>
        <label className="field-label">Son nom<input required aria-label="Nom de l’ami" value={label} maxLength={80} autoComplete="off" onChange={event => setLabel(event.target.value)} placeholder="Nom de l’ami" /></label>
        <button type="button" className={`secondary-button friend-paste-button ${contactChecked ? 'is-confirmed' : ''}`} aria-label={pasting ? 'Collage…' : contactChecked ? 'Code ami collé !' : 'Coller son code ami'} disabled={busy} onClick={pasteContact}><span key={contactChecked ? 'pasted' : 'empty'} className={contactChecked ? 'clipboard-confirm' : ''} aria-hidden="true">{contactChecked ? <Check size={17} /> : <ClipboardPaste size={17} />}</span><span role="status" aria-live="polite">{pasting ? 'Collage…' : contactChecked ? 'Code ami collé !' : 'Coller son code ami'}</span></button>
        <ErrorNotice error={contactError} /><button className="primary-button" disabled={!contact.trim() || !label.trim() || busy || pasting || !identity}><Plus size={15} /> Ajouter</button>
      </form>
    </Modal>}
    {editingFriend && <Modal title={editMode === 'remove' ? 'Retirer cet ami ?' : editMode === 'rename' ? 'Renommer' : 'Fiche ami'} className="transfer-sheet" onClose={() => { if (!busy) setEditing(null) }}>
      {editMode === 'profile' ? <div className="friend-profile"><div className="friend-avatar">{(editingFriend.label || editingFriend.playerUuid).slice(0, 1)}</div><h2>{editingFriend.label || editingFriend.playerUuid}</h2><p>ID {editingFriend.playerUuid}</p><button className="secondary-button" onClick={() => setEditMode('rename')}><Pencil size={16} /> Renommer</button><button className="text-button danger-text" onClick={() => setEditMode('remove')}>Retirer de vos amis</button></div> : editMode === 'remove' ? <div className="friend-edit-form"><p>{editingFriend.label || editingFriend.playerUuid} disparaîtra de vos amis. Vous pourrez l’ajouter à nouveau avec son code ami. Ses codes en cours restent valables.</p><ErrorNotice error={editError} /><button className="primary-button danger-button" disabled={busy} onClick={() => saveFriend(true)}>Retirer {editingFriend.label || editingFriend.playerUuid}</button><button className="text-button" disabled={busy} onClick={() => setEditMode('profile')}>Annuler</button></div> : <form className="friend-edit-form" onSubmit={event => { event.preventDefault(); void saveFriend() }}><label className="field-label">Nom de l’ami<input required value={editName} maxLength={80} onChange={event => setEditName(event.target.value)} /></label><ErrorNotice error={editError} /><button className="primary-button" disabled={busy || !editName.trim()}>Enregistrer</button><button type="button" className="text-button" disabled={busy} onClick={() => setEditMode('profile')}>Retour</button></form>}
    </Modal>}
  </>
}
