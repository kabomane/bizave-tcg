import { boosters } from '../data/boosters'
import { christmasBooster, isChristmasEventActive } from '../data/christmas'
import { DAILY_CARD_RATES } from '../game/dailyShop'
import { WEEKLY_SHOWCASE_RATES } from '../game/weeklyShop'
import { resolveBoosterRates } from '../game/boosterRates'
import { useGame } from './useGame'
import { useSettings } from '../settings/useSettings'
import { RatesViewer } from './RatesViewer'

export function ShopRatesDialog({ onClose }: { onClose: () => void }) {
  const { weeklyShop, dailyShop } = useGame()
  const settings = useSettings()
  const entries = [
    ...(weeklyShop ? [{ id: 'lucky', title: 'lucky boost', group: 'Offres en cours', meta: `${weeklyShop.booster.definition.cardsPerPack} cartes par booster · sélection personnalisée`, rates: resolveBoosterRates(weeklyShop.booster.definition) }] : []),
    { id: 'daily-cards', title: 'Cartes du jour', group: 'Offres en cours', meta: '0 à 3 cartes par jour · 1 exemplaire chacune', rates: DAILY_CARD_RATES },
    { id: 'weekly-cards', title: 'Vitrine de la semaine', group: 'Offres en cours', meta: '1 à 5 cartes par semaine · 1 exemplaire chacune', rates: WEEKLY_SHOWCASE_RATES },
    ...[...[...boosters].sort((a, b) => a.order - b.order), ...(isChristmasEventActive(settings) || dailyShop?.bundle.boosterId === christmasBooster.id ? [christmasBooster] : [])].map(b => ({ id: b.id, title: b.title, group: 'Boosters', meta: `${b.cardsPerPack} carte${b.cardsPerPack > 1 ? 's' : ''} par booster${b.id === 'legenda-completa' ? ' · Lot du jour seulement' : b.id === christmasBooster.id ? ' · Carte temporaire, hors collection' : ''}`, rates: resolveBoosterRates(b) })),
  ]
  return <RatesViewer entries={entries} initialId="lucky" onClose={onClose} />
}
