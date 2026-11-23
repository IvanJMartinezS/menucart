import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import { apiUrlProblem } from './src/lib/api-url.ts'

/**
 * The web app calls the API at `/api` and Vite forwards it to the API. For the browser both are
 * on the same origin, which the session cookie needs (`SameSite`).
 */
const apiProxy = {
  '/api': {
    target: 'http://127.0.0.1:8787',
    rewrite: (path: string) => path.replace(/^\/api/, ''),
  },
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // A wrong VITE_API_URL stops Vite with a clear message, instead of a web app that cannot reach
  // the API. When it is not set (for example, building in CI) the web app says it when it loads.
  const { VITE_API_URL } = loadEnv(mode, import.meta.dirname)
  const problem = VITE_API_URL ? apiUrlProblem(VITE_API_URL) : null
  if (problem) {
    throw new Error(problem)
  }

  return {
    server: { proxy: apiProxy },
    preview: { proxy: apiProxy },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'MenuCart',
          short_name: 'MenuCart',
          description: 'De tus menús a tu lista de compras.',
          lang: 'es',
          theme_color: '#f7f2e9',
          background_color: '#f7f2e9',
          display: 'standalone',
        },
      }),
    ],
  }
})
