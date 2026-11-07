import { useEffect, useRef, useState } from 'react'
import { Gem, RotateCw } from 'lucide-react'
import { WEEKLY_REROLL_PRICE, type WeeklyShopRow } from '../game/weeklyShop'
import { claimWeeklyBonus } from '../storage/weeklyShop'
import { errorText } from './format'
import { ShopBuyButton } from './ShopBuyButton'
import { ShopCarousel } from './ShopCarousel'
import { ErrorNotice } from './ui'

const choices = [
  { id: 'reroll', title: 'Reroll', face: 'Reroll', caption: 'Nouvelle sélection', footer: 'Lucky boost et vitrine', Icon: RotateCw },
  { id: 'fragments', title: 'Carte fragments', face: '?', caption: 'fragments', footer: 'Carte gratuite', Icon: Gem },
] as const
type BonusId = (typeof choices)[number]['id']
const labels = { region: 'Choisir un bonus', selection: 'Sélection des bonus', previous: 'Bonus précédent', next: 'Bonus suivant' }

export function WeeklyBonusShop({ shop, balance, expired, onRerolled }: {
  shop: WeeklyShopRow; balance: number; expired: boolean; onRerolled: () => void
}) {
  const [selectedId, setSelectedId] = useState<BonusId>('reroll')
  const [moving, setMoving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ id: BonusId; message: string } | null>(null)
  const movingRef = useRef(false)
  const inFlight = useRef(false)
  const reroll = selectedId === 'reroll'
  const used = reroll ? shop.rerollUsed : shop.fragmentsClaimed
  const disabled = expired || !!used || (reroll && balance < WEEKLY_REROLL_PRICE)
  const purchased = success?.id === selectedId

  useEffect(() => {
    if (!success) return
    const timer = window.setTimeout(() => setSuccess(null), 1600)
    return () => window.clearTimeout(timer)
  }, [success])

  async function claim() {
    if (disabled || movingRef.current || inFlight.current) return
    inFlight.current = true
    setBusy(true)
    setError('')
    try {
      const amount = await claimWeeklyBonus(shop.weekStart, selectedId)
      setSuccess({ id: selectedId, message: amount === undefined ? 'Renouvelé' : `+${amount} fragments` })
      if (reroll) onRerolled()
    } catch (error) {
      setError(errorText(error))
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  const label = expired ? 'Renouvellement…' : used ? (reroll ? 'Épuisé' : 'Réclamée') : reroll ? 'Acheter' : 'Réclamer'
  const accessibleLabel = purchased ? success.message : !used && !expired
    ? reroll ? `Acheter le reroll pour ${WEEKLY_REROLL_PRICE} fragments` : 'Réclamer la carte fragments'
    : label

  return <section className="weekly-section weekly-bonus" aria-labelledby="weekly-bonus-title">
    <div className="weekly-section-heading"><h2 id="weekly-bonus-title">Bonus de la semaine · {used ? 0 : 1} restant</h2></div>
    <div className="shop-stage">
      <ShopCarousel
        choices={choices}
        selectedId={selectedId}
        labels={labels}
        disabled={busy}
        onSelect={id => { setSelectedId(id); setError('') }}
        onMovingChange={value => { movingRef.current = value; setMoving(value) }}
        renderChoice={({ id, face, caption, footer, Icon }) => {
          const spent = id === 'reroll' ? shop.rerollUsed : shop.fragmentsClaimed
          return <div className={`showcase-card booster-size${spent ? ' is-sold' : ''}`}>
            <div className="weekly-bonus-card">
              <article className="received-fragment-card">
                <i className="received-fragment-ornament" aria-hidden="true" />
                <span className="received-fragment-brand">Bizave · TCG</span>
                <Icon className="received-fragment-gem" aria-hidden="true" strokeWidth={1.1} />
                <span className="received-fragment-amount">{face}</span>
                <span className="received-fragment-unit">{caption}</span>
                <span className="received-fragment-sender">{footer}</span>
                <i className="received-fragment-sheen" aria-hidden="true" />
              </article>
            </div>
          </div>
        }}
      />
      <ShopBuyButton
        price={reroll ? WEEKLY_REROLL_PRICE : undefined}
        label={label}
        accessibleLabel={moving ? 'Changement de bonus' : accessibleLabel}
        disabled={disabled}
        busy={busy}
        moving={moving}
        purchased={purchased}
        purchaseText={success?.message}
        onClick={() => void claim()}
      />
      <span className="visually-hidden" role="status">{success?.message}</span>
      <ErrorNotice error={error} />
    </div>
  </section>
}
