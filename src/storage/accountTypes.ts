import type { Preferences } from '../settings/preferences'

export type AccountStateRow =
  | { id: 'local'; status: 'active'; preferences?: Preferences }
  | { id: 'local'; status: 'exported'; transferId: string; recipientId: string; file: string }
export type UsedSaveTransferRow = { transferId: string; receivedAt: number }
export type InstallationRow = { id: 'local'; installationId: string; createdAt: number }
