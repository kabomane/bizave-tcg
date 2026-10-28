import { expect, test } from '@playwright/test'

test.use({ deviceScaleFactor: 3 })

test('les miniatures holo gardent leur irisation et un seul reflet, avec ou sans réduction des animations', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setViewportSize({ width: 1440, height: 1100 })
  await page.goto('/parametres')
  await page.getByRole('switch', { name: 'Mode dev' }).click()
  await page.getByRole('link', { name: 'Collection', exact: true }).click()
  await page.getByRole('searchbox').fill('Thomas classique')
  await expect(page.locator('.collection-grid > .collection-item')).toHaveCount(6)
  const holos = page.locator('.collection-grid .card.glossy')
  await expect(holos).toHaveCount(2)
  await expect(page.locator('.card-thumbnail .holo, .card-thumbnail .sparkle, .card-thumbnail .foil-frame')).toHaveCount(0)
  await expect(holos.first().locator('.holo-preview-reflection')).toHaveCSS('animation-name', 'holoPreviewSweep')
  const textures = await holos.locator('.holo-preview').evaluateAll(elements => elements.map(el => getComputedStyle(el).backgroundImage))
  expect(new Set(textures).size).toBe(1)
  expect(textures[0]).toMatch(/holo-preview.*\.webp/)
  expect(await page.evaluate(() => performance.getEntriesByType('resource').filter(entry => /holo-preview.*\.webp/.test(entry.name) && !new URL(entry.name).searchParams.has('import')).length)).toBe(1)
  expect(await holos.evaluateAll(elements => elements.every(card => [...card.querySelectorAll('*')].every(el => {
    const style = getComputedStyle(el)
    return style.filter === 'none' && (!style.backdropFilter || style.backdropFilter === 'none') && style.maskImage === 'none'
  })))).toBe(true)

  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const holo of await holos.all()) {
    await expect(holo.locator('.holo-preview-reflection')).toHaveCSS('animation-name', 'none')
    await expect(holo.locator('.holo-preview')).toBeVisible()
    await expect(holo.locator('.holo-preview-frame')).toBeVisible()
  }
  expect(await holos.locator('.holo-preview').evaluateAll(elements => elements.map(el => getComputedStyle(el).backgroundImage))).toEqual(textures)
  await page.locator('.collection-grid').screenshot({ path: `artifacts/holo-reduced-${test.info().project.name}.png` })

  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await holos.first().press('Enter')
  const dialog = page.getByRole('dialog')
  await expect(dialog.locator('.card')).toHaveAttribute('data-presentation', 'detail')
  await expect(dialog.locator('.holo')).toHaveCount(1)
  await expect(dialog.locator('.sparkle')).toHaveCount(3)
  await expect(dialog.locator('.foil-frame')).toHaveCount(1)
  await expect(dialog.locator('.holo')).toHaveCSS('animation-name', 'holographicIdle')
  await expect(holos.first().locator('.holo-preview-reflection')).toHaveCSS('display', 'none')
  await expect(holos.first().locator('.holo-preview-reflection')).toHaveCSS('animation-name', 'none')
  await dialog.locator('.card').press('ArrowRight')
  await expect.poll(() => dialog.locator('.card').evaluate(el => parseFloat((el as HTMLElement).style.getPropertyValue('--ry')) || 0)).toBeGreaterThan(0)
  expect(await dialog.locator('.card').evaluate(el => Math.hypot(parseFloat((el as HTMLElement).style.getPropertyValue('--rx')) || 0, parseFloat((el as HTMLElement).style.getPropertyValue('--ry')) || 0))).toBeLessThanOrEqual(20)
  await dialog.getByRole('button', { name: 'Fermer', exact: true }).click()
  await expect(holos.first().locator('.holo-preview-reflection')).toHaveCSS('animation-name', 'holoPreviewSweep')
})

