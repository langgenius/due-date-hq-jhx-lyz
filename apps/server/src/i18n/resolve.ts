import { AsyncLocalStorage } from 'node:async_hooks'

import {
  DEFAULT_LOCALE,
  LOCALE_HEADER,
  isLocale,
  localeFromLanguageSignal,
  type Locale,
} from '@duedatehq/i18n'

// Resolve locale from an incoming request's headers. The explicit `x-locale`
// header — sent by our SPA — wins over `Accept-Language`. Unknown values fall
// back to the default.
export function resolveLocale(headers: Headers): Locale {
  const explicit = headers.get(LOCALE_HEADER)
  if (isLocale(explicit)) return explicit

  const accept = headers.get('accept-language') ?? ''
  const detected = localeFromLanguageSignal(accept)
  if (detected) return detected
  return DEFAULT_LOCALE
}

// Per-request locale is stashed in AsyncLocalStorage so decoupled callbacks
// (e.g. better-auth's email hook) can read it without plumbing the header
// through every function signature.
const store = new AsyncLocalStorage<Locale>()

export function runWithLocale<T>(locale: Locale, fn: () => T): T {
  return store.run(locale, fn)
}

export function getRequestLocale(): Locale {
  return store.getStore() ?? DEFAULT_LOCALE
}
