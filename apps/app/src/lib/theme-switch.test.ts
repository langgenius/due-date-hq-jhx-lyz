import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  THEME_COLOR_DARK,
  THEME_COLOR_LIGHT,
  THEME_DARK_CLASS,
  THEME_STORAGE_KEY,
  switchThemePreference,
} from '@duedatehq/ui/theme'

function ensureThemeColorMeta(): HTMLMetaElement {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  if (!meta) {
    meta = document.createElement('meta')
    meta.setAttribute('name', 'theme-color')
    document.head.appendChild(meta)
  }
  meta.setAttribute('content', '')
  return meta
}

describe('switchThemePreference', () => {
  let meta: HTMLMetaElement

  beforeEach(() => {
    meta = ensureThemeColorMeta()
    document.documentElement.classList.remove(THEME_DARK_CLASS)
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.removeProperty('color-scheme')
    window.localStorage.clear()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('applies dark mode side effects when preference is "dark"', () => {
    const resolved = switchThemePreference('dark', { prefersDark: false })

    expect(resolved).toBe('dark')
    expect(document.documentElement.classList.contains(THEME_DARK_CLASS)).toBe(true)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.style.colorScheme).toBe('dark')
    expect(meta.getAttribute('content')).toBe(THEME_COLOR_DARK)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('falls back to system preference when "system" is chosen', () => {
    const resolvedAsLight = switchThemePreference('system', { prefersDark: false })
    expect(resolvedAsLight).toBe('light')
    expect(document.documentElement.classList.contains(THEME_DARK_CLASS)).toBe(false)
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(meta.getAttribute('content')).toBe(THEME_COLOR_LIGHT)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')

    const resolvedAsDark = switchThemePreference('system', { prefersDark: true })
    expect(resolvedAsDark).toBe('dark')
    expect(document.documentElement.classList.contains(THEME_DARK_CLASS)).toBe(true)
    expect(meta.getAttribute('content')).toBe(THEME_COLOR_DARK)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')
  })

  it('applies the preference even when storage throws', () => {
    const setItem = vi.fn(() => {
      throw new Error('quota exceeded')
    })
    const storage: Pick<Storage, 'setItem'> = { setItem }

    expect(() => switchThemePreference('light', { prefersDark: true, storage })).not.toThrow()
    expect(setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'light')
    expect(document.documentElement.classList.contains(THEME_DARK_CLASS)).toBe(false)
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(meta.getAttribute('content')).toBe(THEME_COLOR_LIGHT)
  })
})
