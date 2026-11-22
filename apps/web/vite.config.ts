import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

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
export default defineConfig({
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
})
