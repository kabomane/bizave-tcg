import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Download, Trash2 } from 'lucide-react'
import { db } from '../storage/database'
import { deleteAccount, downloadSaveFile } from '../storage/saveTransfer'
import { resetSettings, updateSettings } from '../settings/useSettings'
import { errorText } from './format'
import { ErrorNotice, Modal } from './ui'

export function AccountGate({ children }: { children: ReactNode }) {
  const account = useLiveQuery(async () => await db.accountState.get('local') ?? { id: 'local' as const, status: 'active' as const }, [], null)
  const [error, setError] = useState(''), [deleting, setDeleting] = useState(false), [busy, setBusy] = useState(false)
  useEffect(() => {
    if (!account) return
    if (account.status === 'exported') {
      Promise.resolve().then(resetSettings).catch(() => setError('La partie est transférée, mais les options du navigateur n’ont pas pu être effacées.'))
    } else if ('preferences' in account && account.preferences) {
      // Retain pending preferences until localStorage succeeds; retry safely after refresh.
      db.transaction('rw', db.accountState, async () => {
        const current = await db.accountState.get('local')
        if (current?.status !== 'active' || !current.preferences) return
        updateSettings(current.preferences)
        await db.accountState.put({ id: 'local', status: 'active' })
      }).catch(e => setError(errorText(e)))
    }
  }, [account])
  if (!account || (account.status === 'active' && 'preferences' in account && account.preferences)) return <main className="boot-screen"><span className="brand-glyph">b.</span><ErrorNotice error={error} />{error && <button className="secondary-button" onClick={() => location.reload()}>Réessayer</button>}</main>
  if (account.status === 'active') return children
  return <main className="save-download-page">
    <span className="brand">bizave<span>TCG</span></span>
    <div className="save-download-icon"><Download size={30} /></div>
    <h1 className="page-title">Votre sauvegarde est prête.</h1>
    <p>La partie a été retirée de cet appareil. Téléchargez le fichier .btcg et importez-le sur l’appareil <strong>{account.recipientId}</strong>.</p>
    <button className="primary-button" onClick={() => { try { downloadSaveFile(account.file, account.transferId); setError('') } catch (e) { setError(errorText(e)) } }}><Download size={17} /> Télécharger la sauvegarde</button>
    <p className="settings-note">Le téléchargement reste disponible après fermeture ou actualisation de cette page. Conservez le fichier jusqu’à la réussite de l’import.</p>
    <ErrorNotice error={error} />
    <button className="text-button danger-text" onClick={() => setDeleting(true)}>Supprimer le compte</button>
    {deleting && <Modal title="Supprimer le compte" onClose={() => { if (!busy) setDeleting(false) }}><p>Cette action efface aussi le fichier de transfert conservé sur cet appareil. Sans fichier téléchargé, la sauvegarde sera définitivement perdue.</p><p>Un nouveau joueur avec un nouvel ID sera créé.</p><div className="save-dialog-actions save-split-actions"><button className="secondary-button" disabled={busy} onClick={() => setDeleting(false)}>Annuler</button><button className="primary-button danger-button" disabled={busy} onClick={async () => { setBusy(true); try { await deleteAccount(); location.replace('/parametres') } catch (e) { setError(errorText(e)); setDeleting(false) } finally { setBusy(false) } }}><Trash2 size={16} />{busy ? 'Suppression…' : 'Supprimer définitivement'}</button></div></Modal>}
  </main>
}
