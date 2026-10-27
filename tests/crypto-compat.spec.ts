import { expect, firefox, test, webkit, type Page } from '@playwright/test'

async function ownCode(page: Page) {
  return page.evaluate(async () => { const path = '/src/exchanges/services.ts'; return (await import(path)).ownContact() })
}
async function deviceId(page: Page) {
  return page.evaluate(async () => { const path = '/src/storage/installation.ts'; return (await (await import(path)).ensureInstallation()).installationId })
}
async function exportTo(page: Page, id: string) {
  return page.evaluate(async id => {
    const path = '/src/storage/saveTransfer.ts', preferencesPath = '/src/settings/preferences.ts'
    return (await import(path)).exportSave(id, (await import(preferencesPath)).DEFAULT_PREFERENCES)
  }, id)
}
async function importFile(page: Page, file: string) {
  await page.evaluate(async file => { const path = '/src/storage/saveTransfer.ts'; await (await import(path)).importSave(file) }, file)
  await page.reload()
  await expect(page.getByTestId('player-id')).toHaveText(/^\d{4}-\d{2}-\d{2}$/)
}

test('identité et amis conservés de Firefox à Chromium puis WebKit', async ({ page, baseURL }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium', 'Ce test pilote lui-même les trois moteurs.')
  test.setTimeout(90_000)
  const firefoxBrowser = await firefox.launch(), webkitBrowser = await webkit.launch()
  try {
    const source = await firefoxBrowser.newPage(), friend = await firefoxBrowser.newPage(), last = await webkitBrowser.newPage()
    for (const tab of [source, friend, page, last]) {
      await tab.goto(baseURL + '/parametres')
      await expect(tab.getByTestId('player-id')).toHaveText(/^\d{4}-\d{2}-\d{2}$/)
    }
    const sourceCode = await ownCode(source), friendCode = await ownCode(friend)
    const sourceId = await source.getByTestId('player-id').innerText()
    for (const [tab, code] of [[source, friendCode], [friend, sourceCode]] as const) {
      await tab.evaluate(async code => { const path = '/src/exchanges/services.ts'; await (await import(path)).addContact(code, 'Ami') }, code)
    }
    const chromiumDevice = await deviceId(page), webkitDevice = await deviceId(last)
    await importFile(page, await exportTo(source, chromiumDevice))
    expect(await ownCode(page)).toBe(sourceCode)
    expect(await deviceId(page)).toBe(chromiumDevice)
    await importFile(last, await exportTo(page, webkitDevice))
    expect(await ownCode(last)).toBe(sourceCode)
    expect(await deviceId(last)).toBe(webkitDevice)
    const transfer = await friend.evaluate(async sourceId => {
      const servicesPath = '/src/exchanges/services.ts', dbPath = '/src/storage/database.ts', gamePath = '/src/storage/services.ts'
      const services = await import(servicesPath), { db } = await import(dbPath), game = await import(gamePath)
      const opening = await game.openBooster('phantom-blood'); await game.finishOpening(opening.id)
      return services.sendTransfer((await db.drops.toArray())[0].dropId, sourceId)
    }, sourceId)
    await last.evaluate(async code => { const path = '/src/exchanges/services.ts'; await (await import(path)).receiveTransfer(code) }, transfer.code)
    const returned = await last.evaluate(async dropId => {
      const servicesPath = '/src/exchanges/services.ts', dbPath = '/src/storage/database.ts'
      const services = await import(servicesPath), { db } = await import(dbPath)
      return services.sendTransfer(dropId, (await db.friends.toArray())[0].playerUuid)
    }, transfer.dropId)
    await friend.evaluate(async code => { const path = '/src/exchanges/services.ts'; await (await import(path)).receiveTransfer(code) }, returned.code)
    expect(await ownCode(friend)).toBe(friendCode)
  } finally { await firefoxBrowser.close(); await webkitBrowser.close() }
})
