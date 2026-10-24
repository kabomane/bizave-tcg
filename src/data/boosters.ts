import type { BoosterDefinition } from '../game/types'
import phantomBloodCards from './pools/phantom-blood.json'

export const boosters: BoosterDefinition[] = [{
  id: 'phantom-blood', title: 'Phantom Blood', subtitle: `${phantomBloodCards.length} cartes`, description: '',
  artwork: { symbol: 'spark', colors: { primary: '#641e2c', secondary: '#170f15', shine: '#e9dcc6', glow: '#a83b4c' } },
  access: { type: 'free', shop: { price: 70 } }, cardsPerPack: 5,
  sources: [{ type: 'cards', cardIds: phantomBloodCards }],
  enabled: true, order: 0,
}]
