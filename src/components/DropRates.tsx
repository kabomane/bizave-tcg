import { ART_LABELS, FINISH_LABELS, RARITY_LABELS } from '../game/config'
import { resolveBoosterRates } from '../game/boosterRates'
import type { ArtVariant, BoosterDefinition, Finish, Rarity } from '../game/types'

export function DropRates({ booster }: { booster: BoosterDefinition }) {
  const rates = resolveBoosterRates(booster)
  return <div className="drop-rates"><p>Taux par carte. Les trois tirages sont indépendants.</p><section><h3>Rareté</h3><dl>{(Object.entries(rates.rarity) as [Rarity, number][]).map(([id, rate]) => <div key={id}><dt>{RARITY_LABELS[id]}</dt><dd>{rate} %</dd></div>)}</dl></section><section><h3>Finition</h3><dl>{(Object.entries(rates.finish) as [Finish, number][]).map(([id, rate]) => <div key={id}><dt>{FINISH_LABELS[id]}</dt><dd>{rate} %</dd></div>)}</dl></section><section><h3>Illustration</h3><dl>{(Object.entries(rates.illustration) as [ArtVariant, number][]).map(([id, rate]) => <div key={id}><dt>{ART_LABELS[id]}</dt><dd>{rate} %</dd></div>)}</dl></section></div>
}
