import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      // The API is never called for real in tests (see setup.ts), but the client needs a base URL.
      env: { VITE_API_URL: 'http://api.test' },
      unstubGlobals: true,
    },
  }),
)
