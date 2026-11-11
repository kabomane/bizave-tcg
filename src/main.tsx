import './settings/useSettings'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { BetaClosedPage } from './pages/BetaClosedPage'
import { initializeDatabase } from './storage/services'
import { db } from './storage/database'
import { readBetaSave } from './storage/betaSave'
import { deleteAccount } from './storage/saveTransfer'
import { acknowledgeUpdate, needsUpdateNotice } from './settings/updateNotice'
import './styles/index.css'
import './styles/cards-reference.css'
import './styles/application.css'
import './styles/card-typography.css'
import './styles/card-viewer.css'
import './styles/settings.css'

const root = createRoot(document.getElementById('root')!)

function renderGame(updateRequired: boolean) {
  root.render(<StrictMode><BrowserRouter><App updateRequired={updateRequired} /></BrowserRouter></StrictMode>)
}

async function enterRelease() {
  const response = await fetch('/release-cache-reset.json', { cache: 'no-store', signal: AbortSignal.timeout(8000) })
  if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error('Le cache n’a pas pu être actualisé. Réessayez.')
  if ('caches' in globalThis) await Promise.all((await caches.keys()).map(name => caches.delete(name)))
  await deleteAccount(db, { onlyBeta: true })
  try { acknowledgeUpdate() } catch { /* The save remains usable without localStorage. */ }
  history.replaceState(null, '', '/')
  renderGame(false)
}

async function boot() {
  if (await readBetaSave()) {
    root.render(<StrictMode><BetaClosedPage onEnter={enterRelease} /></StrictMode>)
    return
  }
  const existingPlayer = !!await db.player.get('local') || !!await db.accountState.get('local')
  const updateRequired = needsUpdateNotice(existingPlayer)
  await initializeDatabase()
  renderGame(updateRequired)
}

boot().catch(error => root.render(<main className="boot-screen"><h1>Le carnet ne peut pas s’ouvrir.</h1><p>{error instanceof Error ? error.message : 'Le stockage local est indisponible.'}</p><p>Vérifiez que le stockage du navigateur est autorisé. Vos données n’ont pas été effacées.</p><button className="primary-button" onClick={() => location.reload()}>Réessayer</button></main>))
