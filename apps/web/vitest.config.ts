import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config.ts'

// The Vite config is a function of the mode, so it is called with the same one.
export default defineConfig((configEnv) =>
  mergeConfig(
    viteConfig(configEnv),
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
  ),
)
