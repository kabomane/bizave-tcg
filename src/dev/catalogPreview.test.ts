import { expect, it } from 'vitest'
import { cards } from '../data/cards'
import { variantKey } from '../game/engine'
import { createCatalogPreview } from './catalogPreview'

it('prévisualise toutes les variantes sans identifiant de possession ni mutation du catalogue', () => {
  const before = JSON.stringify(cards)
  const preview = createCatalogPreview()
  expect(preview).toHaveLength(cards.length * 6)
  expect(new Set(preview.map(group => variantKey(group.card))).size).toBe(preview.length)
  expect(preview.every(group => !group.ids.length && !group.card.dropId)).toBe(true)
  preview[0].card.cardId = 'modified-preview'
  preview[0].ids.push('fake-id')
  expect(createCatalogPreview()[0].ids).toEqual([])
  expect(JSON.stringify(cards)).toBe(before)
})
