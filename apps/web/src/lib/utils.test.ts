import { afterEach, describe, expect, it } from 'vitest'

import { activateLocale } from '@/i18n/i18n'
import { cn, formatCents, formatDate } from './utils'

describe('utils', () => {
  afterEach(() => {
    activateLocale('en')
  })

  it('merges Tailwind classes with later conflicting utilities winning', () => {
    expect(cn('px-2 text-sm', 'px-4')).toBe('text-sm px-4')
  })

  it('formats cents as US dollars under the en locale', () => {
    activateLocale('en')
    expect(formatCents(14230000)).toBe('$142,300.00')
  })

  it('uses zh-CN number grouping when the zh-CN locale is active', () => {
    activateLocale('zh-CN')
    // zh-CN currency formatting uses non-breaking space (U+00A0) between the
    // symbol and the amount, matching ICU output.
    expect(formatCents(14230000)).toMatch(/142,300\.00/)
  })

  it('localizes date formatting to the active locale', () => {
    activateLocale('en')
    const enValue = formatDate('2026-03-15')
    activateLocale('zh-CN')
    const zhValue = formatDate('2026-03-15')
    expect(enValue).not.toEqual(zhValue)
  })
})
