import { describe, expect, it } from 'vitest'

import { getRequestLocale, resolveLocale, runWithLocale } from './resolve'

function headers(init: Record<string, string>): Headers {
  return new Headers(init)
}

describe('resolveLocale', () => {
  it('prefers explicit x-locale header', () => {
    expect(resolveLocale(headers({ 'x-locale': 'zh-CN' }))).toBe('zh-CN')
  })

  it('ignores unsupported x-locale values', () => {
    expect(resolveLocale(headers({ 'x-locale': 'fr-FR' }))).toBe('en')
  })

  it('falls back to Accept-Language for Chinese variants', () => {
    expect(resolveLocale(headers({ 'accept-language': 'zh-CN,zh;q=0.9,en;q=0.8' }))).toBe('zh-CN')
  })

  it('defaults to en when no signal is present', () => {
    expect(resolveLocale(headers({}))).toBe('en')
  })
})

describe('runWithLocale', () => {
  it('exposes the locale inside an async scope', async () => {
    await runWithLocale('zh-CN', async () => {
      expect(getRequestLocale()).toBe('zh-CN')
    })
  })

  it('returns the default locale outside any scope', () => {
    expect(getRequestLocale()).toBe('en')
  })
})
