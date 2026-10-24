import { describe, expect, it } from 'vitest'
import { matchesCardSearch } from './cardSearch'

describe('recherche de cartes', () => {
  const card = { title: 'Matthieu étudiant', description: 'Anglais au Québec' }
  it('cherche dans le titre et la description, sans tenir compte des accents ou de la casse', () => {
    expect(matchesCardSearch(card, 'ETUDIANT')).toBe(true)
    expect(matchesCardSearch(card, 'quebec')).toBe(true)
    expect(matchesCardSearch(card, 'matthieu anglais')).toBe(true)
  })
  it('accepte une recherche vide et normalise les espaces', () => {
    expect(matchesCardSearch(card, '   ')).toBe(true)
    expect(matchesCardSearch(card, ' Matthieu   Québec ')).toBe(true)
  })
  it('exige que tous les termes soient présents', () => {
    expect(matchesCardSearch(card, 'Matthieu Japon')).toBe(false)
    expect(matchesCardSearch(card, 'inconnue')).toBe(false)
  })
})
