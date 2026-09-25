// Shared base Vite configuration for React apps.
//
// Usage in an app's own vite.config.ts:
//
//   import { defineConfig, mergeConfig } from 'vite'
//   import baseConfig from '@myfriend-pos/config/vite'
//
//   export default mergeConfig(baseConfig, defineConfig({
//     // app-specific overrides (port, base path, etc.)
//   }))

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@contracts': '/../../packages/contracts/src',
      '@ui': '/../../packages/ui/src',
    },
  },
  build: {
    sourcemap: true,
    target: 'es2022',
  },
  server: {
    host: true,
  },
})
