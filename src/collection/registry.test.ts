import { expect, it } from 'vitest'
import registry from '../data/card-registry.json'
import lock from '../data/card-registry.lock.json'
import { cards } from '../data/cards'
import { registeredCard } from './registry'

function validAppendOnly(current: Record<string, number>, published: Record<string, number>) {
  const values = Object.values(current), max = Math.max(0, ...Object.values(published))
  return new Set(values).size === values.length && Object.entries(published).every(([id, number]) => current[id] === number) && values.every(n => Number.isInteger(n) && n > 0) && Object.entries(current).filter(([id]) => !(id in published)).map(([, number]) => number).sort((a, b) => a - b).every((n, i) => n === max + i + 1)
}
it('couvre tout le catalogue et verrouille les attributions publiées', () => {
  expect(validAppendOnly(registry.cards, lock.cards)).toBe(true)
  expect(cards.every(card => card.id in registry.cards)).toBe(true)
  expect(Object.values(registry.cards).sort((a, b) => a - b)).toEqual(Array.from({ length: Object.keys(registry.cards).length }, (_, i) => i + 1))
  expect(registry.cards).toHaveProperty('bizave-tcg-beta')
  expect(registry.cards).toHaveProperty('merry-wifemas')
  for (const [id, number] of Object.entries(registry.cards)) expect(registeredCard(number)).toBe(id)
})
it('détecte une renumérotation/suppression et autorise les ajouts en fin', () => {
  expect(validAppendOnly({ a: 1, b: 2, c: 3 }, { a: 1, b: 2 })).toBe(true)
  expect(validAppendOnly({ a: 2, b: 1 }, { a: 1, b: 2 })).toBe(false)
  expect(validAppendOnly({ a: 1 }, { a: 1, b: 2 })).toBe(false)
  expect(validAppendOnly({ a: 1, b: 2, c: 4 }, { a: 1, b: 2 })).toBe(false)
})
