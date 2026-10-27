import type { BizaveDatabase } from './database'

// Include accountState in the caller's transaction so an export cannot race a write.
export async function assertAccountActive(database: BizaveDatabase) {
  if ((await database.accountState.get('local'))?.status === 'exported') throw new Error('Cette partie a été transférée. Téléchargez le fichier de sauvegarde.')
}
