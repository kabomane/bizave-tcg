import type { Card } from '../game/types'

export function FinishDot({ card, active = false, revealed = false }: { card: Pick<Card, 'finish' | 'artVariant'>; active?: boolean; revealed?: boolean }) {
  return <span aria-hidden="true" className={`finish-dot f-${card.finish} a-${card.artVariant}${active ? ' is-current' : ''}${revealed ? ' is-revealed' : ''}`} />
}
