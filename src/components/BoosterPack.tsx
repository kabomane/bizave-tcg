import { useId } from 'react'
import type { CSSProperties } from 'react'
import type { BoosterDefinition } from '../game/types'
import '../styles/christmas.css'

function ChristmasEngraving({ metalId }: { metalId: string }) {
  return <svg className="phantom-engraving" viewBox="0 0 300 450" fill="none" aria-hidden="true">
    <defs><linearGradient id={metalId} x1="68" y1="108" x2="230" y2="238" gradientUnits="userSpaceOnUse"><stop stopColor="#fff0bb" /><stop offset=".45" stopColor="#bd8b45" /><stop offset=".72" stopColor="#fbe2a2" /><stop offset="1" stopColor="#b98b4e" /></linearGradient></defs>
    <circle cx="150" cy="176" r="89" stroke={`url(#${metalId})`} opacity=".65" />
    <circle cx="150" cy="176" r="80" stroke={`url(#${metalId})`} strokeDasharray="1 6" opacity=".72" />
    <g fill="#fff2d1" opacity=".75">
      <path d="M68 99l2.5 7.5L78 109l-7.5 2.5L68 119l-2.5-7.5L58 109l7.5-2.5ZM228 107l2 6 6 2-6 2-2 6-2-6-6-2 6-2ZM234 229l3 8 8 3-8 3-3 8-3-8-8-3 8-3ZM68 235l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
      <circle cx="87" cy="137" r="2" /><circle cx="206" cy="112" r="2.5" /><circle cx="209" cy="236" r="2" /><circle cx="88" cy="220" r="2" />
      <circle cx="61" cy="190" r="2" /><circle cx="242" cy="173" r="2.5" /><circle cx="101" cy="72" r="2" /><circle cx="195" cy="78" r="2" />
    </g>
    <g stroke={`url(#${metalId})`} strokeLinecap="round" strokeLinejoin="round">
      <path d="M150 149c-19-5-39-13-36-26 3-15 28-4 36 26Zm0 0c19-5 39-13 36-26-3-15-28-4-36 26Z" strokeWidth="4" />
      <path d="M101 166h98v58h-98z" fill="#832832" strokeWidth="2" />
      <path d="M95 150h110v23H95z" fill="#ad3b42" strokeWidth="2" />
      <path d="M141 150h18v74h-18z" fill={`url(#${metalId})`} />
      <path d="M111 184h22m-22 29h22m34-29h22m-22 29h22" opacity=".45" />
      <path d="M89 256q25 19 61 21 36-2 61-21m-98 14-16-4m26 8-10-11m74 3 16-4m-26 12 10-11" opacity=".7" />
    </g>
  </svg>
}

export function BoosterPack({ booster, small = false, tearing = false }: { booster: BoosterDefinition; small?: boolean; tearing?: boolean }) {
  const svgId = useId().replaceAll(':', '')
  const metalId = `booster-metal-${svgId}`, moonId = `booster-moon-${svgId}`
  const colors = booster.artwork.colors
  const weekly = booster.id === 'weekly-mystery'
  const christmas = booster.artwork.symbol === 'gift'
  const source = booster.sources[0]
  const subtitle = weekly && source?.type === 'cards' ? `${source.cardIds.length} cartes` : booster.subtitle
  return <div className={`booster-pack ${small ? 'pack-small' : ''} ${tearing ? 'pack-tearing' : ''}`} data-booster={booster.id} style={{ '--pack-primary': colors.primary, '--pack-secondary': colors.secondary, '--pack-shine': colors.shine } as CSSProperties} aria-label={`Booster ${booster.title}`}>
    <div className="pack-seal seal-top" /><div className="pack-border" />
    {christmas ? <ChristmasEngraving metalId={metalId} /> : <svg className="phantom-engraving" viewBox="0 0 300 450" fill="none" aria-hidden="true">
      <defs><linearGradient id={metalId} x1="20" y1="0" x2="280" y2="400" gradientUnits="userSpaceOnUse"><stop stopColor="#eddec2" /><stop offset=".35" stopColor="#9d8465" /><stop offset=".54" stopColor="#fff2d5" /><stop offset="1" stopColor="#8f7357" /></linearGradient><radialGradient id={moonId}><stop stopColor="#b94558" /><stop offset=".7" stopColor="#7b2639" /><stop offset="1" stopColor="#521a2a" /></radialGradient></defs>
      <circle cx="150" cy="174" r="82" fill={`url(#${moonId})`} />
      <g stroke={`url(#${metalId})`}><path d="M150 56 254 174 150 292 46 174Z" strokeWidth=".65" opacity=".6" /><path d="M150 67 244 174 150 281 56 174Z" strokeWidth=".5" opacity=".25" /><circle cx="150" cy="174" r="98" strokeWidth=".5" opacity=".2" /><path d="M150 88v184M82 174h136" strokeWidth=".5" opacity=".18" /><path d="M150 102C140 126 114 151 114 178a36 36 0 0 0 72 0c0-27-26-52-36-76Z" strokeWidth="1.3" /><path d="m150 119-20 59 20 32 20-32Z" strokeWidth=".8" /><path d="M130 178h40m-20 32v61m-7-17 7 17 7-17M103 203c-18-4-30-15-34-31 18 2 28 12 34 31Zm94 0c18-4 30-15 34-31-18 2-28 12-34 31Z" strokeWidth=".9" /><path d="M99 203 80 226m121-23 19 23M109 143l-16-22m98 22 16-22" strokeWidth=".6" opacity=".6" /><path d="m150 36 3 8-3 8-3-8Z" fill={`url(#${metalId})`} strokeWidth=".5" /><path d="M34 310h37m158 0h37M34 320h20m192 0h20" strokeWidth=".6" opacity=".55" /></g>
    </svg>}
    <div className="pack-wordmark"><strong>{christmas ? <>merry<br />xmas</> : weekly ? <>lucky<br />boost</> : booster.id === 'rarity-only' ? <>rarity<br />only</> : booster.title}</strong><span>{subtitle}</span></div>
    <div className="pack-sheen" /><div className="pack-seal seal-bottom" />
  </div>
}
