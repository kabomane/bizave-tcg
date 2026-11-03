import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '../storage/database'
import { OUTBOX_RETENTION_MS } from '../exchanges/outbox'
import { useNow } from './useNow'

export function useSentCodes() {
  const now = useNow()
  const outbox = useLiveQuery(() => db.outbox.orderBy('createdAt').reverse().toArray(), [], [])
  return { now, codes: outbox.filter(row => row.createdAt + OUTBOX_RETENTION_MS > now) }
}
