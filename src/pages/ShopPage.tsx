import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Clock3, Info } from 'lucide-react'
import { useGame } from '../components/useGame'
import { useNow } from '../components/useNow'
import { BoosterPack } from '../components/BoosterPack'
import { BoosterSectionHeading } from '../components/BoosterSectionHeading'
import { ShopCarousel } from '../components/ShopCarousel'
import { ShopBuyButton } from '../components/ShopBuyButton'
import { CollectibleCard } from '../components/CollectibleCard'
import { ErrorNotice, Modal } from '../components/ui'
import { DropRates, DropRateTable } from '../components/DropRates'
import { errorText, formatShopCountdown } from '../components/format'
import { cardById } from '../data/cards'
import { SALES_CLOSE_MS, WEEKLY_SHOWCASE_RATES, weeklyRerollCount, type WeeklyOffer } from '../game/weeklyShop'
import { buyWeeklyOffer, refreshWeeklyShop } from '../storage/weeklyShop'
import { PermanentBoosterShop } from '../components/PermanentBoosterShop'
import { WeeklyBonusShop } from '../components/WeeklyBonusShop'
import '../styles/weekly-shop.css'

type WeeklyChoice = { id: string; title: string } & ({ kind: 'booster' } | { kind: 'card'; offer: WeeklyOffer })
const labels = { region: 'Choisir une offre de la semaine', selection: 'Sélection des offres de la semaine', previous: 'Offre précédente', next: 'Offre suivante' }
export function ShopPage() {
  const { weeklyShop: shop, player } = useGame()
  const now = Math.max(useNow(), player.maxObservedClockAt)
  const [error, setError] = useState(''), [busy, setBusy] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState('booster'), [moving, setMoving] = useState(false)
  const [showRates, setShowRates] = useState(false)
  const movingRef = useRef(false)
  const changeMoving = useCallback((value: boolean) => { movingRef.current = value; setMoving(value) }, [])
  const [purchasedOffer, setPurchasedOffer] = useState<{ weekStart: number; rerollCount: number; id: string } | null>(null)
  const inFlight = useRef(false)
  const expired = !!shop && now >= shop.rerollAt
  const rerollCount = shop ? weeklyRerollCount(shop) : 0
  const choices = useMemo<WeeklyChoice[]>(() => shop ? [
    { id: 'booster', title: shop.booster.definition.title, kind: 'booster' },
    ...shop.offers.map(offer => ({ id: `card-${offer.id}`, title: cardById.get(offer.cardId)!.title, kind: 'card' as const, offer })),
  ] : [], [shop])
  const selected = choices.find(choice => choice.id === selectedId) ?? choices[0]
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
    if (!shop || !selected || movingRef.current || inFlight.current) return
    const id = selected.kind === 'booster' ? 'booster' : selected.offer.id
    inFlight.current = true; setBusy(id); setError('')
    try {
      await buyWeeklyOffer(shop.weekStart, id, undefined, undefined, rerollCount)
      setPurchasedOffer({ weekStart: shop.weekStart, rerollCount, id })
    } catch (e) { setError(errorText(e)); await refreshWeeklyShop().catch(() => {}) }
    finally { inFlight.current = false; setBusy(null) }
  }
  const closed = !shop || expired || now >= shop.rerollAt - SALES_CLOSE_MS
  const isBooster = selected?.kind === 'booster'
  const offer = selected?.kind === 'card' ? selected.offer : undefined
  const offerId = isBooster ? 'booster' : offer?.id
  const boosterSold = shop?.booster.remaining === 0
  const price = isBooster ? shop?.booster.price ?? 0 : offer?.price ?? 0
  const remaining = isBooster ? shop?.booster.remaining ?? 0 : offer && !offer.sold ? 1 : 0
  const sold = remaining === 0
  const purchaseLabel = expired ? 'Renouvellement…' : sold ? (isBooster ? 'Épuisé' : 'Épuisée') : isBooster && closed ? 'Ventes fermées' : 'Acheter'
  const purchased = purchasedOffer !== null && purchasedOffer.weekStart === shop?.weekStart && purchasedOffer.rerollCount === rerollCount && purchasedOffer.id === offerId
  return <section className="weekly-shop-page">
    <BoosterSectionHeading title="Boutique" linkTo="/" linkLabel="Vos boosters" back actions={shop ? <div className="weekly-header-tools"><span className="weekly-timer" role="timer" aria-label={`Renouvellement dans ${formatShopCountdown(shop.rerollAt - now)}`} title={shop.rerollAt - now < 86400_000 ? 'Heures : minutes : secondes' : 'Jours : heures : minutes'}><Clock3 size={14} /><span>{formatShopCountdown(shop.rerollAt - now)}</span></span></div> : undefined} />
    <ErrorNotice error={error} />
    {shop && selected ? <section className="weekly-section weekly-selection" aria-labelledby="weekly-selection-title">
      <div className="weekly-section-heading"><h2 id="weekly-selection-title">Cette semaine · {remaining} restant{remaining > 1 ? 's' : ''}</h2><button className="drop-rates-trigger" disabled={moving} onClick={() => setShowRates(true)}><Info size={12} /> Taux de drop</button></div>
      <div className="shop-stage">
        <ShopCarousel choices={choices} selectedId={selected.id} onSelect={id => { setSelectedId(id); setError('') }} onMovingChange={changeMoving} disabled={busy !== null} labels={labels} renderChoice={choice => choice.kind === 'booster' ? <div className={`pack-preview booster-size${boosterSold ? ' is-sold' : ''}`}><BoosterPack booster={shop.booster.definition} /></div> : <div className={`showcase-card booster-size${choice.offer.sold ? ' is-sold' : ''}`}><CollectibleCard card={{ ...choice.offer, dropId: `preview-${choice.offer.id}` }} definition={cardById.get(choice.offer.cardId)!} presentation="thumbnail" interactive={false} /></div>} />
        <ShopBuyButton price={price} label={purchaseLabel} moving={moving} busy={busy === offerId} purchased={purchased} disabled={busy !== null || expired || !!sold || (isBooster && closed) || player.fragments < price} accessibleLabel={moving ? 'Changement d’offre' : purchased ? `${selected.title} ajouté${isBooster ? '' : 'e'}` : purchaseLabel === 'Acheter' ? `Acheter ${selected.title} pour ${price} fragments` : `${selected.title} ${purchaseLabel.toLowerCase()}`} onClick={() => void buy()} />
      </div>
    </section> : <p className="shop-description">Préparation de la boutique…</p>}
    <section className="weekly-section weekly-daily" aria-label="Achats de tous les jours"><PermanentBoosterShop /></section>
    {shop && <WeeklyBonusShop key={shop.weekStart} shop={shop} balance={player.fragments} credits={player.weeklyBonusCredits} expired={expired} onRerolled={() => setSelectedId('booster')} />}
    {showRates && shop && <Modal title={isBooster ? 'Taux de drop · lucky boost' : 'Taux de drop · Vitrine'} onClose={() => setShowRates(false)}>
      {isBooster ? <DropRates booster={shop.booster.definition} /> : <DropRateTable rates={WEEKLY_SHOWCASE_RATES} />}
    </Modal>}
  </section>
}
