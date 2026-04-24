import { defineConfig } from '@lingui/cli'
import { DEFAULT_LOCALE, SUPPORTED_LOCALES } from '@duedatehq/i18n'

// Source locale is English; Chinese catalog lives alongside it.
// The Vite plugin watches these .po files and recompiles on change.
export default defineConfig({
  sourceLocale: DEFAULT_LOCALE,
  locales: [...SUPPORTED_LOCALES],
  catalogs: [
    {
      path: '<rootDir>/src/i18n/locales/{locale}/messages',
      include: ['<rootDir>/src'],
    },
  ],
  compileNamespace: 'ts',
  macro: {
    jsxPlaceholderAttribute: 'data-t',
    jsxPlaceholderDefaults: {
      a: 'link',
      button: 'button',
      code: 'code',
      em: 'emphasis',
      strong: 'strong',
    },
  },
})
