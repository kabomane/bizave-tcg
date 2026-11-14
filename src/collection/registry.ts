import registry from '../data/card-registry.json'
import { cardById } from '../data/cards'

export const collectionRegistryVersion = registry.version
export const numericCardIds = new Map(Object.entries(registry.cards))
export const registeredCardIds = new Map([...numericCardIds].map(([id, number]) => [number, id]))
export const collectionCardSlots = Math.max(...registeredCardIds.keys())

export function registeredCard(number: number) {
  const id = registeredCardIds.get(number)
  if (!id) throw new Error('Certaines cartes nécessitent une version plus récente du jeu.')
  if (!cardById.has(id)) throw new Error('La définition d’une carte archivée est introuvable.')
  return id
}
