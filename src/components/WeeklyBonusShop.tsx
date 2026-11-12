import { useEffect, useRef, useState } from 'react'
import { Gem, RotateCw } from 'lucide-react'
import { WEEKLY_REROLL_PRICE, type WeeklyShopRow } from '../game/weeklyShop'
import type { PlayerStateRow, WeeklyBonusKind } from '../game/types'
import { claimWeeklyBonus } from '../storage/weeklyShop'
import { fragmentPurchaseCost } from '../settings/development'
import { useSettings } from '../settings/useSettings'
import { errorText } from './format'
import { ErrorNotice } from './ui'
import { ShopCarousel } from './ShopCarousel'

const choices = [{ id: 'reroll', title: 'Reroll' }, { id: 'fragments', title: 'Carte fragments' }] as const
const labels = { region: 'Choisir un bonus', selection: 'Sélection des bonus', previous: 'Bonus précédent', next: 'Bonus suivant' }

export function WeeklyBonusShop({ shop, balance, credits, expired, onRerolled }: { shop: WeeklyShopRow; balance: number; credits?: PlayerStateRow['weeklyBonusCredits']; expired: boolean; onRerolled: () => void }) {
  const settings = useSettings()
  const [selectedId, setSelectedId] = useState<WeeklyBonusKind>('reroll')
  const [moving, setMoving] = useState(false)
  const movingRef = useRef(false)
  const [busy, setBusy] = useState<WeeklyBonusKind | null>(null), [error, setError] = useState(''), [success, setSuccess] = useState<{ kind: WeeklyBonusKind; text: string } | null>(null)
  useEffect(() => {
    if (!success) return
    const timer = window.setTimeout(() => setSuccess(null), 2000)
    return () => window.clearTimeout(timer)
  }, [success])
  const fragmentSuccess = success?.kind === 'fragments' ? success.text : null
  const lock = useRef(false)
  const rerollPrice = credits?.reroll ? 0 : WEEKLY_REROLL_PRICE
  const rerollRemaining = Number(!shop.rerollUsed) + (credits?.reroll ?? 0)
  const fragmentsRemaining = Number(!shop.fragmentsClaimed) + (credits?.fragments ?? 0)
  const rerollAvailable = rerollRemaining > 0
  const fragmentsAvailable = fragmentsRemaining > 0
  const visual = (kind: WeeklyBonusKind) => <div className="weekly-bonus-card"><article className="received-fragment-card">
    <i className="received-fragment-ornament" aria-hidden="true" /><span className="received-fragment-brand">Bizave · TCG</span>
    {kind === 'reroll' ? <RotateCw className="received-fragment-gem" strokeWidth={1.1} /> : <Gem className="received-fragment-gem" strokeWidth={1.1} />}
    <span className="received-fragment-amount">{kind === 'reroll' ? 'Reroll' : '?'}</span><span className="received-fragment-unit">{kind === 'reroll' ? 'Nouvelle sélection' : 'fragments'}</span><span className="received-fragment-sender">{kind === 'reroll' ? 'Boutiques du jour et de la semaine' : 'Carte gratuite'}</span><i className="received-fragment-sheen" aria-hidden="true" />
  </article></div>
  async function claim(kind: WeeklyBonusKind) {
    if (lock.current || movingRef.current || (kind === 'fragments' && fragmentSuccess)) return
    lock.current = true; setBusy(kind); setError('')
    try { const amount = await claimWeeklyBonus(shop.weekStart, kind, undefined, undefined, kind === 'reroll' ? rerollPrice : undefined); setSuccess({ kind, text: amount === undefined ? 'Sélection renouvelée' : `+${amount} fragments` }); if (kind === 'reroll') onRerolled() }
    catch (e) { setError(errorText(e)) } finally { lock.current = false; setBusy(null) }
  }
  const reroll = selectedId === 'reroll'
  const remaining = reroll ? rerollRemaining : fragmentsRemaining
  const available = reroll ? rerollAvailable : fragmentsAvailable
  const disabled = busy !== null || moving || expired || !available || (reroll ? balance < fragmentPurchaseCost(rerollPrice, settings) : fragmentSuccess !== null)
  return <section className="weekly-bonus" aria-label="Bonus de la semaine">
    <div className="section-line"><h3 aria-live="polite">Bonus de la semaine · {remaining} restant{remaining > 1 ? 's' : ''}</h3></div>
    <div className="shop-stage bonus-stage">
      <ShopCarousel choices={choices} selectedId={selectedId} onSelect={id => { setSelectedId(id); setError('') }} labels={labels} disabled={busy !== null} onMovingChange={value => { movingRef.current = value; setMoving(value) }} renderChoice={({ id }) => <div className={`showcase-card booster-size${(id === 'reroll' ? !rerollAvailable : !fragmentsAvailable) ? ' is-sold' : ''}`}>{visual(id)}</div>} />
      <button className="secondary-button shop-buy booster-size" aria-live="polite" aria-busy={busy !== null || moving} disabled={disabled} onClick={() => void claim(selectedId)}>
        {moving ? 'Changement…' : reroll
          ? !rerollAvailable ? 'Déjà utilisé' : busy === 'reroll' ? 'Renouvellement…' : rerollPrice > 0 ? <>Reroll · {rerollPrice}<Gem size={12} /></> : 'Réclamer le reroll gratuit'
          : fragmentSuccess ?? (!fragmentsAvailable ? 'Réclamée' : busy === 'fragments' ? 'Réclamation…' : 'Réclamer gratuitement')}
      </button>
      <span className="visually-hidden" role="status">{success?.kind === 'reroll' ? success.text : ''}</span>
      <ErrorNotice error={error} />
    </div>
  </section>
}
