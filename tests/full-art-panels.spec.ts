import { expect, test } from '@playwright/test'

test('les encarts Full Art ont le même fond sans flou en miniature et en aperçu', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/collection')
  await expect(page.getByRole('heading', { name: 'Collection', exact: true })).toBeVisible()
  await page.evaluate(async () => {
    const path = '/src/storage/database.ts', { db } = await import(path)
    await db.drops.bulkAdd(['normal', 'glossy', 'alternative'].map((finish, index) => ({
      dropId: crypto.randomUUID(), cardId: 'eli-bouffonne', finish, artVariant: 'fullArt',
      status: 'owned', acquiredAt: index + 1, updatedAt: index + 1,
    })))
  })
  const grid = page.locator('.collection-grid').first()
  await expect(grid.locator('.card')).toHaveCount(3)
  for (const finish of ['standard', 'glossy', 'alternative']) {
    const thumbnail = grid.locator(`.card.${finish}`)
    const readPanels = (card: Element) => ['.nb-title', '.card-info'].map(selector => {
      const style = getComputedStyle(card.querySelector(selector)!)
      return { color: style.backgroundColor, image: style.backgroundImage, opacity: style.opacity, blur: style.backdropFilter, prefixedBlur: style.getPropertyValue('-webkit-backdrop-filter') }
    })
    const miniature = await thumbnail.evaluate(readPanels)
    await thumbnail.click()
    const dialog = page.getByRole('dialog')
    const detail = dialog.locator('.card')
    const enlarged = await detail.evaluate(readPanels)
    expect(enlarged).toEqual(miniature)
    for (const panel of enlarged) {
      expect(panel.blur).toBe('none')
      expect(['', 'none']).toContain(panel.prefixedBlur)
      expect(panel.opacity).toBe('1')
      if (finish !== 'alternative') {
        expect(panel.color).toMatch(/, 0\.75\)$/)
        expect(panel.image).toBe('none')
      }
    }
    await detail.press('ArrowRight')
    expect(await detail.evaluate(readPanels)).toEqual(enlarged)
    await dialog.getByRole('button', { name: 'Fermer', exact: true }).click()
  }
})
