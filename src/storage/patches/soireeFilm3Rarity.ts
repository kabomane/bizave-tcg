// Temporary compatibility patch for the 2026-10-30 catalogue correction.
// Remove this module and its three call sites only after legacy local saves AND
// signed .btcg files with the Rare definition are no longer supported.
// See docs/patch-soiree-film-3.md. Never mutate a signed snapshot in place.
import type { CardDefinition } from '../../game/types'

export function patchSoireeFilm3Rarity(definition: CardDefinition): CardDefinition {
  return definition.id === 'soiree-film-3' && definition.rarity === 'rare'
    ? { ...definition, rarity: 'uncommon' }
    : definition
}
