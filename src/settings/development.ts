import { readLocalPreferences, type Preferences } from './preferences'

export const DEVELOPMENT_OPTIONS_ENABLED = import.meta.env.DEV

export function developmentOptionEnabled(option: 'devUnlimitedFragments' | 'devEventAlwaysActive', preferences?: Preferences) {
  return DEVELOPMENT_OPTIONS_ENABLED && (preferences ?? readLocalPreferences())[option]
}

export function fragmentPurchaseCost(price: number, preferences?: Preferences) {
  return developmentOptionEnabled('devUnlimitedFragments', preferences) ? 0 : price
}
