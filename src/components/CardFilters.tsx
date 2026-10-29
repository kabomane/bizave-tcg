import { Check } from 'lucide-react'
import { ART_LABELS, FINISH_LABELS, RARITY_COLORS, RARITY_LABELS } from '../game/config'
import type { ArtVariant, Finish, Rarity } from '../game/types'
import { FilterMenu } from './FilterMenu'
import { cardFilterOptions as options } from '../collection/filters'
import type { CardFilterValue } from '../collection/filters'

const toggle = <T,>(values: T[], value: T) => values.includes(value) ? values.filter(item => item !== value) : [...values, value]

export function CardFilters({ value, onChange }: { value: CardFilterValue; onChange: (value: CardFilterValue) => void }) {
  const check = (selected: boolean) => <span className="option-check">{selected && <Check size={12} />}</span>
  return <div className="collection-filters">
    {options.length > 1 && <FilterMenu label="Boosters" active={!!value.boosters.length} count={value.boosters.length}>
      {options.map(option => <button className="filter-option" role="menuitemcheckbox" aria-checked={value.boosters.includes(option.id)} key={option.id} onClick={() => onChange({ ...value, boosters: toggle(value.boosters, option.id) })}>{option.title}{check(value.boosters.includes(option.id))}</button>)}
      {!!value.boosters.length && <button role="menuitem" className="filter-reset" onClick={() => onChange({ ...value, boosters: [] })}>Réinitialiser</button>}
    </FilterMenu>}
    <FilterMenu label="Rareté" active={!!value.rarities.length} count={value.rarities.length}>
      {(Object.entries(RARITY_LABELS) as [Rarity, string][]).map(([id, label]) => <button className="filter-option" role="menuitemcheckbox" aria-checked={value.rarities.includes(id)} key={id} onClick={() => onChange({ ...value, rarities: toggle(value.rarities, id) })}><span className="rarity-dot" style={{ background: RARITY_COLORS[id] }} />{label}{check(value.rarities.includes(id))}</button>)}
      {!!value.rarities.length && <button role="menuitem" className="filter-reset" onClick={() => onChange({ ...value, rarities: [] })}>Réinitialiser</button>}
    </FilterMenu>
    <FilterMenu label="Finitions" active={!!value.finishes.length || !!value.illustrations.length} count={value.finishes.length + value.illustrations.length}>
      {(Object.entries(FINISH_LABELS) as [Finish, string][]).map(([id, label]) => <button className="filter-option" role="menuitemcheckbox" aria-checked={value.finishes.includes(id)} key={id} onClick={() => onChange({ ...value, finishes: toggle(value.finishes, id) })}>{label}{check(value.finishes.includes(id))}</button>)}
      <div className="filter-divider" />
      {(Object.entries(ART_LABELS) as [ArtVariant, string][]).map(([id, label]) => <button className="filter-option" role="menuitemcheckbox" aria-checked={value.illustrations.includes(id)} key={id} onClick={() => onChange({ ...value, illustrations: toggle(value.illustrations, id) })}>{label}{check(value.illustrations.includes(id))}</button>)}
      {!!(value.finishes.length + value.illustrations.length) && <button role="menuitem" className="filter-reset" onClick={() => onChange({ ...value, finishes: [], illustrations: [] })}>Réinitialiser</button>}
    </FilterMenu>
  </div>
}
