import { AsyncLocalStorage } from 'node:async_hooks'

// Keep this list in sync with apps/web/src/i18n/locales.ts.
export const SUPPORTED_LOCALES = ['en', 'zh-CN'] as const
export type Locale = (typeof SUPPORTED_LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'en'

function isSupported(value: string | null | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

// Resolve locale from an incoming request's headers. The explicit `x-locale`
// header — sent by our SPA — wins over `Accept-Language`. Unknown values fall
// back to the default.
export function resolveLocale(headers: Headers): Locale {
  const explicit = headers.get('x-locale')
  if (isSupported(explicit)) return explicit

  const accept = headers.get('accept-language') ?? ''
  // Treat any zh-* variant as Simplified Chinese for now.
  if (/\bzh\b/i.test(accept)) return 'zh-CN'
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
