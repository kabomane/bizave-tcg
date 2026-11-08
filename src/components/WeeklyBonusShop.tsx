import { useEffect, useRef, useState } from 'react'
import { Gem, RotateCw } from 'lucide-react'
import { WEEKLY_REROLL_PRICE, type WeeklyShopRow } from '../game/weeklyShop'
import type { PlayerStateRow, WeeklyBonusKind } from '../game/types'
import { claimWeeklyBonus } from '../storage/weeklyShop'
import { errorText } from './format'
import { ShopBuyButton } from './ShopBuyButton'
import { ShopCarousel } from './ShopCarousel'
import { ErrorNotice } from './ui'
import { useSettings } from '../settings/useSettings'
import { fragmentPurchaseCost } from '../settings/development'

const choices = [
  { id: 'reroll', title: 'Reroll', face: 'Reroll', caption: 'Nouvelle sélection', footer: 'Lucky boost et vitrine', Icon: RotateCw },
  { id: 'fragments', title: 'Carte fragments', face: '?', caption: 'fragments', footer: 'Carte gratuite', Icon: Gem },
] as const
const labels = { region: 'Choisir un bonus', selection: 'Sélection des bonus', previous: 'Bonus précédent', next: 'Bonus suivant' }

export function WeeklyBonusShop({ shop, balance, credits, expired, onRerolled }: {
  shop: WeeklyShopRow; balance: number; credits?: PlayerStateRow['weeklyBonusCredits']; expired: boolean; onRerolled: () => void
}) {
  const settings = useSettings()
  const [selectedId, setSelectedId] = useState<WeeklyBonusKind>('reroll')
  const [moving, setMoving] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{ id: WeeklyBonusKind; message: string } | null>(null)
  const movingRef = useRef(false)
  const inFlight = useRef(false)
  const reroll = selectedId === 'reroll'
  const remaining = {
    reroll: Number(!shop.rerollUsed) + (credits?.reroll ?? 0),
    fragments: Number(!shop.fragmentsClaimed) + (credits?.fragments ?? 0),
  }
  const count = remaining[selectedId]
  const used = count === 0
  const rerollPrice = credits?.reroll ? 0 : WEEKLY_REROLL_PRICE
  const disabled = expired || used || (reroll && balance < fragmentPurchaseCost(rerollPrice, settings))
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
      const amount = await claimWeeklyBonus(shop.weekStart, selectedId, undefined, undefined, reroll ? rerollPrice : undefined)
      setSuccess({ id: selectedId, message: amount === undefined ? 'Renouvelé' : `+${amount} fragments` })
      if (reroll) onRerolled()
    } catch (error) {
      setError(errorText(error))
    } finally {
      inFlight.current = false
      setBusy(false)
    }
  }

  const label = expired ? 'Renouvellement…' : used ? (reroll ? 'Épuisé' : 'Réclamée') : reroll && rerollPrice > 0 ? 'Acheter' : 'Réclamer'
  const accessibleLabel = purchased ? success.message : !used && !expired
    ? reroll ? (rerollPrice > 0 ? `Acheter le reroll pour ${rerollPrice} fragments` : 'Réclamer le reroll gratuit') : 'Réclamer la carte fragments'
    : label

  return <section className="weekly-section weekly-bonus" aria-labelledby="weekly-bonus-title">
    <div className="weekly-section-heading"><h2 id="weekly-bonus-title">Bonus de la semaine · {count} restant{count > 1 ? 's' : ''}</h2></div>
    <div className="shop-stage">
      <ShopCarousel
        choices={choices}
        selectedId={selectedId}
        labels={labels}
        disabled={busy}
        onSelect={id => { setSelectedId(id); setError('') }}
        onMovingChange={value => { movingRef.current = value; setMoving(value) }}
        renderChoice={({ id, face, caption, footer, Icon }) => {
          const spent = remaining[id] === 0
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
        price={reroll && rerollPrice > 0 ? rerollPrice : undefined}
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
