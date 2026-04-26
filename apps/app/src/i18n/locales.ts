import {
  DEFAULT_LOCALE,
  INTL_LOCALE,
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  isLocale,
  localeFromLanguageSignal,
  type Locale,
} from '@duedatehq/i18n'
import { localeFromSearch, localeFromSearchParams, removeLocaleFromPath } from './query'

const STORAGE_KEY = 'lng'

export { DEFAULT_LOCALE, INTL_LOCALE, LOCALE_LABELS, SUPPORTED_LOCALES, isLocale, type Locale }

function detectLocaleHandoff(): Locale | null {
  if (typeof window === 'undefined') return null

  try {
    return localeFromSearch(window.location.search)
  } catch {
    return null
  }
}

export function consumeLocaleHandoff(): Locale | null {
  const locale = detectLocaleHandoff()
  if (!locale) return null

  persistLocale(locale)

  try {
    const current = `${window.location.pathname}${window.location.search}${window.location.hash}`
    const next = removeLocaleFromPath(current)
    window.history.replaceState(window.history.state, '', next)
  } catch {
    // URL cleanup is best-effort; the persisted locale is the durable handoff.
  }

  return locale
}

export function persistLocaleHandoffFromUrl(url: URL): Locale | null {
  const locale = localeFromSearchParams(url.searchParams)
  if (!locale) return null

  persistLocale(locale)
  return locale
}

// Priority: marketing handoff query → explicit user choice in localStorage →
// navigator.language → default.
export function detectLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE

  const queryLocale = detectLocaleHandoff()
  if (queryLocale) return queryLocale

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
