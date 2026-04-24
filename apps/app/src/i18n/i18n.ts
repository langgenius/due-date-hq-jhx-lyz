import { i18n } from '@lingui/core'
import type { Messages } from '@lingui/core'

import {
  LOCALE_HEADER,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  isLocale,
  type Locale,
} from '@duedatehq/i18n'
import { persistLocale } from './locales'

// The Vite plugin compiles every `.po` into a JS module with a `messages`
// export at build-time. Import them eagerly — only two locales, negligible cost.
import { messages as enMessages } from './locales/en/messages.po'
import { messages as zhCNMessages } from './locales/zh-CN/messages.po'

const CATALOGS: Record<Locale, Messages> = {
  en: enMessages,
  'zh-CN': zhCNMessages,
}

let loaded = false

function loadCatalogs(): void {
  if (loaded) return
  for (const locale of SUPPORTED_LOCALES) {
    i18n.load(locale, CATALOGS[locale])
  }
  loaded = true
}

// Activate a locale, syncing <html lang> and persisting the user choice.
export function activateLocale(locale: Locale, options: { persist?: boolean } = {}): void {
  loadCatalogs()
  i18n.activate(locale)
  if (typeof document !== 'undefined') {
    document.documentElement.lang = locale
  }
  if (options.persist) {
    persistLocale(locale)
  }
}

// Export the shared instance so non-React modules (e.g. utils.ts) can read locale.
export { i18n }

export function currentLocale(): Locale {
  return isLocale(i18n.locale) ? i18n.locale : DEFAULT_LOCALE
}

// Mutates `headers` in place so callers can pipe it through any fetch-like API
// without rebuilding a new Headers object.
export function attachLocaleHeader(headers: Headers): void {
  headers.set(LOCALE_HEADER, currentLocale())
}
