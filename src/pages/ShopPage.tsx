import { useEffect, useRef, useState } from 'react'
import { Check, Clock3 } from 'lucide-react'
import { useGame } from '../components/useGame'
import { useClockValue, useNow } from '../components/useNow'
import { BoosterPack } from '../components/BoosterPack'
import { BoosterSectionHeading } from '../components/BoosterSectionHeading'
import { ShopCarousel } from '../components/ShopCarousel'
import { ShopBuyButton } from '../components/ShopBuyButton'
import { CollectibleCard } from '../components/CollectibleCard'
import { ErrorNotice } from '../components/ui'
import { errorText, formatShopCountdown } from '../components/format'
import { cardById } from '../data/cards'
import { SALES_CLOSE_MS, weeklyRerollCount, type WeeklyOffer } from '../game/weeklyShop'
import { dailyDefinition } from '../game/dailyShop'
import { buyDailyBundle, buyDailyCard, refreshDailyShop } from '../storage/dailyShop'
import { buyWeeklyOffer, refreshWeeklyShop } from '../storage/weeklyShop'
import { PermanentBoosterShop } from '../components/PermanentBoosterShop'
import { WeeklyBonusShop } from '../components/WeeklyBonusShop'
import { ShopRatesDialog } from '../components/ShopRatesDialog'
import { useSettings } from '../settings/useSettings'
import { fragmentPurchaseCost } from '../settings/development'
import '../styles/weekly-shop.css'

