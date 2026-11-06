import type { BoosterDefinition } from '../game/types'
import { BoosterPack } from './BoosterPack'
import { ShopCarousel } from './ShopCarousel'

const labels = { region: 'Choisir un booster', selection: 'Sélection des boosters', previous: 'Booster précédent', next: 'Booster suivant' }
export function BoosterCarousel({ choices, selectedId, onSelect, onOpen, onMovingChange, disabled = false, canOpen = true, tearing = false }: { choices: readonly BoosterDefinition[]; selectedId: string; onSelect: (id: string) => void; onOpen?: () => void; onMovingChange?: (moving: boolean) => void; disabled?: boolean; canOpen?: boolean; tearing?: boolean }) {
  return <ShopCarousel choices={choices} selectedId={selectedId} onSelect={onSelect} onMovingChange={onMovingChange} disabled={disabled} labels={labels} renderChoice={(choice, active) => onOpen ? <button className={`pack-interaction booster-size ${tearing && active ? 'is-opening' : ''}`} onClick={onOpen} tabIndex={active ? 0 : -1} disabled={disabled || !canOpen || !active} aria-label={`Ouvrir le booster ${choice.title}`} aria-busy={disabled && active}><BoosterPack booster={choice} tearing={tearing && active} /></button> : <div className="pack-preview booster-size"><BoosterPack booster={choice} /></div>} />
}
