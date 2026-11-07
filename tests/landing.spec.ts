import { expect, test } from '@playwright/test'

test('la landing affiche les cartes et la boutique sans créer de partie', async ({ page }) => {
  const artworkRequests: string[] = []
  page.on('request', request => { if (request.url().includes('/assets/cards/')) artworkRequests.push(request.url()) })
  const response = await page.goto('/landing')
  expect(response?.status()).toBe(200)
  await expect(page).toHaveTitle('Découvrir bizave TCG')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow, noarchive')
  await expect(page.getByRole('checkbox', { name: 'Afficher les vraies cartes' })).toHaveCount(0)
  await expect(page.locator('.cs > .card-scale')).toHaveCount(24)
  await expect(page.locator('.fan .alternative .gold-frame')).toHaveCount(1)
  await expect(page.locator('.fan .glossy .holo')).toHaveCount(1)
  await expect(page.locator('.fan .cs[aria-label="Thomas BIZAVE, Légendaire, Alternative"]')).toBeVisible()
  await expect(page.getByRole('img', { name: 'Ciel bleu, Rare, Mate', exact: true })).toBeVisible()
  await expect(page.getByRole('img', { name: 'Le bus, Commune, Mate', exact: true })).toBeVisible()
  await expect.poll(() => artworkRequests.some(url => url.includes('/ciel-bleu/'))).toBe(true)
  await expect(page.getByRole('img', { name: 'Booster lucky boost', exact: true })).toBeVisible()
  await expect(page.locator('.weekly-offers')).toContainText('reroll à 150 fragments')
  await expect(page.locator('.booster-pack[data-booster="phantom-blood"]')).toContainText('168 cartes')
  const gem = page.locator('.values-row svg').first()
  await expect(gem).toHaveAttribute('viewBox', '0 0 24 24')
  expect(await gem.locator('use').evaluate(element => (element as SVGUseElement).getBBox().width)).toBeGreaterThan(0)
  expect(await page.evaluate(async () => (await indexedDB.databases()).length)).toBe(0)
  await expect(page.getByRole('link', { name: 'Découvrir le jeu' })).toHaveCount(2)
})

test('la landing tient sur mobile et suit le thème système', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 })
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' })
  await page.goto('/landing/?source=amis')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Des souvenirs')
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(25, 26, 28)')
  for (const selector of ['.hero', '.filters', '.grid', '.device', '.weekly-shop-preview', '.shop', '.share', 'footer']) {
    await page.locator(selector).scrollIntoViewIfNeeded()
    const bounds = await page.locator(selector).boundingBox()
    expect(bounds).not.toBeNull()
    expect(bounds!.x).toBeGreaterThanOrEqual(0)
    expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(320)
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBe(320)
  await page.emulateMedia({ colorScheme: 'light', reducedMotion: 'reduce' })
  await expect(page.locator('body')).toHaveCSS('background-color', 'rgb(243, 241, 235)')
})

test('sans JavaScript, les cartes et le lien vers le jeu restent accessibles', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ baseURL, javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/landing')
  await expect(page.getByRole('img', { name: 'Ciel bleu, Rare, Mate', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Découvrir le jeu' }).first()).toBeVisible()
  await context.close()
})
