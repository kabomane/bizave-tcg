import type { BoosterDefinition } from '../game/types'
import memoryFrameCards from './pools/memory-frame.json'
import animaIsekaiCards from './pools/anima-isekai.json'
import catalogue from './catalogue.json'
import { RARITY_COLORS } from '../game/config'

export const boosters: BoosterDefinition[] = [{
  // Keep the original ID so purchased packs and pending openings survive the rename.
  id: 'phantom-blood', title: 'Memory Frame', subtitle: `${memoryFrameCards.length} cartes`, description: '',
  artwork: { symbol: 'spark', colors: { primary: '#641e2c', secondary: '#170f15', shine: '#e9dcc6', glow: '#a83b4c' } },
  access: { type: 'free', shop: { price: 70 } }, cardsPerPack: 5,
  sources: [{ type: 'cards', cardIds: memoryFrameCards }],
  rates: { rarity: 'default', finish: 'default', illustration: 'default' },
  enabled: true, order: 0,
  showInFilters: true,
}, {
  id: 'anima-isekai', title: 'Anima Isekai', subtitle: `${animaIsekaiCards.length} cartes`, description: '',
  artwork: { symbol: 'moon', colors: { primary: '#34224e', secondary: '#121426', shine: '#e7d9be', glow: '#7562b5' } },
  access: { type: 'free', shop: { price: 50 } }, cardsPerPack: 5,
  sources: [{ type: 'cards', cardIds: animaIsekaiCards }],
  rates: { rarity: 'default', finish: 'default', illustration: 'default' },
  enabled: true, order: 1,
  showInFilters: true,
}, {
  id: 'epico-stellari', title: 'epico stellari', subtitle: `${catalogue.filter(card => card.rarity === 'epic' || card.rarity === 'legendary').length} cartes`, description: '',
  artwork: { symbol: 'bloom', colors: { primary: RARITY_COLORS.epic, secondary: '#21122f', shine: RARITY_COLORS.legendary, glow: RARITY_COLORS.legendary } },
  access: { type: 'shop', price: 700 }, cardsPerPack: 5,
  sources: [{ type: 'rarities', rarities: ['epic', 'legendary'] }],
  rates: { rarity: { common: 0, uncommon: 0, rare: 0, epic: 91, legendary: 9 }, finish: 'default', illustration: 'default' },
  enabled: true, order: 3,
  showInFilters: false,
}, {
  id: 'rarity-only', title: 'rarity only', subtitle: `${catalogue.filter(card => card.rarity === 'rare').length} cartes`, description: '',
  artwork: { symbol: 'spark', colors: { primary: RARITY_COLORS.rare, secondary: '#101f39', shine: '#c9dffc', glow: RARITY_COLORS.rare } },
  access: { type: 'shop', price: 400 }, cardsPerPack: 5,
  sources: [{ type: 'rarities', rarities: ['rare'] }],
  rates: { rarity: { common: 0, uncommon: 0, rare: 100, epic: 0, legendary: 0 }, finish: 'default', illustration: 'default' },
  enabled: true, order: 2,
  showInFilters: false,
}]
