import { defineConfig, devices } from '@playwright/test'
import 'dotenv/config'

const PORT = 3100
const baseURL = `http://localhost:${PORT}`
const MOCK_GHOST_PORT = 3201
const MOCK_GHOST_URL = `http://localhost:${MOCK_GHOST_PORT}`
const testDatabase = process.env.TEST_DATABASE_URI

if (!testDatabase) {
  throw new Error('TEST_DATABASE_URI must be set for e2e tests (see .env.example)')
}

// Global setup and the app server must both use the isolated test database.
process.env.DATABASE_URI = testDatabase
// Never schema-push the test database; it is managed by migrations only.
process.env.PAYLOAD_DB_PUSH = 'false'

export default defineConfig({
  testDir: './tests/e2e',
  globalSetup: './tests/e2e/global-setup.ts',
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Tests share one database; run serially for deterministic state.
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], channel: 'chromium' },
    },
  ],
  webServer: [
    {
      // Fictional Ghost Content API so /writing can be tested without a real blog.
      command: `node tests/e2e/mock-ghost.mjs`,
      url: `${MOCK_GHOST_URL}/health`,
      reuseExistingServer: !process.env.CI,
      env: { MOCK_GHOST_PORT: String(MOCK_GHOST_PORT) },
    },
    {
      // Migrate first: Playwright waits for the health check (which needs tables) before globalSetup runs.
      command: `pnpm migrate && pnpm exec next dev --port ${PORT}`,
      url: `${baseURL}/api/health`,
      reuseExistingServer: !process.env.CI,
      timeout: 180_000,
      env: {
        DATABASE_URI: testDatabase,
        PAYLOAD_DB_PUSH: 'false',
        NEXT_PUBLIC_SITE_URL: baseURL,
        NODE_OPTIONS: '--no-deprecation',
        GHOST_URL: MOCK_GHOST_URL,
        GHOST_CONTENT_API_KEY: 'e2e-placeholder-content-key',
      },
    },
  ],
})
