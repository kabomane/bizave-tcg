// Temporary cleanup introduced 2026-11-06. No new purchases write this journal.
// Remove this file and its three call sites after the compatibility window for
// old clients AND signed saves ends. See docs/patch-booster-purchase-history.md.
import type { BizaveDatabase } from '../database'

export async function clearBoosterPurchaseHistory(database: BizaveDatabase) {
  await database.boosterPurchases.clear()
}
