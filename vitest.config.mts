import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: {
    // Node by default; component tests opt in with `// @vitest-environment jsdom`.
    environment: 'node',
    setupFiles: ['./vitest.setup.ts'],
    // Payload init + migrations against Postgres can exceed the 10s default.
    hookTimeout: 60_000,
    include: ['tests/unit/**/*.test.ts', 'tests/int/**/*.int.spec.ts'],
  },
})
