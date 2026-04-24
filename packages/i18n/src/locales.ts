export const SUPPORTED_LOCALES = ['en', 'zh-CN'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
}

export const INTL_LOCALE: Record<Locale, string> = {
  en: 'en-US',
  'zh-CN': 'zh-CN',
}

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function localeFromLanguageSignal(value: string | null | undefined): Locale | null {
  if (!value) return null
  return /\bzh(?:\b|-)/i.test(value) ? 'zh-CN' : null
}
