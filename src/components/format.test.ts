import { afterEach, describe, expect, it, vi } from 'vitest'
import { copyPromisedText } from './format'

afterEach(() => vi.unstubAllGlobals())
describe('copie créée pendant le geste utilisateur', () => {
  it('appelle le presse-papiers avant la fin du transfert asynchrone', async () => {
    class DeferredItem {
      constructor(readonly values: Record<string, Promise<Blob>>) {}
    }
    const write = vi.fn(async (items: DeferredItem[]) => {
      const blob = await items[0].values['text/plain']
      expect(await blob.text()).toBe('TR1.code-transfert')
    })
    vi.stubGlobal('ClipboardItem', DeferredItem)
    vi.stubGlobal('navigator', { clipboard: { write } })
    let finish!: (text: string) => void
    const text = new Promise<string>(resolve => { finish = resolve })
    const copying = copyPromisedText(text)
    expect(write).toHaveBeenCalledOnce()
    finish('TR1.code-transfert')
    await copying
  })
  it('utilise writeText si le navigateur ne propose pas ClipboardItem', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('ClipboardItem', undefined)
    vi.stubGlobal('navigator', { clipboard: { writeText } })
    await copyPromisedText(Promise.resolve('TR1.fallback'))
    expect(writeText).toHaveBeenCalledWith('TR1.fallback')
  })
})
