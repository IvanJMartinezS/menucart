import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
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
