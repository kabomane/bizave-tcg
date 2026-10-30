import { afterEach, beforeEach, expect, it } from 'vitest'
import { BizaveDatabase } from '../database'
import { initializeDatabase, openBooster } from '../services'
import { exportSave, importSave, parseSaveFile } from '../saveTransfer'
import { addContact, ensureIdentity, ownContact, receiveTransfer, sendTransfer } from '../../exchanges/services'
import { ensureInstallation } from '../installation'
import { DEFAULT_PREFERENCES } from '../../settings/preferences'
import { cardById } from '../../data/cards'
import { uuid, variantKey } from '../../game/engine'
import { patchSoireeFilm3Rarity } from './soireeFilm3Rarity'

let source: BizaveDatabase, target: BizaveDatabase
beforeEach(async () => {
  source = new BizaveDatabase('rarity-source-' + uuid())
  target = new BizaveDatabase('rarity-target-' + uuid())
  await initializeDatabase(source, 0); await initializeDatabase(target, 0)
})
afterEach(async () => { await source.delete(); await target.delete() })

it('normalise uniquement Rare → Peu commune pour Soirée film #3 sans muter la source', () => {
  const current = cardById.get('soiree-film-3')!
  const legacy = { ...current, rarity: 'rare' as const }
  expect(patchSoireeFilm3Rarity(legacy)).toEqual(current)
  expect(legacy.rarity).toBe('rare')
  expect(patchSoireeFilm3Rarity(current)).toBe(current)
  for (const rarity of ['common', 'epic', 'legendary'] as const) {
    const other = { ...current, rarity }
    expect(patchSoireeFilm3Rarity(other)).toBe(other)
  }
  const other = { ...legacy, id: 't-etudiant' }
  expect(patchSoireeFilm3Rarity(other)).toBe(other)
})

it('répare une sauvegarde locale et reste idempotent sans changer aucune autre table', async () => {
  const opening = await openBooster('phantom-blood', source, 0)
  await ensureIdentity(source)
  const card = { dropId: uuid(), cardId: 'soiree-film-3', finish: 'alternative' as const, artVariant: 'fullArt' as const }
  await source.drops.add({ ...card, acquiredAt: 0, updatedAt: 0, status: 'owned' })
  await source.favorites.add({ ...card, key: variantKey(card) })
  await source.player.update('local', { fragments: 273 })
  await source.definitions.update('soiree-film-3', { rarity: 'rare' })
  const snapshot = async () => Promise.all(source.tables.filter(t => t.name !== 'definitions').map(t => t.toArray()))
  const before = await snapshot()
  await initializeDatabase(source, 0)
  expect((await source.definitions.get(card.cardId))?.rarity).toBe('uncommon')
  expect(await snapshot()).toEqual(before)
  expect((await source.openings.get(opening.id))?.results).toEqual(opening.results)
  await initializeDatabase(source, 0)
  expect(await snapshot()).toEqual(before)
})

it('conserve le blocage des autres changements et annule toute la transaction', async () => {
  await source.definitions.update('soiree-film-3', { rarity: 'rare' })
  await source.definitions.update('t-classique', { rarity: 'rare' })
  await expect(initializeDatabase(source, 0)).rejects.toThrow('la rareté de t-classique est immuable')
  expect((await source.definitions.get('soiree-film-3'))?.rarity).toBe('rare')
  await source.definitions.put(cardById.get('t-classique')!)
  await source.definitions.update('soiree-film-3', { rarity: 'epic' })
  await expect(initializeDatabase(source, 0)).rejects.toThrow('la rareté de soiree-film-3 est immuable')
})

it('importe un ancien fichier signé sans réécrire sa charge utile et persiste la correction', async () => {
  await ensureIdentity(source)
  await source.definitions.update('soiree-film-3', { rarity: 'rare' })
  const card = { dropId: uuid(), cardId: 'soiree-film-3', finish: 'glossy' as const, artVariant: 'fullArt' as const, acquiredAt: 0, updatedAt: 0, status: 'owned' as const }
  await source.drops.add(card)
  const contents = await exportSave((await ensureInstallation(target)).installationId, DEFAULT_PREFERENCES, source)
  const parsed = await parseSaveFile(contents)
  expect(parsed.contents).toBe(contents)
  expect(parsed.payload.tables.definitions.find(c => c.id === card.cardId)?.rarity).toBe('rare')
  await importSave(contents, target)
  expect((await target.definitions.get(card.cardId))?.rarity).toBe('uncommon')
  expect(await target.drops.get(card.dropId)).toEqual(card)
  expect((await ensureIdentity(target)).playerUuid).toBe(parsed.payload.sourceId)
  await expect(importSave(contents, target)).rejects.toThrow(/déjà été importée/)
})

it('préserve un code de carte signé avant la correction et son antirejeu', async () => {
  await addContact(await ownContact(target), 'Destination', source)
  await addContact(await ownContact(source), 'Source', target)
  await source.definitions.update('soiree-film-3', { rarity: 'rare' })
  const card = { dropId: uuid(), cardId: 'soiree-film-3', finish: 'alternative' as const, artVariant: 'fullArt' as const, acquiredAt: 0, updatedAt: 0, status: 'owned' as const }
  await source.drops.add(card)
  const transfer = await sendTransfer(card.dropId, (await ensureIdentity(target)).playerUuid, source)
  await initializeDatabase(source, 0)
  await expect(receiveTransfer(transfer.code, target)).resolves.toMatchObject({ dropId: card.dropId, cardId: card.cardId, finish: card.finish, artVariant: card.artVariant })
  await expect(receiveTransfer(transfer.code, target)).rejects.toThrow(/déjà été utilisé/)
})
