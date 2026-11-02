import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

async function seed(page: Page) {
  await page.goto('/collection')
  await expect(page.getByRole('heading', { name: 'Collection', exact: true })).toBeVisible()
  await page.evaluate(async () => {
    const path = '/src/storage/database.ts', { db } = await import(path)
    await db.drops.add({ dropId: 'loading-preview', cardId: 'bb-eli', finish: 'normal', artVariant: 'standard', status: 'owned', acquiredAt: 1, updatedAt: 1 })
  })
}

async function holdDecode(page: Page) {
  await page.addInitScript(() => {
    const decode = HTMLImageElement.prototype.decode
    HTMLImageElement.prototype.decode = function () {
      if (!this.closest('.card-viewer')) return decode.call(this)
      const calls = JSON.parse(sessionStorage.getItem('viewer-decodes') || '[]') as string[]
      sessionStorage.setItem('viewer-decodes', JSON.stringify([...calls, this.getAttribute('src')]))
      return new Promise<void>((resolve, reject) => document.addEventListener('release-viewer-image', () => { void decode.call(this).then(resolve, reject) }, { once: true }))
    }
  })
}

test('Aperçu : placeholder immédiat, fondu après décodage et aucune variation de taille', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' })
  await holdDecode(page); await seed(page)
  const tile = page.locator('.collection-grid .card')
  await tile.click()
  const shell = page.locator('.viewer-slide.is-current .viewer-card-shell'), placeholder = shell.locator('.viewer-card-placeholder'), face = shell.locator('.viewer-card-face')
  await expect(shell).toHaveAttribute('aria-busy', 'true')
  await expect(placeholder).toBeVisible(); await expect(face).toHaveCSS('opacity', '0')
  await expect(placeholder).toBeEmpty()
  expect(await placeholder.evaluate(el => getComputedStyle(el, '::after').animationName)).toBe('viewerPlaceholderSweep')
  await expect(face).toHaveAttribute('inert', '')
  const before = await shell.boundingBox()
  await page.screenshot({ path: `artifacts/apercu-placeholder-${test.info().project.name}.png` })
  await page.evaluate(() => document.dispatchEvent(new Event('release-viewer-image')))
  await expect(shell).toHaveAttribute('aria-busy', 'false')
  await expect(face).toHaveCSS('opacity', '1'); await expect(placeholder).toBeHidden()
  await expect(face).not.toHaveAttribute('inert')
  const after = await shell.boundingBox()
  expect(Math.abs(before!.width - after!.width)).toBeLessThan(.5)
  expect(Math.abs(before!.height - after!.height)).toBeLessThan(.5)
  await page.getByRole('button', { name: 'Fermer', exact: true }).click()
  await expect(tile).toBeFocused()
})

