import { useEffect, useRef, useState } from 'react'
import { boosters } from '../data/boosters'
import { christmasBooster, isChristmasEventActive } from '../data/christmas'
import { activeEventBoosters } from '../data/events'
import { shopBoosters, shopOffer } from '../game/boosterAvailability'
import { buyBooster } from '../storage/services'
import { fragmentPurchaseCost } from '../settings/development'
import { useSettings } from '../settings/useSettings'
import { useGame } from './useGame'
import { BoosterPack } from './BoosterPack'
import { ShopBuyButton } from './ShopBuyButton'
import { ErrorNotice } from './ui'
import { errorText } from './format'

export function PermanentBoosterShop() {
  const { player } = useGame(), settings = useSettings()
  const [purchased, setPurchased] = useState<string | null>(null), [busy, setBusy] = useState<string | null>(null), [error, setError] = useState('')
  const lock = useRef(false)
  useEffect(() => { if (purchased) { const timer = setTimeout(() => setPurchased(null), 1600); return () => clearTimeout(timer) } }, [purchased])
  async function buy(id: string) {
    if (lock.current || purchased === id) return
    lock.current = true; setBusy(id); setError('')
    try { await buyBooster(id); setPurchased(id) } catch (e) { setError(errorText(e)) } finally { lock.current = false; setBusy(null) }
  }
  const groups = [{ title: 'Boosters permanents', offers: shopBoosters(boosters) }, ...(isChristmasEventActive(settings) ? [{ title: 'Événement de Noël', offers: [christmasBooster] }] : []), ...activeEventBoosters(settings).map(booster => ({ title: `Événement ${booster.title}`, offers: [booster] }))]
  return <div className="permanent-shop">{groups.map(group => <section key={group.title} aria-label={group.title}>
    {group.title !== 'Boosters permanents' && <div className="section-line"><h3>{group.title}</h3></div>}
    <div className="permanent-grid">{group.offers.map(booster => {
      const price = shopOffer(booster)!.price
      return <article className="permanent-tile" key={booster.id} aria-label={booster.title}><div className="shop-pack"><BoosterPack booster={booster} flat /></div><ShopBuyButton price={price} disabled={busy !== null || player.fragments < fragmentPurchaseCost(price, settings)} busy={busy === booster.id} purchased={purchased === booster.id} accessibleLabel={purchased === booster.id ? `${booster.title} ajouté` : `Acheter ${booster.title} pour ${price} fragments`} onClick={() => void buy(booster.id)} /></article>
    })}</div>
  </section>)}<span className="visually-hidden" role="status">{purchased ? 'Booster ajouté à votre réserve.' : ''}</span><ErrorNotice error={error} /></div>
}
