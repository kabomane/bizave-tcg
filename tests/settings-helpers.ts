import type { Page } from '@playwright/test'

export async function expandSettings(page: Page, group: string) {
  const section = page.locator(`[data-settings-group="${group}"]`)
  if (await section.getAttribute('open') === null) await section.locator('summary').click()
}
