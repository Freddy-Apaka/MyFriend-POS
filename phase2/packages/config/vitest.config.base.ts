// Shared base Vitest configuration.
//
// Usage in an app or package's own vitest.config.ts:
//
//   import { defineConfig, mergeConfig } from 'vitest/config'
//   import baseConfig from '@myfriend-pos/config/vitest'
//
//   export default mergeConfig(baseConfig, defineConfig({
//     // app-specific overrides
//   }))

import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node', // apps with DOM needs override this to 'jsdom'
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/*.config.{ts,js}',
        '**/*.d.ts',
      ],
    },
  },
})
