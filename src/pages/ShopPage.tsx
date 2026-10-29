import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Check, Gem, RotateCw, ShoppingBag } from 'lucide-react'
import { boosters } from '../data/boosters'
import { shopBoosters, shopOffer } from '../game/boosterAvailability'
import { buyBooster } from '../storage/services'
import { useGame } from '../components/useGame'
import { BoosterSectionHeading } from '../components/BoosterSectionHeading'
import { BoosterCarousel } from '../components/BoosterCarousel'
import { DropRates } from '../components/DropRates'
import { EmptyState, ErrorNotice, Modal } from '../components/ui'
import { errorText } from '../components/format'

export function ShopPage() {
  const { player } = useGame()
  const offers = useMemo(() => shopBoosters(boosters), [])
  const [selectedId, setSelectedId] = useState(offers[0]?.id ?? '')
  const booster = offers.find(offer => offer.id === selectedId) ?? offers[0]
  const [purchasedId, setPurchasedId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null), [error, setError] = useState(''), [showRates, setShowRates] = useState(false)
  const [moving, setMoving] = useState(false)
  const movingRef = useRef(false)
  const changeMoving = useCallback((value: boolean) => { movingRef.current = value; setMoving(value) }, [])
  const inFlight = useRef(false)
  const price = booster ? shopOffer(booster)!.price : 0
  const purchased = purchasedId === booster?.id, busy = busyId === booster?.id
  useEffect(() => {
    if (!purchasedId) return
    const timer = window.setTimeout(() => setPurchasedId(null), 1600)
    return () => window.clearTimeout(timer)
  }, [purchasedId])
  async function buy(boosterId: string) {
    if (movingRef.current || inFlight.current || purchasedId === boosterId) return
    inFlight.current = true; setBusyId(boosterId); setError('')
    try { await buyBooster(boosterId); setPurchasedId(boosterId) }
    catch (e) { setError(errorText(e)) }
    finally { inFlight.current = false; setBusyId(null) }
  }
  return <section className="shop-page"><BoosterSectionHeading title="Boutique" linkTo="/" linkLabel="Vos boosters" back onShowRates={offers.length ? () => setShowRates(true) : undefined} />
    {booster ? <div className="shop-stage">
        <BoosterCarousel choices={offers} selectedId={booster.id} onSelect={id => { setSelectedId(id); setError('') }} onMovingChange={changeMoving} disabled={busyId !== null} />
        <button type="button" className={`secondary-button shop-buy booster-size ${purchased ? 'is-purchased' : ''}`} disabled={moving || busyId !== null || purchased || player.fragments < price} aria-busy={busy || moving} aria-label={moving ? 'Changement de booster' : purchased ? `${booster.title} ajouté` : `Acheter ${booster.title} pour ${price} fragments`} onClick={() => buy(booster.id)}>
          {moving ? <><RotateCw size={15} className="shop-switch-spinner" aria-hidden="true" /> Changement…</> : purchased ? <><Check size={15} className="shop-purchase-check" /> Ajouté</> : <>{busy ? 'Achat…' : 'Acheter'} <span className="shop-price">{price} <Gem size={13} /></span></>}
        </button>
        {booster.description && <p className="shop-description">{booster.description}</p>}
      </div> : <EmptyState icon={<ShoppingBag size={25} />} title="Aucun paquet en boutique.">Les prochains paquets apparaîtront ici.</EmptyState>}
    {showRates && booster && <Modal title="Taux de drop" onClose={() => setShowRates(false)}><DropRates booster={booster} /></Modal>}
    <span className="visually-hidden" role="status">{purchasedId ? `${offers.find(booster => booster.id === purchasedId)?.title ?? 'Booster'} ajouté à vos boosters.` : ''}</span>
    <ErrorNotice error={error} />
  </section>
}
