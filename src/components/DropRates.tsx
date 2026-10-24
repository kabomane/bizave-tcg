import { ART_LABELS, DEFAULT_ART_VARIANT_RATES, DEFAULT_FINISH_RATES, DEFAULT_RARITY_RATES, FINISH_LABELS, RARITY_LABELS } from '../game/config'
import type { ArtVariant, Finish, Rarity } from '../game/types'

export function DropRates() {
  return <div className="drop-rates"><p>Taux par carte. Les trois tirages sont indépendants.</p><section><h3>Rareté</h3><dl>{(Object.entries(DEFAULT_RARITY_RATES) as [Rarity, number][]).map(([id, rate]) => <div key={id}><dt>{RARITY_LABELS[id]}</dt><dd>{rate} %</dd></div>)}</dl></section><section><h3>Finition</h3><dl>{(Object.entries(DEFAULT_FINISH_RATES) as [Finish, number][]).map(([id, rate]) => <div key={id}><dt>{FINISH_LABELS[id]}</dt><dd>{rate} %</dd></div>)}</dl></section><section><h3>Illustration</h3><dl>{(Object.entries(DEFAULT_ART_VARIANT_RATES) as [ArtVariant, number][]).map(([id, rate]) => <div key={id}><dt>{ART_LABELS[id]}</dt><dd>{rate} %</dd></div>)}</dl></section></div>
}
