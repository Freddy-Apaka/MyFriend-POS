import { defineConfig, mergeConfig } from 'vitest/config'

import baseConfig from '../config/vitest.config.base'

export default mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      environment: 'node',
    },
  }),
)
