import { Check, Copy, Download, Monitor, Moon, Sun } from 'lucide-react'
import { useState } from 'react'
import { DEV_CATALOG_ENABLED } from '../dev/catalogPreview'
import { ErrorNotice } from '../components/ui'
import { errorText } from '../components/format'
import { updateSettings, useSettings } from '../settings/useSettings'
import type { Preferences } from '../settings/preferences'

export function SettingsPage() {
  const settings = useSettings()
  const [error, setError] = useState('')
  function change(patch: Partial<Preferences>) {
    try { updateSettings(patch); setError('') } catch (e) { setError(errorText(e)) }
  }
  return <section className="settings-page" aria-label="Options">
    <div className="page-heading"><h1 className="page-title">Options</h1></div>
    <section className="settings-section" aria-labelledby="theme-heading">
      <h2 id="theme-heading">Apparence</h2>
      <div className="settings-choices theme-choices" role="group" aria-label="Thème">
        {([{ id: 'system', label: 'Système', icon: Monitor }, { id: 'light', label: 'Clair', icon: Sun }, { id: 'dark', label: 'Sombre', icon: Moon }] as const).map(({ id, label, icon: Icon }) => <button type="button" key={id} className="setting-choice" aria-pressed={settings.theme === id} onClick={() => change({ theme: id })}><Icon size={21} /><span>{label}</span><span className="setting-check" aria-hidden="true">{settings.theme === id && <Check size={12} />}</span></button>)}
      </div>
    </section>
    <section className="settings-section" aria-labelledby="transfer-heading">
      <h2 id="transfer-heading">Envoi des cartes</h2>
      <div className="settings-choices transfer-choices" role="group" aria-label="Mode d’envoi">
        {([{ id: 'code', label: 'Copier le code', icon: Copy }, { id: 'file', label: 'Télécharger le fichier', icon: Download }] as const).map(({ id, label, icon: Icon }) => <button type="button" key={id} className="setting-choice" aria-pressed={settings.transferMode === id} onClick={() => change({ transferMode: id })}><Icon size={21} /><span>{label}</span><span className="setting-check" aria-hidden="true">{settings.transferMode === id && <Check size={12} />}</span></button>)}
      </div>
      <p className="settings-note">Votre ami peut recevoir un code ou un fichier .btcg dans Amis.</p>
    </section>
    {DEV_CATALOG_ENABLED && <section className="settings-section settings-dev" aria-labelledby="dev-heading"><div><h2 id="dev-heading">Mode dev</h2><p className="settings-note" id="dev-description">Afficher toutes les cartes dans la collection. Votre sauvegarde reste intacte.</p></div><button type="button" className="setting-switch" role="switch" aria-checked={settings.devCatalog} aria-label="Mode dev" aria-describedby="dev-description" onClick={() => change({ devCatalog: !settings.devCatalog })}><span /></button></section>}
    <ErrorNotice error={error} />
  </section>
}
