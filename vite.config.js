import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-charts': ['recharts'],
          'vendor-ui': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu', '@radix-ui/react-popover', '@radix-ui/react-select', '@radix-ui/react-slot', '@radix-ui/react-tooltip'],
          'vendor-forms': ['react-hook-form', '@hookform/resolvers', 'zod'],
          'vendor-animation': ['framer-motion'],
          'vendor-dates': ['date-fns'],
        }
      }
    },
    chunkSizeWarningLimit: 500,
  },
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'autoUpdate',
      includeAssets: ['logo.png'],
      manifest: {
        name: 'Twilightio',
        short_name: 'Twilightio',
        description: 'A beautiful, self-hosted daily mood tracker and journal',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        display: 'standalone',
        icons: [
          {
            src: 'logo.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'logo.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 4000000
      }
    })
  ],
  server: {
    host: true,
    watch: {
      ignored: ['**/api/venv/**', '**/node_modules/**', '**/.git/**'],
    },
    proxy: {
      '/api': {
        target: (globalThis && globalThis.process && globalThis.process.env && globalThis.process.env.VITE_API_URL) || 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  preview: {
    host: true,
    port: 4173,
  },
})
