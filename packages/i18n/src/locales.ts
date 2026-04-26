export const SUPPORTED_LOCALES = ['en', 'zh-CN'] as const

export type Locale = (typeof SUPPORTED_LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  'zh-CN': '简体中文',
}

// Two-character codes for tight workbench triggers (header pills, segmented
// controls). Marketing TopNav uses the same `EN` / `中` pair — see
// `apps/marketing/src/i18n/{en,zh-CN}.ts` `language.{enShort,zhShort}`.
// Long labels remain in `LOCALE_LABELS` for dropdown menu items so users can
// still see the full language name when picking.
export const LOCALE_SHORT_LABELS: Record<Locale, string> = {
  en: 'EN',
  'zh-CN': '中',
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
