import { describe, expect, it } from 'vitest'
import { existsSync, readdirSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import catalogue from './catalogue.json'
import order from './card-order.json'

const directory = resolve('public/assets/cards')
const references = new Set(catalogue.flatMap(card => Object.values(card.artwork)))
const walk = (dir: string): string[] => readdirSync(dir, { withFileTypes: true }).flatMap(entry => entry.isDirectory() ? walk(join(dir, entry.name)) : [join(dir, entry.name)])

describe('assets publiés', () => {
  it('résout les deux formats de toutes les cartes', () => {
    for (const url of references) expect(existsSync(resolve('public', url.slice(1))), url).toBe(true)
  })
  it('ne conserve aucun dossier retiré du catalogue', () => {
    const ids = new Set(catalogue.map(card => card.id))
    expect(readdirSync(directory, { withFileTypes: true }).filter(entry => !entry.isDirectory() || !ids.has(entry.name)).map(entry => entry.name)).toEqual([])
  })
  it('ne publie aucun PNG ni aucun fichier orphelin', () => {
    const files = walk(directory)
    expect(files.filter(file => /\.png$/i.test(file))).toEqual([])
    expect(files.map(file => '/assets/cards/' + relative(directory, file).replaceAll('\\', '/')).filter(url => !references.has(url))).toEqual([])
  })
  it('attribue exactement une position à chaque carte du catalogue', () => {
    expect(new Set(order).size).toBe(order.length)
    expect([...order].sort()).toEqual(catalogue.map(card => card.id).sort())
  })
})
