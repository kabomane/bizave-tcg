import { Check, Download, FileUp, Trash2, Palette, Layers3, Send, Gift, Shield, Wrench } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { DEV_CATALOG_ENABLED } from '../dev/catalogPreview'
import { ErrorNotice, Modal } from '../components/ui'
import { errorText } from '../components/format'
import { updateSettings, useSettings } from '../settings/useSettings'
import type { Preferences } from '../settings/preferences'
import { db } from '../storage/database'
import { ensureIdentity } from '../exchanges/services'
import { PLAYER_UUID_PATTERN } from '../exchanges/crypto'
import { deleteAccount, exportSave, importSave, readSaveFile } from '../storage/saveTransfer'
import type { PreparedSave } from '../storage/saveTransfer'
import { GiftCodeForm } from '../components/GiftCodeForm'
import { SettingsGroup } from '../components/SettingsGroup'
import { PileCoverSelect } from '../components/PileCoverSelect'
import { acknowledgeUpdate, resetUpdateNotice, UPDATED_KEY } from '../settings/updateNotice'

export function SettingsPage() {
  const settings = useSettings()
  const [error, setError] = useState('')
  const [updateReset, setUpdateReset] = useState(() => { try { return localStorage.getItem(UPDATED_KEY) === '0' } catch { return false } })
  const identity = useLiveQuery(() => db.identity.get('local'))
  const installation = useLiveQuery(() => db.installation.get('local'))
  const fileInput = useRef<HTMLInputElement>(null)
  const [dialog, setDialog] = useState<'transfer' | 'export' | 'import' | 'delete' | null>(null)
  const [recipient, setRecipient] = useState(''), [confirmation, setConfirmation] = useState(''), [dialogError, setDialogError] = useState(''), [busy, setBusy] = useState(false)
  const [prepared, setPrepared] = useState<PreparedSave | null>(null)
  useEffect(() => { ensureIdentity().catch(e => setError(errorText(e))) }, [])
  function openDialog(value: typeof dialog) { setDialog(value); setDialogError(''); setConfirmation(''); setPrepared(null); setRecipient('') }
  async function execute(action: () => Promise<unknown>) {
    if (busy) return
    setBusy(true); setDialogError('')
    try { await action() } catch (e) { setDialogError(errorText(e)) } finally { setBusy(false) }
  }
  function change(patch: Partial<Preferences>) {
    try { updateSettings(patch); setError('') } catch (e) { setError(errorText(e)) }
  }
  return <section className="settings-page" aria-label="Options">
    <SettingsGroup id="appearance" title="Apparence" description={settings.theme === 'system' ? 'Thème du système' : settings.theme === 'dark' ? 'Thème sombre' : 'Thème clair'} icon={<Palette size={20} />}>
      <div className="settings-preference-row theme-preference-row"><span className="settings-preference-label">Thème</span><div className="settings-segmented" role="group" aria-label="Thème">
        {([{ id: 'system', label: 'Système' }, { id: 'light', label: 'Clair' }, { id: 'dark', label: 'Sombre' }] as const).map(({ id, label }) => <button type="button" key={id} aria-pressed={settings.theme === id} onClick={() => change({ theme: id })}>{label}<span className="settings-inline-check" aria-hidden="true">{settings.theme === id && <Check size={12} />}</span></button>)}
      </div></div>
    </SettingsGroup>
    <SettingsGroup id="collection" title="Collection" description="Piles, aperçu et partage" icon={<Layers3 size={20} />}>
      <div className="settings-preference-row"><label className="settings-preference-label" htmlFor="pile-cover">Carte sur les piles</label><PileCoverSelect value={settings.collectionDisplay.pileCover} onChange={pileCover => change({ collectionDisplay: { ...settings.collectionDisplay, pileCover } })} /></div>
      <div className="settings-preference-block"><div className="settings-preference-row"><span className="settings-preference-label">Barre d’actions</span><div className="settings-segmented" role="group" aria-label="Barre d’actions">{([{ id: 'four', label: '4 actions' }, { id: 'two', label: '2 actions' }] as const).map(({ id, label }) => <button type="button" key={id} aria-pressed={settings.actionBar === id} onClick={() => change({ actionBar: id })}>{label}</button>)}</div></div><p className="settings-note">2 actions : Favori et Partager passent en haut de l’aperçu.</p></div>
      <div className="settings-preference-block"><div className="settings-preference-row"><span className="settings-preference-label">Image de partage</span><div className="settings-segmented" role="group" aria-label="Image de partage">{([{ id: 'story', label: 'Story' }, { id: 'card', label: 'Carte' }] as const).map(({ id, label }) => <button type="button" key={id} aria-pressed={settings.shareFormat === id} onClick={() => change({ shareFormat: id })}>{label}</button>)}</div></div><p className="settings-note">Story : format vertical pour les réseaux. Carte : la carte seule, fond transparent.</p></div>
    </SettingsGroup>
    <SettingsGroup id="gifts" title="Code cadeau" description="Recevoir un cadeau" icon={<Gift size={20} />}><GiftCodeForm /></SettingsGroup>
    <SettingsGroup id="giving" title="Don des cartes" description={settings.transferMode === 'file' ? 'Envoi par fichier' : 'Envoi par code'} icon={<Send size={20} />}>
      <div className="settings-preference-row"><span className="settings-preference-label">Format du don</span><div className="settings-segmented" role="group" aria-label="Mode du don">{([{ id: 'code', label: 'Code' }, { id: 'file', label: 'Fichier' }] as const).map(({ id, label }) => <button type="button" key={id} aria-pressed={settings.transferMode === id} onClick={() => change({ transferMode: id })}>{label}<span className="settings-inline-check" aria-hidden="true">{settings.transferMode === id && <Check size={12} />}</span></button>)}</div></div><p className="settings-note">Votre ami peut recevoir un code ou un fichier .btcg dans Amis.</p>
    </SettingsGroup>
    <SettingsGroup id="account" title="Compte et sauvegarde" description="Transférer votre partie, gérer votre compte" icon={<Shield size={20} />}>
      <div className="settings-account-actions"><button className="text-button" disabled={!identity || !installation} onClick={() => openDialog('transfer')}><Download size={16} />Transfert de sauvegarde</button><button className="text-button settings-delete" onClick={() => openDialog('delete')}><Trash2 size={16} />Supprimer le compte</button></div>
    </SettingsGroup>
    {DEV_CATALOG_ENABLED && <SettingsGroup id="development" title="Développement" description="Catalogue et page de mise à jour" icon={<Wrench size={20} />}>
      <div className="settings-dev"><div><h3>Mode dev</h3><p className="settings-note" id="dev-description">Afficher toutes les cartes dans la collection. Votre sauvegarde reste intacte.</p></div><button type="button" className="setting-switch" role="switch" aria-checked={settings.devCatalog} aria-label="Mode dev" aria-describedby="dev-description" onClick={() => change({ devCatalog: !settings.devCatalog })}><span /></button></div>
      <div className="settings-dev"><div><h3>Page de mise à jour</h3><p className="settings-note" id="update-test-description">Afficher la page de mise à jour au prochain rechargement.</p></div><button type="button" className="setting-switch" role="switch" aria-checked={updateReset} aria-label="Page de mise à jour" aria-describedby="update-test-description" onClick={() => { try { if (updateReset) acknowledgeUpdate(); else resetUpdateNotice(); setUpdateReset(value => !value); setError('') } catch { setError('Impossible de modifier cette option.') } }}><span /></button></div>
    </SettingsGroup>}
    <ErrorNotice error={error} />
    <input ref={fileInput} className="visually-hidden" type="file" accept=".btcg" aria-label="Fichier de sauvegarde .btcg" tabIndex={-1} disabled={busy} onChange={event => {
      const file = event.target.files?.[0]; event.target.value = ''; if (!file) return
      void execute(async () => {
        const save = await readSaveFile(file)
        if (save.payload.recipientId !== installation?.installationId) throw new Error('Cette sauvegarde est destinée à un autre appareil.')
        setPrepared(save); setConfirmation(''); setDialog('import')
      })
    }} />
    {dialog && <Modal title={dialog === 'delete' ? 'Supprimer le compte' : dialog === 'export' ? 'Exporter la sauvegarde' : dialog === 'import' ? 'Importer la sauvegarde' : 'Transfert de sauvegarde'} onClose={() => { if (!busy) setDialog(null) }}>
      {dialog === 'transfer' && <><p>Votre ID joueur, vos amis et vos échanges suivent votre partie.</p><div className="settings-account-id"><span>ID de cet appareil</span><strong data-testid="installation-id">{installation?.installationId}</strong></div><p className="settings-note">Sur l’appareil destinataire, ouvrez ce même menu et relevez l’ID. Saisissez-le ensuite lors de l’export pour exporter le fichier .btcg.</p><div className="save-dialog-actions save-transfer-actions"><button className="secondary-button" disabled={busy} onClick={() => openDialog('export')}><Download size={16} /> Exporter</button><button className="secondary-button" disabled={busy} onClick={() => fileInput.current?.click()}><FileUp size={16} />{busy ? 'Vérification…' : 'Importer'}</button></div></>}
      {dialog === 'export' && <form onSubmit={event => { event.preventDefault(); if (confirmation.toUpperCase() === 'TRANSFERER') void execute(() => exportSave(recipient.trim(), settings)) }}>
        <label className="save-field">ID de l’appareil destinataire<input value={recipient} placeholder="1234-56-78" inputMode="numeric" autoComplete="off" maxLength={10} disabled={busy} onChange={event => setRecipient(event.target.value)} required /></label>
        <p>Après préparation du fichier, votre collection, votre progression et votre identité seront supprimées de cet appareil. Seule la page de téléchargement restera accessible.</p>
        <p>Votre ID joueur et votre identité seront conservés sur le destinataire. Vos amis pourront continuer à vous envoyer des cartes.</p><p className="settings-note">Ce fichier contient votre identité privée. Gardez-le pour vous : une personne qui en possède une copie peut signer en votre nom.</p>
        <label className="save-field">Pour confirmer, saisissez TRANSFERER<input value={confirmation} autoComplete="off" disabled={busy} onChange={event => setConfirmation(event.target.value)} /></label>
        <div className="save-dialog-actions save-split-actions"><button className="secondary-button" type="button" disabled={busy} onClick={() => openDialog('transfer')}>Retour</button><button className="primary-button danger-button" disabled={busy || confirmation.toUpperCase() !== 'TRANSFERER' || !PLAYER_UUID_PATTERN.test(recipient.trim()) || recipient.trim() === installation?.installationId} type="submit">{busy ? 'Préparation…' : 'Transférer et effacer cet appareil'}</button></div>
      </form>}
      {dialog === 'import' && prepared && <><p>Importer la partie de <strong>{prepared.payload.sourceId}</strong> sur cet appareil <strong>{installation?.installationId}</strong> ?</p><p>La collection et la progression présentes ici seront remplacées. Votre ID joueur deviendra celui de la sauvegarde, avec ses amis et sa clé de signature.</p><p className="settings-note">Les amis de cette sauvegarde n’ont aucune manipulation à faire. Les cartes qui lui sont déjà destinées restent recevables.</p><label className="save-field">Pour confirmer le remplacement, saisissez IMPORTER<input value={confirmation} autoComplete="off" disabled={busy} onChange={event => setConfirmation(event.target.value)} /></label><div className="save-dialog-actions save-split-actions"><button className="secondary-button" disabled={busy} onClick={() => openDialog('transfer')}>Annuler</button><button className="primary-button" disabled={busy || confirmation.toUpperCase() !== 'IMPORTER'} onClick={() => void execute(async () => { await importSave(prepared.contents); location.replace('/parametres') })}>{busy ? 'Import…' : 'Importer et remplacer la partie'}</button></div></>}
      {dialog === 'delete' && <><p>Cette action supprime définitivement toutes votre progression.</p><p>Vous repartirez comme un nouveau joueur, Aucune restauration ne sera proposée.</p><label className="save-field">Pour confirmer, saisissez SUPPRIMER<input value={confirmation} autoComplete="off" disabled={busy} onChange={event => setConfirmation(event.target.value)} /></label><div className="save-dialog-actions save-split-actions"><button className="secondary-button" disabled={busy} onClick={() => setDialog(null)}>Annuler</button><button className="primary-button danger-button" disabled={busy || confirmation.toUpperCase() !== 'SUPPRIMER'} onClick={() => void execute(async () => { await deleteAccount(); location.replace('/parametres') })}><Trash2 size={16} />{busy ? 'Suppression…' : 'Supprimer'}</button></div></>}
      <ErrorNotice error={dialogError} />
    </Modal>}
  </section>
}
