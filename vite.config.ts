import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'

export default defineConfig(({ mode }) => {
  const buildId = randomUUID()
  const { version: appVersion } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'))
  const manifest = JSON.stringify({ schema: 1, buildId, appVersion, betaClosed: false })
  return {
  define: { __APP_BUILD_ID__: JSON.stringify(buildId) },
  plugins: [react(), tailwindcss(), {
    name: 'unlisted-landing',
    configureServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (request.url && /^\/landing\/?(?:\?|$)/.test(request.url)) request.url = request.url.replace(/^\/landing\/?/, '/landing.html')
        next()
      })
    },
    configurePreviewServer(server) {
      server.middlewares.use((request, _response, next) => {
        if (request.url && /^\/landing\/?(?:\?|$)/.test(request.url)) request.url = request.url.replace(/^\/landing\/?/, '/landing.html')
        next()
      })
    },
  }, {
    name: 'build-version',
    generateBundle() { this.emitFile({ type: 'asset', fileName: 'version.json', source: manifest }) },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        if (request.url?.split('?')[0] !== '/version.json') return next()
        response.setHeader('Content-Type', 'application/json')
        response.setHeader('Cache-Control', 'no-store')
        response.end(manifest)
      })
    },
  }],
  server: { host: '0.0.0.0', port: mode === 'https' ? 5174 : 5173, strictPort: true,
    // Playwright saves HTML resources in traces; watching them reloads active test pages.
    watch: { ignored: [/[\\/](?:test-results[^\\/]*|playwright-report|artifacts)(?:[\\/]|$)/] },
    ...(mode === 'https' ? { https: { key: readFileSync('.local/certificates/lan-key.pem'), cert: readFileSync('.local/certificates/lan-cert.pem') } } : {}) },
  preview: { host: '0.0.0.0', port: 4173, strictPort: true },
  test: { environment: 'node', pool: 'threads', maxWorkers: 2, include: ['src/**/*.test.ts'], setupFiles: ['src/test-setup.ts'] },
}})
