import './settings/useSettings'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { initializeDatabase } from './storage/services'
import './styles/index.css'
import './styles/cards-reference.css'
import './styles/application.css'

const root = createRoot(document.getElementById('root')!)
initializeDatabase().then(() => root.render(<StrictMode><BrowserRouter><App /></BrowserRouter></StrictMode>)).catch(error => root.render(<main className="boot-screen"><h1>Le carnet ne peut pas s’ouvrir.</h1><p>{error instanceof Error ? error.message : 'Le stockage local est indisponible.'}</p><p>Vérifiez que le stockage du navigateur est autorisé. Vos données n’ont pas été effacées.</p><button className="primary-button" onClick={() => location.reload()}>Réessayer</button></main>))
