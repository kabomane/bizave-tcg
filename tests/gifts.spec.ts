import { expect, test } from '@playwright/test'
import { createHash } from 'node:crypto'
import { GIFT_CODE_DOMAIN } from '../src/gifts/format'

// Synthetic catalogue supplied only to isolated browser contexts, never to the app build.
const codes = [
  { code: 'AAAAAAAAAAAAAAAA', reward: { type: 'booster', boosterId: 'phantom-blood', quantity: 10 } },
  { code: 'BBBBBBBBBBBBBBBB', reward: { type: 'booster', boosterId: 'anima-isekai', quantity: 10 } },
  { code: 'CCCCCCCCCCCCCCCC', reward: { type: 'fragments', amount: 500 } },
]
const catalogue = codes.map(({ code, reward }) => ({ codeHash: createHash('sha256').update(GIFT_CODE_DOMAIN + code).digest('hex'), reward }))

test.beforeEach(async ({ context }) => {
  await context.route(/\/src\/data\/gift-codes\.json(?:\?.*)?$/, route => route.fulfill({ contentType: 'application/javascript', body: `export default ${JSON.stringify(catalogue)}` }))
})

test('options : cadeaux, casse, erreurs et stock acheté, sans débordement mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/parametres')
  const input = page.getByRole('textbox', { name: 'Code cadeau', exact: true })
  const button = page.getByRole('button', { name: 'Utiliser', exact: true })
  const note = page.locator('#gift-note')
  await expect(button).toBeDisabled()
  await expect(note).toHaveText('Saisissez votre code pour recevoir votre cadeau.')
  await expect(input).toHaveAttribute('aria-describedby', 'gift-note')
  await expect(input).toHaveAttribute('maxlength', '19')
  await input.fill('A'.repeat(19))
  await expect(input).toHaveValue('A'.repeat(16))
  await input.press('End'); await input.pressSequentially('ZZZ')
  await expect(input).toHaveValue('A'.repeat(16))
  await input.fill('AAAA-AAAA-AAAA-AAAA')
  await input.press('End'); await input.pressSequentially('ZZZ')
  await expect(input).toHaveValue('AAAA-AAAA-AAAA-AAAA')
  await input.fill('AA')
  await input.press('End'); await input.pressSequentially(' A A ')
  await expect(input).toHaveValue('AAAA')
  await input.fill('aB01-@_é!🙂cD')
  await expect(input).toHaveValue('aB01-cD')
  await input.press('End'); await input.pressSequentially('_@! /+=.')
  await expect(input).toHaveValue('aB01-cD')
  await input.fill('')
  const paste = async (text: string) => input.evaluate((element, pasted) => {
    const event = new Event('paste', { bubbles: true, cancelable: true })
    Object.defineProperty(event, 'clipboardData', { value: { getData: () => pasted } })
    return !element.dispatchEvent(event)
  }, text)
  expect(await paste(' \t@_é🙂AAAA - AAAA - AAAA - AAAA\u00a0\n!')).toBe(true)
  await expect(input).toHaveValue('AAAA-AAAA-AAAA-AAAA')
  await input.fill('ZZZZ-AAAA-AAAA-AAAA')
  await input.evaluate(element => (element as HTMLInputElement).setSelectionRange(0, 4))
  expect(await paste(' A A A A ')).toBe(true)
  await expect(input).toHaveValue('AAAA-AAAA-AAAA-AAAA')
  const sending = await page.getByRole('heading', { name: 'Envoi des cartes' }).boundingBox()
  const gift = await page.getByRole('heading', { name: 'Code cadeau' }).boundingBox()
  expect(gift!.y).toBeGreaterThan(sending!.y + sending!.height)
  await input.fill('invalide'); await button.click()
  await expect(page.getByRole('alert')).toHaveText('Saisissez un code cadeau de 16 caractères.')
  await expect(note).toHaveAttribute('role', 'alert')
  await input.fill('ZZZZ-ZZZZ-ZZZZ-ZZZZ'); await button.click()
  await expect(page.getByRole('alert')).toHaveText('Ce code cadeau est invalide.')
  await expect(note).toHaveText('Ce code cadeau est invalide.')
  await expect(note.locator('..').locator('.settings-note')).toHaveCount(1)
  for (const [code, message] of [
    ['aaaa-aaaa-aaaa-aaaa', '10 boosters Memory Frame ajoutés à vos boosters.'],
    ['BBBB BBBB BBBB BBBB', '10 boosters Anima Isekai ajoutés à vos boosters.'],
    ['cccc-cccc-cccc-cccc', '500 fragments ajoutés.'],
  ]) {
    await input.fill(code); await button.click()
    await expect(page.getByRole('status')).toHaveText(message)
    await expect(note).toHaveText(message)
    await expect(input).toHaveValue('')
  }
  await expect(page.getByLabel('500 fragments', { exact: true })).toBeVisible()
  const state = await page.evaluate(async () => {
    const path = '/src/storage/database.ts', { db } = await import(path)
    return { player: await db.player.get('local'), stock: await db.boosterStock.toArray(), used: await db.usedGiftCodes.count(), purchases: await db.boosterPurchases.count() }
  })
  expect(state.player.fragments).toBe(500)
  expect(state.player.freePackStock).toBe(5)
  expect(state.stock).toEqual(expect.arrayContaining([expect.objectContaining({ boosterId: 'phantom-blood', quantity: 10 }), expect.objectContaining({ boosterId: 'anima-isekai', quantity: 10 })]))
  expect(state.used).toBe(3); expect(state.purchases).toBe(0)
  await page.reload()
  await input.fill('AAAA-AAAA-AAAA-AAAA'); await button.click()
  await expect(page.getByRole('alert')).toHaveText('Ce code cadeau a déjà été utilisé.')
  for (const width of [320, 390, 768, 1440]) {
    await page.setViewportSize({ width, height: 900 })
    await input.scrollIntoViewIfNeeded()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const fieldBox = await input.boundingBox(), buttonBox = await button.boundingBox()
    expect(Math.abs(fieldBox!.y - buttonBox!.y)).toBeLessThan(1)
    expect(fieldBox!.x + fieldBox!.width).toBeLessThan(buttonBox!.x)
    expect(Math.abs(fieldBox!.height - buttonBox!.height)).toBeLessThan(1)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await input.fill('')
  await expect(note).toHaveText('Saisissez votre code pour recevoir votre cadeau.')
  await page.screenshot({ path: `artifacts/codes-cadeaux-${test.info().project.name}.png`, fullPage: true })
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Ouvrir le booster Memory Frame', exact: true })).toBeEnabled()
  await expect(page.getByLabel('5 boosters disponibles sur 5')).toBeVisible()
  await expect(page.locator('.carousel-next')).toBeVisible()
})

test('deux onglets utilisent le même code sans doubler les fragments', async ({ page, context }) => {
  const other = await context.newPage()
  await page.goto('/parametres'); await other.goto('/parametres')
  await expect(page.getByRole('textbox', { name: 'Code cadeau' })).toBeVisible()
  await expect(other.getByRole('textbox', { name: 'Code cadeau' })).toBeVisible()
  const useCode = async (target: typeof page) => target.evaluate(async () => {
    const path = '/src/gifts/services.ts', { redeemGiftCode } = await import(path)
    try { await redeemGiftCode('CCCC-CCCC-CCCC-CCCC'); return 'ok' } catch { return 'refusé' }
  })
  expect((await Promise.all([useCode(page), useCode(other)])).sort()).toEqual(['ok', 'refusé'])
  await expect(page.getByLabel('500 fragments', { exact: true })).toBeVisible()
  await expect(other.getByLabel('500 fragments', { exact: true })).toBeVisible()
})
