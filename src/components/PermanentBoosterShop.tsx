import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Info, ShoppingBag } from 'lucide-react'
import { boosters } from '../data/boosters'
import { shopBoosters, shopOffer } from '../game/boosterAvailability'
import { buyBooster } from '../storage/services'
import { useGame } from './useGame'
import { BoosterCarousel } from './BoosterCarousel'
import { ShopBuyButton } from './ShopBuyButton'
import { DropRates } from './DropRates'
import { EmptyState, ErrorNotice, Modal } from './ui'
import { errorText } from './format'

export function PermanentBoosterShop() {
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
  return <section className="shop-page"><div className="weekly-section-heading"><h2>Boosters permanents</h2>{offers.length > 0 && <button className="drop-rates-trigger" disabled={moving} onClick={() => setShowRates(true)}><Info size={12} /> Taux de drop</button>}</div>
    {booster ? <div className="shop-stage">
        <BoosterCarousel choices={offers} selectedId={booster.id} onSelect={id => { setSelectedId(id); setError('') }} onMovingChange={changeMoving} disabled={busyId !== null} />
        <ShopBuyButton price={price} disabled={busyId !== null || player.fragments < price} moving={moving} busy={busy} purchased={purchased} accessibleLabel={moving ? 'Changement de booster' : purchased ? `${booster.title} ajouté` : `Acheter ${booster.title} pour ${price} fragments`} onClick={() => void buy(booster.id)} />
        {booster.description && <p className="shop-description">{booster.description}</p>}
      </div> : <EmptyState icon={<ShoppingBag size={25} />} title="Aucun paquet en boutique.">Les prochains paquets apparaîtront ici.</EmptyState>}
    {showRates && booster && <Modal title={`Taux de drop · ${booster.title}`} onClose={() => setShowRates(false)}><DropRates booster={booster} /></Modal>}
    <span className="visually-hidden" role="status">{purchasedId ? `${offers.find(booster => booster.id === purchasedId)?.title ?? 'Booster'} ajouté à vos boosters.` : ''}</span>
    <ErrorNotice error={error} />
  </section>
}
