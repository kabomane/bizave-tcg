import { useState } from 'react'
import { UPDATE_NOTE } from '../data/update'
import { acknowledgeUpdate } from '../settings/updateNotice'
import { ErrorNotice } from '../components/ui'

export function UpdatePage({ onContinue }: { onContinue: () => void }) {
  const [error, setError] = useState('')
  function proceed() {
    try { acknowledgeUpdate(); onContinue() }
    catch { setError('Impossible de mémoriser cette mise à jour. Autorisez le stockage du navigateur puis réessayez.') }
  }
  return <main className="update-page">
    <h1 className="update-heading" aria-label="Bizave TCG a été mis à jour"><span className="brand update-brand" aria-hidden="true">bizave<span>TCG</span><i /></span><span>a été mis à jour</span></h1>
    <div className="update-content"><p className="update-note">{UPDATE_NOTE}</p></div>
    <div className="update-actions"><ErrorNotice error={error} /><button type="button" className="primary-button" onClick={proceed}>Continuer</button></div>
  </main>
}