test('Aperçu : aucun flash de skeleton au swipe ni au retour sur une carte démontée', async ({ page }) => {
  test.setTimeout(90_000)
  await page.setViewportSize({ width: 390, height: 844 })
  await holdDecode(page)
  await page.goto('/collection')
  await expect(page.getByRole('heading', { name: 'Collection', exact: true })).toBeVisible()
  await page.evaluate(async () => {
    const path = '/src/storage/database.ts', settings = '/src/settings/useSettings.ts'
    const { db } = await import(path), { updateSettings } = await import(settings)
    updateSettings({ collectionDisplay: { groupBy: 'card', duplicates: 'hide', sort: 'rarity', direction: 'asc', pileCover: 'leastRare' } })
    await db.drops.bulkAdd(['standard', 'fullArt'].flatMap(artVariant => ['normal', 'glossy', 'alternative'].map((finish, i) => ({
      dropId: `swipe-${artVariant}-${finish}`, cardId: 'bb-eli', artVariant, finish, status: 'owned', acquiredAt: i + 1, updatedAt: i + 1,
    }))))
  })
  await page.reload(); await page.locator('.collection-pile .card').click()
  const slides = page.locator('.viewer-slide'), active = page.locator('.viewer-slide.is-current .viewer-card-shell')
  await expect(slides.nth(0)).toHaveClass(/is-current/)
  await expect(slides.nth(1).locator('.viewer-card-shell')).toHaveAttribute('data-ready', 'false')
  await page.evaluate(() => document.dispatchEvent(new Event('release-viewer-image')))
  for (const i of [0, 1]) await expect(slides.nth(i).locator('.viewer-card-face')).toHaveCSS('opacity', '1')
  const source = await active.locator('.custom-art').getAttribute('src')
  const decodeCount = await page.evaluate(source => (JSON.parse(sessionStorage.getItem('viewer-decodes')!) as string[]).filter(value => value === source).length, source)
  // Sample every painted frame, including promotion from thumbnail to detail and
  // remounting after a slide leaves the three-card rendering window.
  await page.locator('.viewer-track').evaluate((track, source) => {
    sessionStorage.setItem('viewer-loaded-flashes', '0')
    const inspect = () => {
      for (const shell of track.querySelectorAll<HTMLElement>('.viewer-card-shell')) {
        if (shell.querySelector('img')?.getAttribute('src') === source && (shell.dataset.ready !== 'true' || getComputedStyle(shell.querySelector('.viewer-card-face')!).opacity !== '1')) {
          sessionStorage.setItem('viewer-loaded-flashes', String(Number(sessionStorage.getItem('viewer-loaded-flashes')) + 1))
        }
      }
      if (track.isConnected) requestAnimationFrame(inspect)
    }
    requestAnimationFrame(inspect)
  }, source)
  for (const i of [1, 2]) {
    await page.getByRole('button', { name: 'Carte suivante', exact: true }).click()
    await expect(slides.nth(i)).toHaveClass(/is-current/)
    await expect(active).toHaveAttribute('data-ready', 'true')
  }
  await expect(slides.nth(0).locator('.viewer-card-shell')).toHaveCount(0)
  for (const i of [1, 0]) {
    await page.getByRole('button', { name: 'Carte précédente', exact: true }).click()
    await expect(slides.nth(i)).toHaveClass(/is-current/)
    await expect(active).toHaveAttribute('data-ready', 'true')
  }
  // All six finishes/layouts share this illustration: changing the card layout
  // must not start a second loading cycle either.
  for (const i of [1, 2, 3, 4, 5]) {
    await page.getByRole('button', { name: 'Carte suivante', exact: true }).click()
    await expect(slides.nth(i)).toHaveClass(/is-current/)
    await expect(active).toHaveAttribute('data-ready', 'true')
  }
  expect(await page.evaluate(source => (JSON.parse(sessionStorage.getItem('viewer-decodes')!) as string[]).filter(value => value === source).length, source)).toBe(decodeCount)
  expect(await page.evaluate(() => Number(sessionStorage.getItem('viewer-loaded-flashes')))).toBe(0)
  await page.getByRole('button', { name: 'Fermer', exact: true }).click()
})

test('Aperçu : mouvement réduit respecté et image en échec sans chargement infini', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await holdDecode(page)
  await page.route('**/assets/cards/bb-eli/**', route => route.abort())
  await seed(page); await page.locator('.collection-grid .card').click()
  const shell = page.locator('.viewer-slide.is-current .viewer-card-shell')
  await expect(shell).toHaveAttribute('aria-busy', 'true')
  expect(await shell.locator('.viewer-card-placeholder').evaluate(el => getComputedStyle(el, '::after').animationName)).toBe('none')
  await expect(shell.locator('.viewer-card-face')).toHaveCSS('transition-duration', '0s')
  await page.evaluate(() => document.dispatchEvent(new Event('release-viewer-image')))
  await expect(shell).toHaveAttribute('aria-busy', 'false')
  await expect(shell.locator('.nb-title')).toHaveText('Eli Kano')
  await expect(shell.locator('.viewer-card-placeholder')).toBeHidden()
  await page.getByRole('button', { name: 'Fermer', exact: true }).click()
  await expect(page.locator('.card-viewer')).toHaveCount(0)
})

test('Navigation mobile : fond à 94 % et flou réduit dans les deux thèmes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/collection')
  const nav = page.getByRole('navigation', { name: 'Navigation mobile' })
  for (const theme of ['light', 'dark'] as const) {
    await page.emulateMedia({ colorScheme: theme })
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
    await expect(nav).toBeVisible(); await expect(nav).toHaveCSS('backdrop-filter', 'blur(8px)')
    expect(await nav.evaluate(el => getComputedStyle(el).backgroundColor)).toContain('0.94')
    await page.screenshot({ path: `artifacts/navigation-opaque-${theme}-${test.info().project.name}.png` })
  }
})