test('111 cartes : longs défilements, piles holo et retours au détail sans accumuler les effets', async ({ page }) => {
  test.setTimeout(90_000)
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  await page.setViewportSize({ width: 393, height: 852 })
  const errors: string[] = []
  let crashed = false
  page.on('pageerror', error => errors.push(error.message))
  page.on('crash', () => { crashed = true })
  await page.goto('/collection')
  await expect(page.getByRole('heading', { name: 'La première vous attend.' })).toBeVisible()
  const before = await page.evaluate(async () => {
    const databasePath = '/src/storage/database.ts', cardsPath = '/src/data/cards.ts', settingsPath = '/src/settings/useSettings.ts'
    const { db } = await import(databasePath), { cards } = await import(cardsPath), { updateSettings } = await import(settingsPath)
    updateSettings({ collectionDisplay: { sort: 'number', direction: 'asc', groupBy: 'card', duplicates: 'hide' } })
    const rows = cards.slice(0, 75).flatMap((card: { id: string }, index: number) => Array.from({ length: index < 72 && index % 2 === 0 ? 2 : 1 }, (_, variant) => ({
      dropId: crypto.randomUUID(), cardId: card.id, finish: variant ? 'alternative' : 'glossy', artVariant: Math.floor(index / 2) % 2 ? 'fullArt' : 'standard', status: 'owned', acquiredAt: index, updatedAt: index,
    })))
    await db.drops.bulkAdd(rows)
    return JSON.stringify(await db.drops.orderBy('dropId').toArray())
  })
  const items = page.locator('.collection-grid:not(.stack-grid) > .collection-item')
  await expect(items).toHaveCount(75)
  await expect(page.locator('.title-with-count > span')).toHaveText('111')

  for (const [index, slow] of [[56, true], [66, false], [8, false], [64, true]] as const) {
    await page.evaluate(async ({ index, slow }) => {
      const item = document.querySelectorAll('.collection-grid:not(.stack-grid) > .collection-item')[index]
      const target = item.getBoundingClientRect().top + scrollY - 160
      if (slow) {
        const start = scrollY, steps = 12
        for (let step = 1; step <= steps; step++) {
          window.scrollTo(0, start + (target - start) * step / steps)
          await new Promise(resolve => requestAnimationFrame(resolve))
        }
      } else window.scrollTo(0, target)
    }, { index, slow })
    const cover = items.nth(index).locator('.card.glossy')
    await expect(cover).toBeVisible()
    await cover.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.locator('.stack-grid .card')).toHaveCount(2)
    await expect(dialog.locator('.holo-preview')).toHaveCount(1)
    await expect(dialog.locator('.holo-preview-reflection')).toHaveCSS('animation-name', 'holoPreviewSweep')
    await expect(page.locator('.card-thumbnail .holo, .card-thumbnail .sparkle, .card-thumbnail .foil-frame')).toHaveCount(0)
    expect(await page.locator('.collection-grid:not(.stack-grid) .holo-preview-reflection').evaluateAll(elements => elements.every(el => getComputedStyle(el).animationName === 'none'))).toBe(true)
    expect(await page.locator('.collection-grid:not(.stack-grid) .card').count()).toBeLessThan(24)
    await dialog.locator('.card.glossy').press('Space')
    await expect(dialog.locator('.card')).toHaveAttribute('data-presentation', 'detail')
    await expect(dialog.locator('.holo')).toHaveCount(1)
    await dialog.getByRole('button', { name: 'Retour à la pile' }).click()
    await expect(dialog.locator('.stack-grid .card')).toHaveCount(2)
    await dialog.getByRole('button', { name: 'Fermer', exact: true }).click()
    await expect(cover).toBeVisible()
  }
  const after = await page.evaluate(async () => {
    const modulePath = '/src/storage/database.ts'
    const { db } = await import(modulePath)
    return JSON.stringify(await db.drops.orderBy('dropId').toArray())
  })
  expect(after).toBe(before)
  expect(errors).toEqual([])
  expect(crashed).toBe(false)
})
