import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Clock3, Info } from 'lucide-react'
import { useGame } from '../components/useGame'
import { useClockValue, useNow } from '../components/useNow'
import { BoosterPack } from '../components/BoosterPack'
import { BoosterSectionHeading } from '../components/BoosterSectionHeading'
import { ShopCarousel } from '../components/ShopCarousel'
import { ShopBuyButton } from '../components/ShopBuyButton'
import { CollectibleCard } from '../components/CollectibleCard'
import { ErrorNotice, Modal } from '../components/ui'
import { DropRates, DropRateTable } from '../components/DropRates'
import { errorText, formatShopCountdown } from '../components/format'
import { cardById } from '../data/cards'
import { christmasBooster, isChristmasEventActive } from '../data/christmas'
import type { BoosterDefinition } from '../game/types'
import { SALES_CLOSE_MS, WEEKLY_SHOWCASE_RATES, weeklyRerollCount, type WeeklyOffer } from '../game/weeklyShop'
import { buyWeeklyOffer, refreshWeeklyShop } from '../storage/weeklyShop'
import { buyBooster } from '../storage/services'
import { PermanentBoosterShop } from '../components/PermanentBoosterShop'
import { WeeklyBonusShop } from '../components/WeeklyBonusShop'
import { useSettings } from '../settings/useSettings'
import { fragmentPurchaseCost } from '../settings/development'
import '../styles/weekly-shop.css'

type WeeklyChoice = { id: string; title: string } & ({ kind: 'booster' | 'christmas'; booster: BoosterDefinition } | { kind: 'card'; offer: WeeklyOffer })
const labels = { region: 'Choisir une offre de la semaine', selection: 'Sélection des offres de la semaine', previous: 'Offre précédente', next: 'Offre suivante' }

function WeeklyShopClock({ at, minimumTime }: { at: number; minimumTime: number }) {
  const remaining = at - Math.max(useNow(), minimumTime)
  const countdown = formatShopCountdown(remaining)
  return <div className="weekly-header-tools"><span className="weekly-timer" role="timer" aria-label={`Renouvellement dans ${countdown}`} title={remaining < 86400_000 ? 'Heures : minutes : secondes' : 'Jours : heures : minutes'}><Clock3 size={14} /><span>{countdown}</span></span></div>
}

