import './settings/useSettings'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { BetaClosedPage } from './pages/BetaClosedPage'
import { initializeDatabase } from './storage/services'
import { db } from './storage/database'
import { needsUpdateNotice } from './settings/updateNotice'
import './styles/index.css'
import './styles/cards-reference.css'
import './styles/application.css'
import './styles/card-typography.css'
import './styles/card-viewer.css'
import './styles/settings.css'

const root = createRoot(document.getElementById('root')!)
async function boot() {
  const existingPlayer = !!await db.player.get('local') || !!await db.accountState.get('local')
  const updateRequired = needsUpdateNotice(existingPlayer)
  await initializeDatabase()
  root.render(<StrictMode><BrowserRouter><App updateRequired={updateRequired} /></BrowserRouter></StrictMode>)
}
if (import.meta.env.VITE_BETA_CLOSED === 'true') {
  root.render(<StrictMode><BetaClosedPage /></StrictMode>)
} else {
  boot().catch(error => root.render(<main className="boot-screen"><h1>Le carnet ne peut pas s’ouvrir.</h1><p>{error instanceof Error ? error.message : 'Le stockage local est indisponible.'}</p><p>Vérifiez que le stockage du navigateur est autorisé. Vos données n’ont pas été effacées.</p><button className="primary-button" onClick={() => location.reload()}>Réessayer</button></main>))
}
