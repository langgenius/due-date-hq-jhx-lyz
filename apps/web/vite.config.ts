import { defineConfig } from 'vite-plus'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { lingui, linguiTransformerBabelPreset } from '@lingui/vite-plugin'
import babel from '@rolldown/plugin-babel'
import path from 'node:path'

/**
 * Per-app Vite+ config for apps/web.
 *
 * Inherits the root lint / fmt / staged / run blocks
 * (see ../../vite.config.ts); overrides only the
 * SPA build/dev-server specifics here.
 *
 * PWA / Service Worker / Web Push were removed from Phase 0
 * (docs/dev-file/05 §8). Static chunks are served by the
 * Worker Assets binding with immutable cache headers, and
 * runtime cache is handled by TanStack Query.
 */
export default defineConfig({
  plugins: [
    react(),
    babel({
      include: /\/src\/.*\.[jt]sx?$/,
      presets: [linguiTransformerBabelPreset()],
    }),
    tailwindcss(),
    lingui(),
  ],

  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },

  server: {
    port: 5173,
    proxy: {
      '/rpc': 'http://localhost:8787',
      '/api': 'http://localhost:8787',
    },
  },

  build: {
    target: 'es2022',
    sourcemap: true,
  },

  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'happy-dom',
  },
})
