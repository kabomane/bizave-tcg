import { afterEach, expect, it, vi } from 'vitest'
import { preloadImages } from './preloadImages'

afterEach(() => vi.unstubAllGlobals())
it('déduplique les URL et lance tous les décodages en parallèle sans propager les erreurs', async () => {
  const urls: string[] = [], completions: (() => void)[] = []
  vi.stubGlobal('Image', class { decoding = ''; src = ''; decode() { urls.push(this.src); return this.src === '/broken' ? Promise.reject(new Error('image')) : new Promise<void>(resolve => completions.push(resolve)) } })
  const result = preloadImages(['/first', '/broken', '/second', '/first'])
  expect(urls).toEqual(['/first', '/broken', '/second'])
  completions.forEach(resolve => resolve())
  await expect(result).resolves.toBeUndefined()
})
it('absorbe aussi une erreur synchrone du navigateur', async () => {
  vi.stubGlobal('Image', class { constructor() { throw new Error('decode indisponible') } })
  await expect(preloadImages(['/first'])).resolves.toBeUndefined()
})
