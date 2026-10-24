import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  server: { host: '0.0.0.0', port: mode === 'https' ? 5174 : 5173, strictPort: true, ...(mode === 'https' ? { https: { key: readFileSync('.local/certificates/lan-key.pem'), cert: readFileSync('.local/certificates/lan-cert.pem') } } : {}) },
  preview: { host: '0.0.0.0', port: 4173, strictPort: true },
  test: { environment: 'node', pool: 'threads', maxWorkers: 2, include: ['src/**/*.test.ts'], setupFiles: ['src/test-setup.ts'] },
}))
