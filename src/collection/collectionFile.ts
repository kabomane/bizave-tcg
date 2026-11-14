import { COLLECTION_LIMITS } from './snapshotCodec'
import { isShareCode, SHARE_CODE_PREFIX } from '../encoding/shareCode'
export function collectionFileContents(code: string) { return JSON.stringify({ format: 'bizave-tcg-collection', version: 1, code }) }
export async function readCollectionFile(file: File) {
  if (!/\.btcg$/i.test(file.name)) throw new Error('Choisissez un fichier .btcg de collection.')
  if (file.size > COLLECTION_LIMITS.file) throw new Error('Ce fichier de collection dépasse 64 Kio.')
  let data: unknown
  try { data = JSON.parse(await file.text()) } catch { throw new Error('Fichier de collection illisible.') }
  if (!data || typeof data !== 'object' || Array.isArray(data)) throw new Error('Ce fichier n’est pas une collection.')
  const value = data as Record<string, unknown>
  if (Object.keys(value).sort().join(',') !== 'code,format,version' || value.format !== 'bizave-tcg-collection' || value.version !== 1 || !isShareCode(value.code, SHARE_CODE_PREFIX.collection, COLLECTION_LIMITS.text)) throw new Error('Ce fichier n’est pas une collection valide.')
  return value.code
}
export function downloadCollectionFile(code: string, senderId: string, issuedAt: number) {
  const url = URL.createObjectURL(new Blob([collectionFileContents(code)], { type: 'application/octet-stream' })), link = document.createElement('a')
  link.href = url; link.download = `bizave-collection-${senderId}-${new Date(issuedAt * 1000).toISOString().slice(0, 10)}.btcg`
  document.body.append(link)
  try { link.click() } finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60_000) }
}
