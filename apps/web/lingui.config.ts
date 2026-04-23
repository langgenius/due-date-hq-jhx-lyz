import { defineConfig } from '@lingui/cli'

// Lingui v5 message catalog config.
// Source locale is English; Chinese catalog lives alongside it.
// The Vite plugin watches these .po files and recompiles on change.
export default defineConfig({
  sourceLocale: 'en',
  locales: ['en', 'zh-CN'],
  catalogs: [
    {
      path: '<rootDir>/src/i18n/locales/{locale}/messages',
      include: ['<rootDir>/src'],
    },
  ],
  format: 'po',
  compileNamespace: 'ts',
})
