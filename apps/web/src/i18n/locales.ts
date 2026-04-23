// Locale identifiers used across the SPA.
// Keep this list tiny so every caller can exhaustively switch on it.
export const SUPPORTED_LOCALES = ['en', 'zh-CN'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

// Human-readable labels rendered in the language switcher.
export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
}

// Intl tag used by Intl.NumberFormat / Intl.DateTimeFormat.
// Lingui locale 'en' maps to en-US for tabular number formatting.
export const INTL_LOCALE: Record<Locale, string> = {
  en: 'en-US',
  'zh-CN': 'zh-CN',
}

const STORAGE_KEY = 'lng'

export const DEFAULT_LOCALE: Locale = 'en'

function isSupported(value: string | null | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

// Priority: explicit user choice in localStorage → navigator.language → default.
export function detectLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (isSupported(stored)) return stored
  } catch {
    // localStorage may be blocked in private mode; fall through to navigator.
  }

  const nav = window.navigator?.language?.toLowerCase() ?? ''
  if (nav.startsWith('zh')) return 'zh-CN'
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
