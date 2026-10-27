import { db } from './database'
import { assertAccountActive } from './accountGuard'
import { readableId } from '../exchanges/crypto'

export async function ensureInstallation(database = db) {
  return database.transaction('rw', [database.installation, database.identity, database.accountState], async () => {
    await assertAccountActive(database)
    const existing = await database.installation.get('local')
    if (existing) return existing
    const playerId = (await database.identity.get('local'))?.playerUuid
    let installationId = readableId()
    while (installationId === playerId) installationId = readableId()
    const installation = { id: 'local' as const, installationId, createdAt: Date.now() }
    await database.installation.add(installation)
    return installation
  })
}
