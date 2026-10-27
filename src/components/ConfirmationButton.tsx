import { Check, type LucideIcon } from 'lucide-react'

export function ConfirmationButton({ icon: Icon, label, confirmation, confirmed, className, iconSize = 16, action, disabled, live }: { icon: LucideIcon; label: string; confirmation: string; confirmed: boolean; className: string; iconSize?: number; action: () => void; disabled?: boolean; live?: 'polite' }) {
  return <button type="button" className={className} aria-label={confirmed ? confirmation : label} onClick={action} disabled={disabled}><span key={String(confirmed)} className={confirmed ? 'clipboard-confirm' : ''} aria-hidden="true">{confirmed ? <Check size={iconSize} /> : <Icon size={iconSize} />}</span><span role="status" aria-live={live}>{confirmed ? confirmation : label}</span></button>
}