const format = (n: number) => new Intl.NumberFormat('fr-FR').format(n)
function ShopClock({ at, minimum }: { at: number; minimum: number }) {
  const text = formatShopCountdown(at - Math.max(useNow(), minimum))
  return <span className="weekly-timer" role="timer" aria-label={`Renouvellement dans ${text}`}><Clock3 size={14} />{text}</span>
}
function CardOffers({ offers, title, balance, expired, onBuy }: { offers: WeeklyOffer[]; title: string; balance: number; expired: boolean; onBuy: (id: string) => Promise<void> }) {
  const settings = useSettings()
  const [selectedId, setSelectedId] = useState(offers[0]?.id ?? '')
  const [moving, setMoving] = useState(false), [busy, setBusy] = useState(false), [error, setError] = useState('')
  const lock = useRef(false), movingRef = useRef(false)
  const selected = offers.find(o => o.id === selectedId) ?? offers[0]
  if (!selected) return null
  const choices = offers.map(o => ({ ...o, title: cardById.get(o.cardId)!.title }))
  async function buy() {
    if (lock.current || movingRef.current || !selected) return
    lock.current = true; setBusy(true); setError('')
    try { await onBuy(selected.id) } catch (e) { setError(errorText(e)) } finally { lock.current = false; setBusy(false) }
  }
  return <section className="card-zone" aria-label={title}>
    <div className="section-line"><h3>{title} · {offers.length} offre{offers.length > 1 ? 's' : ''} · <span>{selected.sold ? 'épuisée' : '1 exemplaire'}</span></h3></div>
    <div className="shop-stage">
      <ShopCarousel choices={choices} selectedId={selected.id} onSelect={setSelectedId} onMovingChange={v => { movingRef.current = v; setMoving(v) }} disabled={busy} labels={{ region: `Choisir une carte · ${title}`, selection: title, previous: 'Offre précédente', next: 'Offre suivante' }} renderChoice={o => <div className={`showcase-card booster-size${o.sold ? ' is-sold' : ''}`}><CollectibleCard card={{ ...o, dropId: `preview-${o.id}` }} definition={cardById.get(o.cardId)!} presentation="thumbnail" interactive={false} /></div>} />
      <ShopBuyButton label={expired ? 'Renouvellement…' : selected.sold ? 'Achetée' : 'Acheter'} price={selected.sold ? undefined : selected.price} accessibleLabel={selected.sold ? `${cardById.get(selected.cardId)!.title} achetée` : `Acheter ${cardById.get(selected.cardId)!.title} pour ${selected.price} fragments`} disabled={expired || selected.sold || balance < fragmentPurchaseCost(selected.price, settings)} busy={busy} moving={moving} onClick={() => void buy()} />
      <ErrorNotice error={error} />
    </div>
  </section>
}
export function ShopPage() {
  const { dailyShop: daily, weeklyShop: weekly, player } = useGame()
  const settings = useSettings()
  const [error, setError] = useState(''), [busy, setBusy] = useState<string | null>(null), [showRates, setShowRates] = useState(false)
  const lock = useRef(false)
  const dailyExpired = useClockValue(now => !!daily && Math.max(now, player.maxObservedClockAt) >= daily.renewAt)
  const weeklyExpired = useClockValue(now => !!weekly && Math.max(now, player.maxObservedClockAt) >= weekly.rerollAt)
  const dailyClosed = useClockValue(now => !!daily && Math.max(now, player.maxObservedClockAt) >= daily.renewAt - SALES_CLOSE_MS)
  const weeklyClosed = useClockValue(now => !!weekly && Math.max(now, player.maxObservedClockAt) >= weekly.rerollAt - SALES_CLOSE_MS)
  useEffect(() => { if (!daily || dailyExpired) void refreshDailyShop().catch(e => setError(errorText(e))) }, [daily, dailyExpired])
  useEffect(() => { if (!weekly || weeklyExpired) void refreshWeeklyShop().catch(e => setError(errorText(e))) }, [weekly, weeklyExpired])
  async function buy(kind: 'daily' | 'weekly') {
    if (lock.current || !daily || !weekly) return
    lock.current = true; setBusy(kind); setError('')
    try {
      if (kind === 'daily') await buyDailyBundle(daily.dayStart, undefined, undefined, daily.rerollCount ?? 0)
      else await buyWeeklyOffer(weekly.weekStart, 'booster', undefined, undefined, weeklyRerollCount(weekly))
    } catch (e) { setError(errorText(e)); await Promise.all([refreshDailyShop(), refreshWeeklyShop()]).catch(() => {}) }
    finally { lock.current = false; setBusy(null) }
  }
  const bundle = daily?.bundle, definition = bundle && dailyDefinition(bundle.boosterId)
  return <section className="weekly-shop-page redesigned-shop">
    <BoosterSectionHeading title="Boutique" linkTo="/" linkLabel="Vos boosters" back onShowRates={() => setShowRates(true)} />
    <nav className="shop-tabs" aria-label="Rubriques de la boutique">{[['daily', "Aujourd’hui"], ['weekly', 'Cette semaine'], ['permanent', 'Permanents']].map(([id, title]) => <a key={id} href={`#${id}`}>{title}</a>)}</nav>
    <ErrorNotice error={error} />
    <section className="shop-section daily-section" id="daily" aria-labelledby="daily-title">
      <div className="shop-section-head"><h2 id="daily-title">Aujourd’hui</h2>{daily && <ShopClock at={daily.renewAt} minimum={player.maxObservedClockAt} />}</div>
      {daily && bundle && definition ? <div className={`daily-grid${daily.cards.length ? '' : ' has-no-cards'}`}>
        <section className="featured-offer" aria-label="Le lot du jour">
          <div className="section-line"><h3>Le lot du jour</h3></div>
          <div className="offer-card hero-offer">
            <div className="hero-visual"><div className="shop-pack"><BoosterPack booster={definition} flat /></div></div>
            <div className="hero-meta"><h3>{bundle.category === 'classic' ? 'Édition classique' : bundle.category === 'special' ? 'Édition spéciale' : 'Édition événement'}</h3>
              <p>Un lot de {bundle.quantity} boosters {definition.title}, disponible aujourd’hui à −{bundle.discountPercent} %.</p>
              <div className="price-block"><strong>{format(bundle.price)}</strong><span>fragments</span><del>{format(bundle.normalPrice)}</del></div>
              <button className="primary-button" disabled={busy !== null || dailyClosed || dailyExpired || bundle.purchased || player.fragments < fragmentPurchaseCost(bundle.price, settings)} onClick={() => void buy('daily')}>{bundle.purchased ? <><Check size={14} /> Lot acheté</> : <>{dailyClosed ? 'Ventes fermées' : busy === 'daily' ? 'Achat…' : 'Acheter le lot'}</>}</button>
            </div>
          </div>
        </section>
        {daily.cards.length > 0 && <CardOffers key={`${daily.dayStart}-${daily.rerollCount ?? 0}`} offers={daily.cards} title="Cartes du jour" balance={player.fragments} expired={dailyExpired} onBuy={id => buyDailyCard(daily.dayStart, id, undefined, undefined, daily.rerollCount ?? 0)} />}
      </div> : <p className="shop-description">Préparation des offres du jour…</p>}
    </section>
    <section className="shop-section weekly-section" id="weekly" aria-labelledby="weekly-title">
      <div className="shop-section-head"><h2 id="weekly-title">Cette semaine</h2>{weekly && <ShopClock at={weekly.rerollAt} minimum={player.maxObservedClockAt} />}</div>
      {weekly && <>
        <div className="weekly-layout">
          <section className="weekly-lucky" aria-label="Lucky Boost">
            <div className="section-line"><h3>Lucky Boost · {weekly.booster.remaining} restant{weekly.booster.remaining > 1 ? 's' : ''}</h3></div>
            <div className="offer-card lucky-preview"><div className="shop-pack"><BoosterPack booster={weekly.booster.definition} flat /></div><div className="lucky-details"><h3>Tirage personnalisé</h3><p>Un booster aux probabilités et au pool uniques, renouvelé chaque lundi.</p><div className="price-block"><strong>{format(weekly.booster.price)}</strong><span>fragments</span></div><button className="primary-button" disabled={busy !== null || weeklyClosed || weekly.booster.remaining < 1 || player.fragments < fragmentPurchaseCost(weekly.booster.price, settings)} onClick={() => void buy('weekly')}>{weekly.booster.remaining < 1 ? 'Épuisé' : weeklyClosed ? 'Ventes fermées' : busy === 'weekly' ? 'Achat…' : <>Acheter</>}</button></div></div>
          </section>
          <CardOffers key={`${weekly.weekStart}-${weeklyRerollCount(weekly)}`} offers={weekly.offers} title="Vitrine de la semaine" balance={player.fragments} expired={weeklyExpired} onBuy={id => buyWeeklyOffer(weekly.weekStart, id, undefined, undefined, weeklyRerollCount(weekly))} />
        </div>
        <WeeklyBonusShop key={weekly.weekStart} shop={weekly} balance={player.fragments} credits={player.weeklyBonusCredits} expired={weeklyExpired} onRerolled={() => {}} />
      </>}
    </section>
    <section className="shop-section" id="permanent" aria-labelledby="permanent-title"><div className="shop-section-head"><h2 id="permanent-title">Permanents</h2><span className="section-note">Toujours disponibles</span></div><PermanentBoosterShop /></section>
    {showRates && <ShopRatesDialog onClose={() => setShowRates(false)} />}
  </section>
}
