import { useEffect, useRef, useState } from 'react'
import type { Card, CardDefinition } from '../game/types'
import { variantKey } from '../game/engine'
import { useResolvedTheme, useSettings } from '../settings/useSettings'
import { renderShareImage } from './renderShareImage'

type Prepared = { file: File; url: string }
export function useShareImage(card: Card, definition: CardDefinition) {
  const { shareFormat } = useSettings()
  const theme = useResolvedTheme()
  const key = `${variantKey(card)}|${shareFormat}|${shareFormat === 'story' ? theme : 'transparent'}`
  const cache = useRef(new Map<string, Promise<Prepared>>())
  const [result, setResult] = useState<{ key: string; image?: Prepared; error?: string } | null>(null)
  useEffect(() => {
    let current = true
    const entries = cache.current
    let pending = entries.get(key)
    if (!pending) {
      pending = renderShareImage(card, definition, shareFormat, theme).then(file => ({ file, url: URL.createObjectURL(file) }))
      entries.set(key, pending)
    }
    pending.then(image => { if (current) setResult({ key, image }) }, () => {
      entries.delete(key)
      if (current) setResult({ key, error: 'Impossible de préparer l’image de partage.' })
    })
    return () => { current = false }
  }, [key, card, definition, shareFormat, theme])
  useEffect(() => {
    const entries = cache.current
    return () => { for (const pending of entries.values()) void pending.then(image => URL.revokeObjectURL(image.url), () => {}); entries.clear() }
  }, [])
  return { image: result?.key === key ? result.image : undefined, error: result?.key === key ? result.error : undefined }
}
