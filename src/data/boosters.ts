import type { BoosterDefinition } from '../game/types'
import memoryFrameCards from './pools/memory-frame.json'
import animaIsekaiCards from './pools/anima-isekai.json'

export const boosters: BoosterDefinition[] = [{
  // Keep the original ID so purchased packs and pending openings survive the rename.
  id: 'phantom-blood', title: 'Memory Frame', subtitle: `${memoryFrameCards.length} cartes`, description: '',
  artwork: { symbol: 'spark', colors: { primary: '#641e2c', secondary: '#170f15', shine: '#e9dcc6', glow: '#a83b4c' } },
  access: { type: 'free', shop: { price: 70 } }, cardsPerPack: 5,
  sources: [{ type: 'cards', cardIds: memoryFrameCards }],
  enabled: true, order: 0,
}, {
  id: 'anima-isekai', title: 'Anima Isekai', subtitle: `${animaIsekaiCards.length} cartes`, description: '',
  artwork: { symbol: 'moon', colors: { primary: '#34224e', secondary: '#121426', shine: '#e7d9be', glow: '#7562b5' } },
  access: { type: 'shop', price: 50 }, cardsPerPack: 5,
  sources: [{ type: 'cards', cardIds: animaIsekaiCards }],
  enabled: true, order: 1,
}]