export function ShopPage() {
  const { weeklyShop: shop, player } = useGame()
  const settings = useSettings()
  const christmasActive = isChristmasEventActive(settings)
  const sales = useClockValue(now => {
    if (!shop) return 'unavailable'
    const remaining = shop.rerollAt - Math.max(now, player.maxObservedClockAt)
    if (remaining <= 0) return 'expired'
    return remaining <= SALES_CLOSE_MS ? 'closed' : 'open'
  })
  const [error, setError] = useState(''), [busy, setBusy] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState('booster'), [moving, setMoving] = useState(false)
  const [showRates, setShowRates] = useState(false)
  const movingRef = useRef(false)
  const changeMoving = useCallback((value: boolean) => { movingRef.current = value; setMoving(value) }, [])
  const [purchasedOffer, setPurchasedOffer] = useState<{ weekStart: number; rerollCount: number; id: string } | null>(null)
  const inFlight = useRef(false)
  const expired = sales === 'expired'
  const rerollCount = shop ? weeklyRerollCount(shop) : 0
  const choices = useMemo<WeeklyChoice[]>(() => shop ? [
    { id: 'booster', title: shop.booster.definition.title, kind: 'booster', booster: shop.booster.definition },
    ...(christmasActive ? [{ id: christmasBooster.id, title: christmasBooster.title, kind: 'christmas' as const, booster: christmasBooster }] : []),
    ...shop.offers.map(offer => ({ id: `card-${offer.id}`, title: cardById.get(offer.cardId)!.title, kind: 'card' as const, offer })),
  ] : [], [shop, christmasActive])
  const selected = choices.find(choice => choice.id === selectedId) ?? choices[0]
  const isChristmas = selected?.kind === 'christmas'
  const isBooster = selected?.kind === 'booster'
  const offer = selected?.kind === 'card' ? selected.offer : undefined
  const offerId = offer?.id ?? selected?.id
  useEffect(() => {
    if (shop && !expired) return
    refreshWeeklyShop().then(() => { setError(''); setSelectedId('booster') }).catch(e => setError(errorText(e)))
  }, [shop, expired])
  useEffect(() => {
    if (purchasedOffer === null) return
    const timer = window.setTimeout(() => setPurchasedOffer(null), 1600)
    return () => window.clearTimeout(timer)
  }, [purchasedOffer])
  async function buy() {
    if (!shop || !offerId || movingRef.current || inFlight.current) return
    inFlight.current = true; setBusy(offerId); setError('')
    try {
      if (isChristmas) await buyBooster(christmasBooster.id)
      else await buyWeeklyOffer(shop.weekStart, offerId, undefined, undefined, rerollCount)
      setPurchasedOffer({ weekStart: shop.weekStart, rerollCount, id: offerId })
    } catch (e) { setError(errorText(e)); await refreshWeeklyShop().catch(() => {}) }
    finally { inFlight.current = false; setBusy(null) }
  }
  const closed = sales !== 'open'
  const boosterSold = shop?.booster.remaining === 0
  const price = isChristmas ? christmasBooster.access.price : isBooster ? shop?.booster.price ?? 0 : offer?.price ?? 0
  const remaining = isBooster ? shop?.booster.remaining ?? 0 : offer && !offer.sold ? 1 : 0
  const sold = !isChristmas && remaining === 0
  const offerExpired = !isChristmas && expired
  const purchaseLabel = offerExpired ? 'Renouvellement…' : sold ? (isBooster ? 'Épuisé' : 'Épuisée') : isBooster && closed ? 'Ventes fermées' : 'Acheter'
  const purchased = purchasedOffer !== null && purchasedOffer.weekStart === shop?.weekStart && purchasedOffer.rerollCount === rerollCount && purchasedOffer.id === offerId
  return <section className="weekly-shop-page">
    <BoosterSectionHeading title="Boutique" linkTo="/" linkLabel="Vos boosters" back actions={shop ? <WeeklyShopClock at={shop.rerollAt} minimumTime={player.maxObservedClockAt} /> : undefined} />
    <ErrorNotice error={error} />
    {shop && selected ? <section className="weekly-section weekly-selection" aria-labelledby="weekly-selection-title">
      <div className="weekly-section-heading"><h2 id="weekly-selection-title">{isChristmas ? 'Event de Noël' : `Cette semaine · ${remaining} restant${remaining > 1 ? 's' : ''}`}</h2><button className="drop-rates-trigger" disabled={moving} onClick={() => setShowRates(true)}><Info size={12} /> Taux de drop</button></div>
      <div className="shop-stage">
        <ShopCarousel choices={choices} selectedId={selected.id} onSelect={id => { setSelectedId(id); setError('') }} onMovingChange={changeMoving} disabled={busy !== null} labels={labels} renderChoice={choice => choice.kind !== 'card' ? <div className={`pack-preview booster-size${choice.kind === 'booster' && boosterSold ? ' is-sold' : ''}`}><BoosterPack booster={choice.booster} flat /></div> : <div className={`showcase-card booster-size${choice.offer.sold ? ' is-sold' : ''}`}><CollectibleCard card={{ ...choice.offer, dropId: `preview-${choice.offer.id}` }} definition={cardById.get(choice.offer.cardId)!} presentation="thumbnail" interactive={false} /></div>} />
        <ShopBuyButton price={price} label={purchaseLabel} moving={moving} busy={busy === offerId} purchased={purchased} disabled={busy !== null || offerExpired || sold || (isBooster && closed) || player.fragments < fragmentPurchaseCost(price, settings)} accessibleLabel={moving ? 'Changement d’offre' : purchased ? `${selected.title} ajouté${selected.kind === 'card' ? 'e' : ''}` : purchaseLabel === 'Acheter' ? `Acheter ${selected.title} pour ${price} fragments` : `${selected.title} ${purchaseLabel.toLowerCase()}`} onClick={() => void buy()} />
      </div>
    </section> : <p className="shop-description">Préparation de la boutique…</p>}
    <section className="weekly-section weekly-daily" aria-label="Achats de tous les jours"><PermanentBoosterShop /></section>
    {shop && <WeeklyBonusShop key={shop.weekStart} shop={shop} balance={player.fragments} credits={player.weeklyBonusCredits} expired={expired} onRerolled={() => setSelectedId('booster')} />}
    {showRates && selected && <Modal title={selected.kind === 'card' ? 'Taux de drop · Vitrine' : `Taux de drop · ${selected.title}`} onClose={() => setShowRates(false)}>
      {selected.kind === 'card' ? <DropRateTable rates={WEEKLY_SHOWCASE_RATES} /> : <DropRates booster={selected.booster} />}
    </Modal>}
  </section>
}
