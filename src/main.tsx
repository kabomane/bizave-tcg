import './settings/useSettings'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { initializeDatabase } from './storage/services'
import { db } from './storage/database'
import { needsUpdateNotice } from './settings/updateNotice'
import { migrateLegacyDatabase } from './storage/patches/legacyDatabase'
import './styles/index.css'
import './styles/cards-reference.css'
import './styles/application.css'

const root = createRoot(document.getElementById('root')!)
async function boot() {
  await migrateLegacyDatabase()
  const existingPlayer = !!await db.player.get('local') || !!await db.accountState.get('local')
  const updateRequired = needsUpdateNotice(existingPlayer)
  await initializeDatabase()
  root.render(<StrictMode><BrowserRouter><App updateRequired={updateRequired} /></BrowserRouter></StrictMode>)
}
boot().catch(error => root.render(<main className="boot-screen"><h1>Le carnet ne peut pas s’ouvrir.</h1><p>{error instanceof Error ? error.message : 'Le stockage local est indisponible.'}</p><p>Vérifiez que le stockage du navigateur est autorisé. Vos données n’ont pas été effacées.</p><button className="primary-button" onClick={() => location.reload()}>Réessayer</button></main>))
