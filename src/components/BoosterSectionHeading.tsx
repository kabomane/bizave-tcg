import type { ReactNode } from 'react'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { Link } from 'react-router-dom'

export function BoosterSectionHeading({ title, linkTo, linkLabel, back = false, onShowRates }: {
  title: ReactNode; linkTo: string; linkLabel: string; back?: boolean; onShowRates?: () => void
}) {
  return <div className="booster-section-heading">
    <div className="booster-title-group"><h1>{title}</h1><Link className="booster-shop-link" to={linkTo}>{back && <ArrowLeft size={12} />}{linkLabel}{!back && <ArrowRight size={12} />}</Link></div>
    {onShowRates && <button className="drop-rates-trigger" onClick={onShowRates}><Info size={12} /> taux de drop</button>}
  </div>
}
