import { defineConfig } from 'vite-plus'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { lingui } from '@lingui/vite-plugin'
import babel from 'vite-plugin-babel'
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
    // @vitejs/plugin-react v6 dropped Babel, so macro transformation runs through
    // a dedicated `vite-plugin-babel` pass that covers every source file — both
    // JSX and plain .ts modules that use `msg`/`t` (e.g. src/lib/i18n-error.ts).
    react(),
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        babelrc: false,
        configFile: false,
        parserOpts: { plugins: ['typescript', 'jsx'] },
        plugins: ['@lingui/babel-plugin-lingui-macro'],
      },
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
