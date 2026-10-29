import { useId } from 'react'
import type { CSSProperties } from 'react'
import type { BoosterDefinition } from '../game/types'

export function BoosterPack({ booster, small = false, tearing = false }: { booster: BoosterDefinition; small?: boolean; tearing?: boolean }) {
  const svgId = useId().replaceAll(':', '')
  const metalId = `booster-metal-${svgId}`, moonId = `booster-moon-${svgId}`
  const colors = booster.artwork.colors
  return <div className={`booster-pack ${small ? 'pack-small' : ''} ${tearing ? 'pack-tearing' : ''}`} data-booster={booster.id} style={{ '--pack-primary': colors.primary, '--pack-secondary': colors.secondary, '--pack-shine': colors.shine } as CSSProperties} aria-label={`Booster ${booster.title}`}>
    <div className="pack-seal seal-top" /><div className="pack-border" />
    <svg className="phantom-engraving" viewBox="0 0 300 450" fill="none" aria-hidden="true">
      <defs><linearGradient id={metalId} x1="20" y1="0" x2="280" y2="400" gradientUnits="userSpaceOnUse"><stop stopColor="#eddec2" /><stop offset=".35" stopColor="#9d8465" /><stop offset=".54" stopColor="#fff2d5" /><stop offset="1" stopColor="#8f7357" /></linearGradient><radialGradient id={moonId}><stop stopColor="#b94558" /><stop offset=".7" stopColor="#7b2639" /><stop offset="1" stopColor="#521a2a" /></radialGradient></defs>
      <circle cx="150" cy="174" r="82" fill={`url(#${moonId})`} />
      <g stroke={`url(#${metalId})`}><path d="M150 56 254 174 150 292 46 174Z" strokeWidth=".65" opacity=".6" /><path d="M150 67 244 174 150 281 56 174Z" strokeWidth=".5" opacity=".25" /><circle cx="150" cy="174" r="98" strokeWidth=".5" opacity=".2" /><path d="M150 88v184M82 174h136" strokeWidth=".5" opacity=".18" /><path d="M150 102C140 126 114 151 114 178a36 36 0 0 0 72 0c0-27-26-52-36-76Z" strokeWidth="1.3" /><path d="m150 119-20 59 20 32 20-32Z" strokeWidth=".8" /><path d="M130 178h40m-20 32v61m-7-17 7 17 7-17M103 203c-18-4-30-15-34-31 18 2 28 12 34 31Zm94 0c18-4 30-15 34-31-18 2-28 12-34 31Z" strokeWidth=".9" /><path d="M99 203 80 226m121-23 19 23M109 143l-16-22m98 22 16-22" strokeWidth=".6" opacity=".6" /><path d="m150 36 3 8-3 8-3-8Z" fill={`url(#${metalId})`} strokeWidth=".5" /><path d="M34 310h37m158 0h37M34 320h20m192 0h20" strokeWidth=".6" opacity=".55" /></g>
    </svg>
    <div className="pack-wordmark"><strong>{booster.title}</strong><span>{booster.subtitle}</span></div>
    <div className="pack-sheen" /><div className="pack-seal seal-bottom" />
  </div>
}
