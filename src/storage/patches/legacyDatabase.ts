// Temporary compatibility patch for GitHub issue #1. Remove this module and its
// single boot call once all supported clients have moved off bizave-tcg-v2.
import Dexie from 'dexie'
import { BizaveDatabase, DATABASE_NAME, DATABASE_SCHEMA_VERSION } from '../database'

async function targetReady(name: string) {
  if (!await Dexie.exists(name)) return false
  const database = new Dexie(name)
  try {
    await database.open()
    if (!database.tables.some(table => table.name === 'version')) return false
    const version = await database.table('version').get('local')
    return version?.ready === true && version.schemaVersion >= 9
  } finally { database.close() }
}

async function migrate(sourceName: string, targetName: string) {
  if (sourceName === targetName) throw new Error('Les bases source et destination doivent être distinctes.')
  if (!await Dexie.exists(sourceName)) return
  if (await targetReady(targetName)) { await Dexie.delete(sourceName); return }
  const source = new BizaveDatabase(sourceName)
  try {
    await source.open()
    // This lock also serializes migrations when Web Locks is unavailable, and
    // prevents legacy clients from modifying source rows while they are copied.
    await source.transaction('rw', source.tables, async () => {
      const snapshots = await Promise.all(source.tables.map(async table => ({ name: table.name, rows: await table.toArray() })))
      await Dexie.waitFor((async () => {
        if (await targetReady(targetName)) return
        // The active source is still intact if deletion, copying or verification fails.
        await Dexie.delete(targetName)
        const target = new BizaveDatabase(targetName)
        try {
          await target.open()
          await target.transaction('rw', target.tables, async () => {
            for (const snapshot of snapshots) {
              await target.table(snapshot.name).bulkPut(snapshot.rows)
              const copied = await target.table(snapshot.name).toArray()
              if (JSON.stringify(copied) !== JSON.stringify(snapshot.rows)) throw new Error(`Copie de la sauvegarde non vérifiée : ${snapshot.name}.`)
            }
            // CryptoKey values are structured-cloned by IndexedDB, not represented
            // by JSON. Verify the copied private key against the source public key.
            const identity = await target.identity.get('local')
            if (identity) {
              const valid = await Dexie.waitFor((async () => {
                const challenge = new TextEncoder().encode('BizaveTCG/DatabaseMigration/v1')
                const publicKey = await crypto.subtle.importKey('jwk', identity.signingPublicJwk, { name: 'ECDSA', namedCurve: 'P-256' }, false, ['verify'])
                const signature = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, identity.signingPrivateKey, challenge)
                return crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, signature, challenge)
              })())
              if (!valid) throw new Error('La clé de la sauvegarde copiée n’a pas pu être vérifiée.')
            }
            await target.versionInfo.put({ id: 'local', schemaVersion: DATABASE_SCHEMA_VERSION, ready: true })
          })
        } finally { target.close() }
      })())
    })
  } finally { source.close() }
  // Only a verified, committed target authorizes removal of the active source.
  await Dexie.delete(sourceName)
}

export async function migrateLegacyDatabase(sourceName = 'bizave-tcg-v2', targetName = DATABASE_NAME) {
  if (typeof navigator !== 'undefined' && navigator.locks) {
    return navigator.locks.request(`bizave-database-migration:${targetName}`, () => migrate(sourceName, targetName))
  }
  try { return await migrate(sourceName, targetName) }
  catch (error) {
    // Another tab may have committed the copy and closed our source connection.
    if (error instanceof Error && error.name === 'DatabaseClosedError' && await targetReady(targetName)) return
    throw error
  }
}
