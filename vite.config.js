import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const enableDevSW = env.VITE_ENABLE_SW_DEV === 'true'
  const shouldAnalyze = env.ANALYZE === 'true' || process.env.ANALYZE === 'true'

  const plugins = [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
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
        enabled: enableDevSW,
        type: 'module',
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 4000000
      }
    })
  ]

  if (shouldAnalyze) {
    plugins.push(
      visualizer({
        filename: 'dist/bundle-analysis.html',
        gzipSize: true,
        brotliSize: true,
        open: false,
      })
    )
  }

  return {
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
    plugins,
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
  }
})
