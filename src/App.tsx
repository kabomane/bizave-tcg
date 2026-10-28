import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Gem, Layers3, PackageOpen, Recycle, Users, X } from 'lucide-react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { readGameState } from './storage/gameState'
import { refreshRecharge } from './storage/services'
import { GameContext } from './components/useGame'
import { CardSvgDefinitions } from './components/CollectibleCard'
import { errorText } from './components/format'
import { BoostersPage } from './pages/BoostersPage'
import { CollectionPage } from './pages/CollectionPage'
import { AtelierPage } from './pages/AtelierPage'
import { pruneOutbox } from './exchanges/outbox'
import { AccountGate } from './components/AccountGate'
const SendCardPage = lazy(() => import('./pages/SendCardPage').then(m => ({ default: m.SendCardPage })))
const SettingsPage = lazy(() => import('./pages/SettingsPage').then(m => ({ default: m.SettingsPage })))
const ExchangesPage = lazy(() => import('./pages/ExchangesPage').then(m => ({ default: m.ExchangesPage })))
const ShopPage = lazy(() => import('./pages/ShopPage').then(m => ({ default: m.ShopPage })))
const ChangelogPage = lazy(() => import('./pages/ChangelogPage').then(m => ({ default: m.ChangelogPage })))

export default function App() {
  return <AccountGate><ActiveApp /></AccountGate>
}

function ActiveApp() {
  useEffect(() => {
    const root = document.documentElement
    const pointer = () => { root.dataset.inputMode = 'pointer' }
    const keyboard = (event: KeyboardEvent) => { if (['Tab', 'Enter', ' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) root.dataset.inputMode = 'keyboard' }
    pointer()
    document.addEventListener('pointerdown', pointer, true)
    document.addEventListener('keydown', keyboard, true)
    return () => { document.removeEventListener('pointerdown', pointer, true); document.removeEventListener('keydown', keyboard, true) }
  }, [])
  const { pathname } = useLocation()
  useEffect(() => { window.scrollTo(0, 0) }, [pathname])
  const state = useLiveQuery(() => readGameState())
  const [toast, setToast] = useState('')
  const context = useMemo(() => state && { ...state, notify: setToast }, [state])
  useEffect(() => {
    const resume = () => { if (document.visibilityState === 'visible') { pruneOutbox().catch(e => setToast(errorText(e))); refreshRecharge().catch(e => setToast(errorText(e))) } }
    pruneOutbox().catch(e => setToast(errorText(e)))
    const cleanup = setInterval(() => { pruneOutbox().catch(e => setToast(errorText(e))) }, 60_000)
    const persist = setInterval(() => { refreshRecharge().catch(e => setToast(errorText(e))) }, 60_000)
    document.addEventListener('visibilitychange', resume); window.addEventListener('focus', resume)
    return () => { clearInterval(persist); clearInterval(cleanup); document.removeEventListener('visibilitychange', resume); window.removeEventListener('focus', resume) }
  }, [])
  const nextFreePackAt = state?.player.nextFreePackAt
  useEffect(() => {
    if (nextFreePackAt === null || nextFreePackAt === undefined) return
    // Allow for a small clock correction before settling the recharge deadline.
    const timer = setTimeout(() => { refreshRecharge().catch(e => setToast(errorText(e))) }, Math.max(0, Math.min(2_147_483_647, nextFreePackAt - Date.now() + 250)))
    return () => clearTimeout(timer)
  }, [nextFreePackAt])
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 5000); return () => clearTimeout(timer) }, [toast])
  if (!state || !context) return <div className="boot-screen"><span className="brand-glyph">b.</span></div>
  const nav = [
    { to: '/', label: 'Boosters', icon: <PackageOpen size={19} /> },
    { to: '/collection', label: 'Collection', icon: <Layers3 size={19} /> },
    { to: '/atelier', label: 'Atelier', icon: <Recycle size={19} /> },
    { to: '/echanges', label: 'Amis', icon: <Users size={19} /> },
  ]
  const currentSection = (to: string) => pathname === to || (to === '/' && pathname === '/boutique')
  return <GameContext.Provider value={context}><CardSvgDefinitions /><div className="app-shell">
    <header className="site-header"><Link to="/parametres" className="brand" aria-label="Bizave TCG, paramètres">bizave<span>TCG</span><i /></Link>
      <nav className="desktop-nav" aria-label="Navigation principale">{nav.map(item => <Link key={item.to} to={item.to} className={currentSection(item.to) ? 'active' : undefined} aria-current={currentSection(item.to) ? 'page' : undefined}>{item.label}</Link>)}</nav>
      <div className="header-actions"><div className="fragment-wallet" aria-label={`${state.player.fragments} fragments`} title="Fragments"><Gem size={16} /><strong>{state.player.fragments}</strong></div></div>
    </header>
    <main className="main-content"><Suspense fallback={null}><Routes><Route path="/" element={<BoostersPage />} /><Route path="/boutique" element={<ShopPage />} /><Route path="/parametres" element={<SettingsPage />} /><Route path="/changelog" element={<ChangelogPage />} /><Route path="/collection" element={<CollectionPage />} /><Route path="/atelier" element={<AtelierPage />} /><Route path="/envoyer/:dropId" element={<SendCardPage />} /><Route path="/echanges" element={<ExchangesPage />} /><Route path="*" element={<div className="empty-state"><h1>Page introuvable.</h1><Link to="/" className="primary-button">Retour</Link></div>} /></Routes></Suspense></main>
    <nav className="mobile-nav" aria-label="Navigation mobile">{nav.map(item => <Link key={item.to} to={item.to} className={currentSection(item.to) ? 'active' : undefined} aria-current={currentSection(item.to) ? 'page' : undefined}>{item.icon}<span>{item.label}</span></Link>)}</nav>
  </div>
    {toast && <div className="toast" role="status"><span>{toast}</span><button className="icon-button" aria-label="Masquer le message" onClick={() => setToast('')}><X size={15} /></button></div>}
  </GameContext.Provider>
}
