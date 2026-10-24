import { useEffect, useRef, useState } from 'react'
import { Check, Gem, ShoppingBag } from 'lucide-react'
import { boosters } from '../data/boosters'
import { shopBoosters, shopOffer } from '../game/boosterAvailability'
import { buyBooster } from '../storage/services'
import { useGame } from '../components/useGame'
import { BoosterSectionHeading } from '../components/BoosterSectionHeading'
import { BoosterPack } from '../components/BoosterPack'
import { DropRates } from '../components/DropRates'
import { EmptyState, ErrorNotice, Modal } from '../components/ui'
import { errorText } from '../components/format'

export function ShopPage() {
  const { player } = useGame()
  const offers = shopBoosters(boosters)
  const [purchasedId, setPurchasedId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null), [error, setError] = useState(''), [showRates, setShowRates] = useState(false)
  const inFlight = useRef(false)
  useEffect(() => {
    if (!purchasedId) return
    const timer = window.setTimeout(() => setPurchasedId(null), 1600)
    return () => window.clearTimeout(timer)
  }, [purchasedId])
  async function buy(boosterId: string) {
    if (inFlight.current || purchasedId === boosterId) return
    inFlight.current = true; setBusyId(boosterId); setError('')
    try { await buyBooster(boosterId); setPurchasedId(boosterId) }
    catch (e) { setError(errorText(e)) }
    finally { inFlight.current = false; setBusyId(null) }
  }
  return <section className="shop-page"><BoosterSectionHeading title="Boutique" linkTo="/" linkLabel="Vos boosters" back onShowRates={offers.length ? () => setShowRates(true) : undefined} />
    {offers.length ? <div className="shop-grid">{offers.map(booster => {
      const offer = shopOffer(booster)
      if (!offer) return null
      const price = offer.price, purchased = purchasedId === booster.id, busy = busyId === booster.id
      return <article className="shop-offer" key={booster.id} aria-label={booster.title}>
        <div className="shop-pack booster-size"><BoosterPack booster={booster} /></div>
        {booster.description && <p>{booster.description}</p>}
        <button type="button" className={`secondary-button shop-buy booster-size ${purchased ? 'is-purchased' : ''}`} disabled={busyId !== null || purchased || player.fragments < price} aria-busy={busy} aria-label={purchased ? `${booster.title} ajouté` : `Acheter ${booster.title} pour ${price} fragments`} onClick={() => buy(booster.id)}>
          {purchased ? <><Check size={15} className="shop-purchase-check" /> Ajouté</> : <>{busy ? 'Achat…' : 'Acheter'} <span className="shop-price">{price} <Gem size={13} /></span></>}
        </button>
      </article>
    })}</div> : <EmptyState icon={<ShoppingBag size={25} />} title="Aucun paquet en boutique.">Les prochains paquets apparaîtront ici.</EmptyState>}
    {showRates && <Modal title="Taux de drop" onClose={() => setShowRates(false)}><DropRates /></Modal>}
    <span className="visually-hidden" role="status">{purchasedId ? `${offers.find(booster => booster.id === purchasedId)?.title ?? 'Booster'} ajouté à vos boosters.` : ''}</span>
    <ErrorNotice error={error} />
  </section>
}
