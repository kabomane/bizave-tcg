import type { CSSProperties } from 'react'
import type { BoosterDefinition } from '../game/types'
import { WEEKLY_BOOSTER_ID } from '../game/weeklyShop'
import '../styles/booster-pack.css'

const DESIGNS = { sachet: { maxVisibleCards: 3 }, bloc: { maxVisibleCards: 5 } }

const teeth = Array.from({ length: 21 }, (_, index) => index)
function packOutline(top: number) {
  const upper = teeth.map(index => `${index * 5}% ${top + (index % 2) * 1.15}%`)
  const lower = teeth.map(index => `${100 - index * 5}% ${100 - (index % 2) * 1.15}%`)
  return `polygon(${[...upper, ...lower].join(',')})`
}
const closedOutline = packOutline(0)
const tornOutline = packOutline(7.33)
const sealOutline = `polygon(${teeth.map(index => `${index * 5}% ${(index % 2) * 14}%`).join(',')},100% 100%,0 100%)`

function Emblem({ emoji, ring = false }: { emoji: string; ring?: boolean }) {
  return <span className={`pack-emblem${ring ? ' pack-emblem-ring' : ''}`}>
    {ring && <svg viewBox="0 0 100 100" fill="none" stroke="currentColor">
      <circle cx="50" cy="50" r="46" strokeWidth=".8" opacity=".55" />
      <circle cx="50" cy="50" r="40" strokeWidth=".8" strokeDasharray="1 5" opacity=".7" />
      <path d="M50 2 53 7 50 12 47 7ZM50 88 53 93 50 98 47 93Z" fill="currentColor" stroke="none" />
    </svg>}
    <span>{emoji}</span>
  </span>
}

function Foil() {
  return <><span className="pack-crinkle" /><span className="pack-foil-sheen" /><span className="pack-pillow" /></>
}

function SachetFace({ title, subtitle, emoji }: { title: string; subtitle: string; emoji: string }) {
  const [first, ...rest] = title.split(' ')
  return <>
    <Foil />
    <span className="pack-crimp pack-crimp-top" /><span className="pack-crimp pack-crimp-bottom" />
    <span className="pack-inner" />
    <Emblem emoji={emoji} ring />
    <span className="pack-wordmark"><strong>{first}{rest.length > 0 && <>{' '}<br />{rest.join(' ')}</>}</strong><span>{subtitle}</span></span>
  </>
}

function BlocFace({ title, subtitle, emoji }: { title: string; subtitle: string; emoji: string }) {
  return <>
    <span className="pack-glint" />
    <span className="pack-label"><span><strong>{title}</strong><small>{subtitle} · scellé</small></span><Emblem emoji={emoji} /></span>
    <span className="pack-plinth">BIZAVE · TCG</span>
  </>
}

function PackCardBack({ index = 0, count = 1 }: { index?: number; count?: number }) {
  const offset = index - (count - 1) / 2
  const stagger = index / Math.max(1, count - 1)
  return <span className="pack-card-back" style={{ '--fan-stagger': stagger, '--fan-offset': offset, '--fan-distance': Math.abs(offset) } as CSSProperties}>
    <b>B</b><small>BIZAVE</small>
  </span>
}

export function BoosterPack({ booster, tearing = false, flat = false }: { booster: BoosterDefinition; tearing?: boolean; flat?: boolean }) {
  const design = booster.artwork.design === 'bloc' ? 'bloc' : 'sachet'
  const { colors, emoji = booster.id === WEEKLY_BOOSTER_ID ? '🍀' : '✦' } = booster.artwork
  const source = booster.sources[0]
  const subtitle = booster.sources.length === 1 && source?.type === 'cards' ? `${source.cardIds.length} cartes` : booster.subtitle
  const visibleCards = Math.max(1, Math.min(booster.cardsPerPack, DESIGNS[design].maxVisibleCards))
  const face = { title: booster.title, subtitle, emoji }
  const bloc = design === 'bloc'
  const style = {
    '--pack-primary': colors.primary, '--pack-secondary': colors.secondary, '--pack-shine': colors.shine, '--pack-glow': colors.glow,
    '--pack-outline': closedOutline, '--pack-torn-outline': tornOutline, '--pack-seal-outline': sealOutline,
  } as CSSProperties

  return <div className={`booster-pack pack-${design}${flat ? ' pack-flat' : ' pack-volume'}${tearing && !flat ? ' pack-tearing' : ''}`} data-booster={booster.id} role="img" aria-label={`Booster ${booster.title}, ${subtitle}`} style={style}>
    <span className="pack-lift" aria-hidden="true"><span className="pack-object">
      {flat ? bloc && <PackCardBack /> : Array.from({ length: visibleCards }, (_, index) => <PackCardBack key={index} index={index} count={visibleCards} />)}
      <span className={`pack-face pack-front ${bloc ? 'pack-glass' : 'pack-foil'}`}>
        {bloc ? <BlocFace {...face} /> : <SachetFace {...face} />}
      </span>
      {!flat && <>
        <span className={`pack-face pack-back ${bloc ? 'pack-glass' : 'pack-foil'}`}>
          {!bloc && <><Foil /><span className="pack-crimp pack-crimp-top" /><span className="pack-crimp pack-crimp-bottom" />
            <span className="pack-seam" /><Emblem emoji={emoji} /><span className="pack-back-label">{subtitle}<small>BIZAVE · TCG</small></span></>}
        </span>
        <span className="pack-side pack-side-left" /><span className="pack-side pack-side-right" />
        {bloc ? <><span className="pack-edge pack-edge-top" /><span className="pack-edge pack-edge-bottom" /></> : tearing && <span className="pack-crimp pack-torn-strip" />}
      </>}
    </span></span>
  </div>
}
