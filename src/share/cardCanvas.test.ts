import { expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { R } from './cardCanvas'

it('garde la palette Canvas alignée sur chaque rareté CSS', () => {
  const css = readFileSync('src/styles/cards-reference.css', 'utf8')
  for (const [rarity, palette] of Object.entries(R)) {
    const block = css.match(new RegExp(`\\.card\\[data-rarity=${rarity}\\]\\s*\\{([^}]+)`))?.[1]
    expect(block, rarity).toBeDefined()
    for (const key of ['info', 'f1', 'f2', 'f3'] as const) expect(block?.match(new RegExp(`--r-${key}:\\s*([^;]+)`))?.[1]).toBe(palette[key])
    for (const color of palette.metal) expect(block).toContain(color)
  }
})
