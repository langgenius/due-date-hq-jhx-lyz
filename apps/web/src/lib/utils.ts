import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

import { currentLocale } from '@/i18n/i18n'
import { INTL_LOCALE } from '@/i18n/locales'

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}

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
