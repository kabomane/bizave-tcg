import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Gem, Layers3, PackageOpen, Recycle, Users, X } from 'lucide-react'
import { Link, Route, Routes, useLocation } from 'react-router-dom'
import { db } from './storage/database'
import { refreshRecharge } from './storage/services'
import { GameContext } from './components/useGame'
import { CardSvgDefinitions } from './components/CollectibleCard'
import { errorText } from './components/format'
import { BoostersPage } from './pages/BoostersPage'
import { CollectionPage } from './pages/CollectionPage'
import { AtelierPage } from './pages/AtelierPage'
import { pruneOutbox } from './exchanges/services'
import { SendCardPage } from './pages/SendCardPage'
import { SettingsPage } from './pages/SettingsPage'
import { ExchangesPage } from './pages/ExchangesPage'
import { ShopPage } from './pages/ShopPage'

export default function App() {
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
  const state = useLiveQuery(async () => {
    const [player, drops, discoveries, openings, boosterStock] = await Promise.all([db.player.get('local'), db.drops.toArray(), db.discoveries.toArray(), db.openings.toArray(), db.boosterStock.toArray()])
    return player ? { player, drops, discoveries, openings, boosterStock } : undefined
  })
  const [now, setNow] = useState(Date.now), [toast, setToast] = useState('')
  useEffect(() => {
    const resume = () => { if (document.visibilityState === 'visible') { setNow(Date.now()); pruneOutbox().catch(e => setToast(errorText(e))); refreshRecharge().catch(e => setToast(errorText(e))) } }
    pruneOutbox().catch(e => setToast(errorText(e)))
    const cleanup = setInterval(() => { pruneOutbox().catch(e => setToast(errorText(e))) }, 60_000)
    const clock = setInterval(() => setNow(Date.now()), 1000)
    const persist = setInterval(() => { refreshRecharge().catch(e => setToast(errorText(e))) }, 60_000)
    document.addEventListener('visibilitychange', resume); window.addEventListener('focus', resume)
    return () => { clearInterval(clock); clearInterval(persist); clearInterval(cleanup); document.removeEventListener('visibilitychange', resume); window.removeEventListener('focus', resume) }
  }, [])
  const nextFreePackAt = state?.player.nextFreePackAt
  useEffect(() => { if (nextFreePackAt && now >= nextFreePackAt) refreshRecharge().catch(e => setToast(errorText(e))) }, [now, nextFreePackAt])
  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(''), 5000); return () => clearTimeout(timer) }, [toast])
  if (!state) return <div className="boot-screen"><span className="brand-glyph">b.</span></div>
  const nav = [
    { to: '/', label: 'Boosters', icon: <PackageOpen size={19} /> },
    { to: '/collection', label: 'Collection', icon: <Layers3 size={19} /> },
    { to: '/atelier', label: 'Atelier', icon: <Recycle size={19} /> },
    { to: '/echanges', label: 'Amis', icon: <Users size={19} /> },
  ]
  const currentSection = (to: string) => pathname === to || (to === '/' && pathname === '/boutique')
  return <GameContext.Provider value={{ ...state, now, notify: setToast }}><CardSvgDefinitions /><div className="app-shell">
    <header className="site-header"><Link to="/parametres" className="brand" aria-label="Bizave TCG, paramètres">bizave<span>TCG</span><i /></Link>
      <nav className="desktop-nav" aria-label="Navigation principale">{nav.map(item => <Link key={item.to} to={item.to} className={currentSection(item.to) ? 'active' : undefined} aria-current={currentSection(item.to) ? 'page' : undefined}>{item.label}</Link>)}</nav>
      <div className="header-actions"><div className="fragment-wallet" aria-label={`${state.player.fragments} fragments`} title="Fragments"><Gem size={16} /><strong>{state.player.fragments}</strong></div></div>
    </header>
    <main className="main-content"><Routes><Route path="/" element={<BoostersPage />} /><Route path="/boutique" element={<ShopPage />} /><Route path="/parametres" element={<SettingsPage />} /><Route path="/collection" element={<CollectionPage />} /><Route path="/atelier" element={<AtelierPage />} /><Route path="/envoyer/:dropId" element={<SendCardPage />} /><Route path="/echanges" element={<ExchangesPage />} /><Route path="*" element={<div className="empty-state"><h1>Page introuvable.</h1><Link to="/" className="primary-button">Retour</Link></div>} /></Routes></main>
    <nav className="mobile-nav" aria-label="Navigation mobile">{nav.map(item => <Link key={item.to} to={item.to} className={currentSection(item.to) ? 'active' : undefined} aria-current={currentSection(item.to) ? 'page' : undefined}>{item.icon}<span>{item.label}</span></Link>)}</nav>
  </div>
    {toast && <div className="toast" role="status"><span>{toast}</span><button className="icon-button" aria-label="Masquer le message" onClick={() => setToast('')}><X size={15} /></button></div>}
  </GameContext.Provider>
}
