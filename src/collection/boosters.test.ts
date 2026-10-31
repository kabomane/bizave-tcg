import { describe, expect, it } from 'vitest'
import { cards } from '../data/cards'
import { boosters } from '../data/boosters'
import { collectionBoosters, selectedBoosterCardIds } from './boosters'

const editions = [
  { ...boosters[0], id: 'first', title: 'Première édition', order: 1, sources: [{ type: 'cards' as const, cardIds: ['t-classique', 'm-classique'] }] },
  { ...boosters[0], id: 'second', title: 'Deuxième édition', order: 0, sources: [{ type: 'cards' as const, cardIds: ['m-classique', 't-voyageur'] }] },
]

describe('filtre de collection par booster', () => {
  it('propose les éditions actives dans leur ordre, sans ajouter de booster publié', () => {
    const options = collectionBoosters([...editions, { ...editions[0], id: 'disabled', enabled: false }], cards)
    expect(options.map(option => option.id)).toEqual(['second', 'first'])
    expect(collectionBoosters(boosters, cards).map(booster => booster.id)).toEqual(['phantom-blood', 'anima-isekai'])
    expect(boosters).toHaveLength(4)
  })
  it('filtre sur les modèles du pool, indépendamment du groupe et de la provenance', () => {
    const options = collectionBoosters(editions, cards)
    const selected = selectedBoosterCardIds(options, ['first'])!
    expect([...selected].sort()).toEqual(['m-classique', 't-classique'])
    expect(selected.has('t-voyageur')).toBe(false)
    expect(selectedBoosterCardIds(options, [])).toBeNull()
  })
  it('réunit les éditions sélectionnées sans doubler les cartes partagées', () => {
    const options = collectionBoosters(editions, cards)
    expect([...selectedBoosterCardIds(options, ['first', 'second', 'first'])!].sort()).toEqual(['m-classique', 't-classique', 't-voyageur'])
  })
})
