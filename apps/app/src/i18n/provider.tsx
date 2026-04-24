import { useCallback, useState, useSyncExternalStore, type ReactNode } from 'react'
import { I18nProvider } from '@lingui/react'
import { useQueryClient } from '@tanstack/react-query'

import { activateLocale, currentLocale, i18n } from './i18n'
import { DEFAULT_LOCALE, detectLocale, type Locale } from './locales'

// Activate the detected locale before the first render so users with a Chinese
// browser never flash English. Kept idempotent — safe to call repeatedly from
// tests that reset between cases.
let bootstrapped = false
function ensureBootstrap(): void {
  if (bootstrapped) return
  activateLocale(detectLocale(), { persist: false })
  bootstrapped = true
}

interface AppI18nProviderProps {
  children: ReactNode
}

export function AppI18nProvider({ children }: AppI18nProviderProps) {
  // Lazy useState initializer runs exactly once per mount and keeps the
  // bootstrap side-effect out of module import.
  useState(() => {
    ensureBootstrap()
    return null
  })
  return <I18nProvider i18n={i18n}>{children}</I18nProvider>
}

// Concurrent-safe subscription: `useSyncExternalStore` guarantees every consumer
// reads the same locale within a render pass, avoiding tearing between Lingui's
// own change notifications and React's commit cycle.
const subscribeLocale = (onStoreChange: () => void): (() => void) => {
  return i18n.on('change', onStoreChange)
}
const getSnapshot = (): Locale => currentLocale()
const getServerSnapshot = (): Locale => DEFAULT_LOCALE

export function useLocaleSwitch(): {
  locale: Locale
  switchLocale: (next: Locale) => void
} {
  const locale = useSyncExternalStore(subscribeLocale, getSnapshot, getServerSnapshot)
  const queryClient = useQueryClient()

  const switchLocale = useCallback(
    (next: Locale) => {
      if (next === locale) return
      activateLocale(next, { persist: true })
      // Drop any server responses that embed human-readable locale-dependent
      // text so follow-up renders refetch in the newly active language.
      void queryClient.invalidateQueries()
    },
    [locale, queryClient],
  )

  return { locale, switchLocale }
}
