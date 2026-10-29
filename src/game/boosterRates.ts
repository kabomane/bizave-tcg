import { DEFAULT_ART_VARIANT_RATES, DEFAULT_FINISH_RATES, DEFAULT_RARITY_RATES } from './config'
import type { BoosterDefinition } from './types'

export function validateRates(rates: Record<string, number>) {
  if (Object.values(rates).some(v => !Number.isFinite(v) || v < 0) || Math.abs(Object.values(rates).reduce((a, b) => a + b, 0) - 100) > 1e-9) throw new Error('Configuration : les probabilités doivent totaliser 100 %.')
}

function resolveProfile<T extends string>(profile: 'default' | Record<T, number> | undefined, defaults: Record<T, number>): Record<T, number> {
  const rates = profile === undefined || profile === 'default' ? defaults : profile
  if (!rates || typeof rates !== 'object' || Array.isArray(rates) || Object.keys(rates).length !== Object.keys(defaults).length || Object.keys(defaults).some(key => !Object.hasOwn(rates, key))) throw new Error('Configuration : profil de probabilités incomplet ou inconnu.')
  validateRates(rates)
  // Keep a stable category order regardless of the override's property order.
  return Object.fromEntries(Object.keys(defaults).map(key => [key, rates[key as T]])) as Record<T, number>
}

export function resolveBoosterRates(booster: BoosterDefinition) {
  return {
    rarity: resolveProfile(booster.rates?.rarity, DEFAULT_RARITY_RATES),
    finish: resolveProfile(booster.rates?.finish, DEFAULT_FINISH_RATES),
    illustration: resolveProfile(booster.rates?.illustration, DEFAULT_ART_VARIANT_RATES),
  }
}
