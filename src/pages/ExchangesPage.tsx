import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { useSearchParams } from 'react-router-dom'
import { ArrowDownLeft, Check, ClipboardPaste, Copy, FileUp, Pencil, Plus, UserRound, Users } from 'lucide-react'
import { db } from '../storage/database'
import { addContact, ensureIdentity, receiveTransfer, renameFriend, removeFriend } from '../exchanges/services'
import { createContactCode, parseContactCode } from '../exchanges/crypto'
import { EmptyState, ErrorNotice, Modal } from '../components/ui'
import { OutboxList } from '../components/OutboxList'
import { ConfirmationButton } from '../components/ConfirmationButton'
import { useTransientFlag } from '../components/useTransientFlag'
import { readTransferFile } from '../exchanges/transferFile'
import { copyText, errorText } from '../components/format'
import { CollectibleCard } from '../components/CollectibleCard'
import { cardById } from '../data/cards'
import type { Card } from '../game/types'

export function ExchangesPage() {
  const fileInput = useRef<HTMLInputElement>(null)
  const [received, setReceived] = useState<Card | null>(null)
  const [transferSource, setTransferSource] = useState('')
  const [readingFile, setReadingFile] = useState(false)
  const [params] = useSearchParams()
  const [editing, setEditing] = useState<string | null>(null), [editName, setEditName] = useState(''), [editError, setEditError] = useState(''), [deleting, setDeleting] = useState(false)
  const [contact, setContact] = useState(''), [label, setLabel] = useState(''), [transfer, setTransfer] = useState('')
  const [identityError, setIdentityError] = useState(''), [contactError, setContactError] = useState(''), [transferError, setTransferError] = useState('')
  const [busy, setBusy] = useState(false), [tab, setTab] = useState(params.get('onglet') === 'envois' ? 'outbox' : 'contacts'), [adding, setAdding] = useState(false)
  const [copied, setCopied] = useTransientFlag(), [copying, setCopying] = useState(false), [pasting, setPasting] = useState(false)
  const identity = useLiveQuery(() => db.identity.get('local'))
  const friends = useLiveQuery(() => db.friends.toArray(), [], [])
  const editingFriend = friends.find(friend => friend.playerUuid === editing)
  useEffect(() => { ensureIdentity().catch(e => setIdentityError(errorText(e))) }, [])
  function openAdd() { setContact(''); setLabel(''); setContactError(''); setCopied(false); setAdding(true) }
  async function copyOwnCode() {
    if (!identity || copying) return
    setCopying(true); setCopied(false); setContactError('')
    try { await copyText(createContactCode(identity)); setCopied(true) }
    catch { setContactError('Copie indisponible. Autorisez l’accès au presse-papiers dans votre navigateur.') }
    finally { setCopying(false) }
  }
  async function pasteContact() {
    if (pasting) return
    setPasting(true); setContact(''); setContactError('')
    try {
      let value: string
      try { value = await navigator.clipboard.readText() }
      catch { throw new Error('Collage indisponible. Autorisez l’accès au presse-papiers dans votre navigateur.') }
      if (!value.trim()) throw new Error('Copiez d’abord le code ami de votre contact.')
      const friend = await parseContactCode(value)
      if (friend.playerUuid === identity?.playerUuid) throw new Error('Ce code est le vôtre. Copiez celui de votre ami.')
      setContact(value.trim())
    } catch (e) { setContactError(errorText(e)) }
    finally { setPasting(false) }
  }
  async function add() {
    if (busy || pasting) return
    if (!label.trim()) { setContactError('Donnez un nom à votre ami.'); return }
    if (!contact) { setContactError('Collez le code ami avant de continuer.'); return }
    setBusy(true); setContactError('')
    try { await addContact(contact, label); setContact(''); setLabel(''); setAdding(false) } catch (e) { setContactError(errorText(e)) } finally { setBusy(false) }
  }
  async function receive() {
    if (busy || readingFile) return
    setBusy(true); setTransferError('')
    try { const card = await receiveTransfer(transfer); setTransfer(''); setTransferSource(''); setReceived(card) } catch (e) { setTransferError(errorText(e)) } finally { setBusy(false) }
  }
  async function saveFriend(remove = false) {
    if (!editingFriend || busy) return
    setBusy(true); setEditError('')
    try {
      if (remove) await removeFriend(editingFriend.playerUuid)
      else await renameFriend(editingFriend.playerUuid, editName)
      setEditing(null); setDeleting(false)
    } catch (e) { setEditError(errorText(e)) } finally { setBusy(false) }
  }
  const tabs = [{ id: 'contacts', label: 'Contacts' }, { id: 'receive', label: 'Recevoir' }, { id: 'outbox', label: 'Envois' }]
  return <>
    
    <ErrorNotice error={identityError} />
    <div className="tab-list" role="tablist" aria-label="Amis et échanges">{tabs.map((item, index) => <button key={item.id} id={`tab-${item.id}`} role="tab" tabIndex={tab === item.id ? 0 : -1} aria-controls={`panel-${item.id}`} aria-selected={tab === item.id} onClick={() => setTab(item.id)} onKeyDown={event => {
      if (['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        event.preventDefault()
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length
        setTab(tabs[next].id); document.getElementById(`tab-${tabs[next].id}`)?.focus()
      }
    }}>{item.label}</button>)}</div>
    <section className="tab-content" id={`panel-${tab}`} role="tabpanel" aria-labelledby={`tab-${tab}`}>
      {tab === 'contacts' && <><div className="contacts-toolbar"><button className="text-button" disabled={!identity} onClick={openAdd}><Plus size={16} /> Ajouter un ami</button></div>{friends.length ? <div className="friend-list">{friends.map(friend => <div className="friend-row" key={friend.playerUuid}><div className="friend-avatar"><UserRound size={21} /></div><div><strong>{friend.label || friend.playerUuid}</strong><span>{friend.label ? friend.playerUuid : friend.fingerprint.slice(0, 12)}</span></div><button className="icon-button" aria-label={`Modifier ${friend.label || friend.playerUuid}`} onClick={() => { setEditing(friend.playerUuid); setEditName(friend.label || ''); setDeleting(false); setEditError('') }}><Pencil size={16} /></button></div>)}</div> : <EmptyState icon={<Users size={25} />} title="Votre cercle commence ici." action={<button className="secondary-button" disabled={!identity} onClick={openAdd}><Plus size={15} /> Ajouter un ami</button>}>Échangez vos codes de contact.</EmptyState>}</>}
      {tab === 'receive' && <form className="receive-form" onSubmit={event => { event.preventDefault(); void receive() }}>
        <div className="receive-actions"><button type="button" className="secondary-button" disabled={busy || readingFile} onClick={async () => {
          setReadingFile(true); setTransfer(''); setTransferSource(''); setTransferError('')
          try { const value = await navigator.clipboard.readText(); if (!value.trim()) throw new Error('Copiez d’abord le code de transfert reçu.'); setTransfer(value.trim()); setTransferSource('Code de transfert prêt') }
          catch { setTransferError('Collage indisponible. Autorisez le presse-papiers ou importez le fichier .btcg.') }
          finally { setReadingFile(false) }
        }}><ClipboardPaste size={16} /> Coller le code</button><button type="button" className="secondary-button" disabled={busy || readingFile} onClick={() => fileInput.current?.click()}><FileUp size={16} /> Importer un fichier</button></div>
        <input ref={fileInput} className="visually-hidden" tabIndex={-1} type="file" accept=".btcg" aria-label="Fichier de transfert .btcg" disabled={busy || readingFile} onChange={async event => {
          const file = event.target.files?.[0]; event.target.value = ''; if (!file) return
          setReadingFile(true); setTransfer(''); setTransferSource(''); setTransferError('')
          try { const code = await readTransferFile(file); setTransfer(code); setTransferSource(file.name) }
          catch (e) { setTransferError(errorText(e)) } finally { setReadingFile(false) }
        }} />
        {transferSource && <p className="receive-ready" role="status"><Check size={16} /><span>{transferSource}</span><button type="button" className="text-button" disabled={busy} onClick={() => { setTransfer(''); setTransferSource(''); setTransferError('') }}>Changer</button></p>}
        {!friends.length && <p className="field-help">Ajoutez d’abord le contact de l’expéditeur.</p>}<ErrorNotice error={transferError} /><button className="primary-button" disabled={busy || readingFile || !transfer.trim() || !identity}><ArrowDownLeft size={16} />{readingFile ? 'Lecture…' : busy ? 'Vérification…' : 'Recevoir'}</button></form>}
      {tab === 'outbox' && <OutboxList friends={friends} />}

    </section>
    {received && <Modal title="Carte reçue" showTitle={false} onClose={() => setReceived(null)}><div className="received-card"><div className="detail-card"><CollectibleCard card={received} definition={cardById.get(received.cardId)!} /></div><p role="status">Vous avez reçu une carte</p></div></Modal>}
    {adding && <Modal title="Ajouter un ami" onClose={() => { if (!busy && !pasting) setAdding(false) }}>
      {identity && <div className="friend-code-row"><div className="friend-code-avatar" aria-hidden="true"><UserRound size={23} /></div><ConfirmationButton icon={Copy} label="Copier mon code ami" confirmation="Code copié !" confirmed={copied} className={`secondary-button friend-copy-button ${copied ? 'is-confirmed' : ''}`} iconSize={17} disabled={copying} action={copyOwnCode} live="polite" /></div>}
      <form className="contact-form" onSubmit={event => { event.preventDefault(); void add() }}>
        <label className="field-label"><input required aria-label="Nom de l’ami" value={label} maxLength={80} autoComplete="off" onChange={event => setLabel(event.target.value)} placeholder="Nom de l’ami" /></label>
        <button type="button" className={`secondary-button friend-paste-button ${contact ? 'is-confirmed' : ''}`} aria-label={pasting ? 'Collage…' : contact ? 'Code ami collé !' : 'Coller son code ami'} disabled={pasting || busy} onClick={pasteContact}><span key={contact ? 'pasted' : 'empty'} className={contact ? 'clipboard-confirm' : ''} aria-hidden="true">{contact ? <Check size={17} /> : <ClipboardPaste size={17} />}</span><span role="status" aria-live="polite">{pasting ? 'Collage…' : contact ? 'Code ami collé !' : 'Coller son code ami'}</span></button>
        <ErrorNotice error={contactError} /><button className="primary-button" disabled={!contact || !label.trim() || busy || pasting || !identity}><Plus size={15} /> Ajouter</button>
      </form>
    </Modal>}
    {editingFriend && <Modal title={deleting ? 'Supprimer cet ami ?' : 'Modifier un ami'} onClose={() => { if (!busy) setEditing(null) }}>{deleting ? <div className="friend-edit-form"><p>Retirer {editingFriend.label || editingFriend.playerUuid} de vos amis ?</p><p className="muted">Vous pourrez l’ajouter à nouveau avec son code ami.</p><ErrorNotice error={editError} /><button className="primary-button danger-button" disabled={busy} onClick={() => saveFriend(true)}>Supprimer cet ami</button><button className="text-button" disabled={busy} onClick={() => setDeleting(false)}>Annuler</button></div> : <form className="friend-edit-form" onSubmit={event => { event.preventDefault(); void saveFriend() }}><label className="field-label">Nom de l’ami<input required value={editName} maxLength={80} onChange={event => setEditName(event.target.value)} /></label><ErrorNotice error={editError} /><button className="primary-button" disabled={busy || !editName.trim()}>Enregistrer</button><button type="button" className="text-button danger-text" disabled={busy} onClick={() => setDeleting(true)}>Supprimer cet ami</button></form>}</Modal>}

  </>
}
