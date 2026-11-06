import { Check, Gem, RotateCw } from 'lucide-react'

export function ShopBuyButton({ price, accessibleLabel, onClick, label = 'Acheter', disabled = false, moving = false, busy = false, purchased = false }: {
  price: number; accessibleLabel: string; onClick: () => void; label?: string; disabled?: boolean; moving?: boolean; busy?: boolean; purchased?: boolean
}) {
  return <button type="button" className={`secondary-button shop-buy booster-size ${purchased ? 'is-purchased' : ''}`} disabled={disabled || moving || busy || purchased} aria-busy={busy || moving} aria-label={accessibleLabel} onClick={onClick}>
    {moving ? <><RotateCw size={15} className="shop-switch-spinner" aria-hidden="true" /> Changement…</> : purchased ? <><Check size={15} className="shop-purchase-check" /> Ajouté</> : <>{busy ? 'Achat…' : label} <span className="shop-price">{price} <Gem size={13} /></span></>}
  </button>
}
