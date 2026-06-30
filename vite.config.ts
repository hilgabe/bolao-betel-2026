import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'logo-betel.svg', 'assets/tabela-mata-mata-copa-2026.png'],
      manifest: {
        name: 'Bolão Betel 2026',
        short_name: 'Betel 2026',
        description: 'Bolão da Copa do Mundo 2026 da Célula Betel.',
        theme_color: '#113CFC',
        background_color: '#F7F8FC',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/home',
        icons: [
          {
            src: '/favicon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webp}'],
      },
    }),
  ],
})
