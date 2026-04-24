import {
  DEFAULT_LOCALE,
  INTL_LOCALE,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  isLocale,
  localeFromLanguageSignal,
  type Locale,
} from '@duedatehq/i18n'

const STORAGE_KEY = 'lng'

export { DEFAULT_LOCALE, INTL_LOCALE, LOCALE_LABELS, SUPPORTED_LOCALES, isLocale, type Locale }

// Priority: explicit user choice in localStorage → navigator.language → default.
export function detectLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isLocale(stored)) return stored
  } catch {
    // localStorage may be blocked in private mode; fall through to navigator.
  }

  const detected = localeFromLanguageSignal(window.navigator?.language)
  if (detected) return detected
  return DEFAULT_LOCALE
}

export function persistLocale(locale: Locale): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, locale)
  } catch {
    // Ignore write failures; session-only preference is acceptable.
  }
}
