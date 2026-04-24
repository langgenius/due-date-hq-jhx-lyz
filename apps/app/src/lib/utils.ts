export { cn } from '@duedatehq/ui/lib/utils'

import { INTL_LOCALE } from '@duedatehq/i18n'
import { currentLocale } from '@/i18n/i18n'

function intlLocale(): string {
  return INTL_LOCALE[currentLocale()]
}

// Monetary cents → "$1,234.56". Always pair with `font-mono tabular-nums` (docs/dev-file/05 §5.2).
export function formatCents(cents: number): string {
  return new Intl.NumberFormat(intlLocale(), {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(cents / 100)
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(intlLocale(), { dateStyle: 'medium' }).format(new Date(iso))
}
