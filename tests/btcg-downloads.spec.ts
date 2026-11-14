import { expect, test } from '@playwright/test'

test('cartes, fragments, collections et sauvegardes se téléchargent uniquement en .btcg', async ({ page }) => {
  await page.goto('/echanges')
  await expect(page.getByRole('heading', { name: 'Amis', exact: true })).toBeVisible()
  for (const kind of ['card', 'fragments', 'collection', 'save'] as const) {
    const pending = page.waitForEvent('download')
    const types = await page.evaluate(async kind => {
      const transferPath = '/src/exchanges/transferFile.ts', collectionPath = '/src/collection/collectionFile.ts', savePath = '/src/storage/saveTransfer.ts'
      const types: string[] = [], original = URL.createObjectURL
      URL.createObjectURL = object => { if (object instanceof Blob) types.push(object.type); return original.call(URL, object) }
      try {
        if (kind === 'collection') (await import(collectionPath)).downloadCollectionFile('CL2.00', '1234-56-78', 1_700_000_000)
        else if (kind === 'save') (await import(savePath)).downloadSaveFile('{"extension":"check"}', 'extension-check')
        else (await import(transferPath)).downloadTransferFile({ code: kind === 'card' ? 'TR3.00' : 'TF2.00', transferId: 'extension-check' })
        return types
      } finally { URL.createObjectURL = original }
    }, kind)
    const download = await pending
    expect(download.suggestedFilename()).toMatch(/^[^.]+\.btcg$/)
    expect(types).toEqual(['application/octet-stream'])
    expect(await download.failure()).toBeNull()
  }
})
