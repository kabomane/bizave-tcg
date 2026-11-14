import { Gem, Layers3 } from 'lucide-react'
import type { Card } from '../game/types'
import { cardById } from '../data/cards'
import { cardFragmentValue } from '../collection/view'
import { CollectibleCard } from './CollectibleCard'
import { FinishDot } from './FinishDot'

type Face = Omit<Card, 'dropId'> & { dropId?: string }
export function CollectionCardTile({ card, quantity, pileCards, label = '', showValue, suspended, onOpen }: { card: Face; quantity: number; pileCards?: readonly Face[]; label?: string; showValue: boolean; suspended: boolean; onOpen: () => void }) {
  const value = cardFragmentValue(card)
  const fragmentValue = <span className="card-fragment-value" aria-label={`${value} ${value === 1 ? 'fragment' : 'fragments'} par exemplaire`} title="Valeur de recyclage d’un exemplaire"><Gem size={12} aria-hidden="true" />{value}</span>
  const face = <CollectibleCard deferred suspended={suspended} presentation="thumbnail" card={card} definition={cardById.get(card.cardId)!} activationLabel={pileCards ? `Ouvrir la pile, ${label}` : undefined} onActivate={onOpen} />
  return <div className="collection-item"><div className="collection-face">{pileCards ? <div className="collection-pile">{face}</div> : face}</div>{pileCards ? <div className="card-caption"><span className="collection-finish-dots" aria-label={label}>{pileCards.map((entry, index) => <FinishDot key={index} card={entry} />)}</span>{showValue ? fragmentValue : <Layers3 size={12} aria-hidden="true" />}</div> : <div className={`card-caption card-caption-single${showValue ? ' card-caption-valued' : ''}`}>{quantity > 1 && <b>×{quantity}</b>}{showValue && fragmentValue}</div>}</div>
}
