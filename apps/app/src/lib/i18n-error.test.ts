import { afterEach, describe, expect, it } from 'vitest'

import { activateLocale } from '@/i18n/i18n'
import { translateServerErrorCode } from './i18n-error'

describe('translateServerErrorCode', () => {
  afterEach(() => {
    activateLocale('en')
  })

  it('returns a localized message for a known code', () => {
    activateLocale('en')
    expect(translateServerErrorCode('UNAUTHORIZED')).toBe('You need to sign in to continue.')
  })

  it('returns the zh-CN translation when that locale is active', () => {
    activateLocale('zh-CN')
    expect(translateServerErrorCode('UNAUTHORIZED')).toBe('请先登录后继续。')
  })

  it('returns null for unknown codes so callers can fall back', () => {
    expect(translateServerErrorCode('SOMETHING_NEW')).toBeNull()
    expect(translateServerErrorCode(null)).toBeNull()
    expect(translateServerErrorCode(undefined)).toBeNull()
  })

  it('covers the common HTTP-ish error codes surfaced by the Worker', () => {
    activateLocale('en')
    expect(translateServerErrorCode('NOT_FOUND')).toMatch(/find/i)
    expect(translateServerErrorCode('INVALID_REQUEST')).toMatch(/invalid/i)
    expect(translateServerErrorCode('CONFLICT')).toMatch(/conflict/i)
    expect(translateServerErrorCode('INTERNAL_SERVER_ERROR')).toMatch(/wrong/i)
  })
})
