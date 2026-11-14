import { defineConfig, devices } from '@playwright/test'
import base from './playwright.config'

export default defineConfig({
  ...base,
  testMatch: ['share-code-compat.spec.ts', 'btcg-downloads.spec.ts'],
  projects: [
    ...(base.projects ?? []),
    { name: 'android-phone', use: { ...devices['Pixel 7'] } },
    { name: 'iphone', use: { ...devices['iPhone 15'] } },
    { name: 'ipad', use: { ...devices['iPad Mini'] } },
    { name: 'android-tablet', use: { browserName: 'chromium', viewport: { width: 800, height: 1280 }, isMobile: true, hasTouch: true } },
  ],
})
