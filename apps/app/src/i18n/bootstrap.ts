import { activateLocale } from './i18n'
import { consumeLocaleHandoff, detectLocale } from './locales'

export function bootstrapI18n(): void {
  activateLocale(consumeLocaleHandoff() ?? detectLocale(), { persist: false })
}
