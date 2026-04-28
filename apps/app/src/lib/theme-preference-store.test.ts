import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  THEME_COLOR_DARK,
  THEME_DARK_CLASS,
  THEME_STORAGE_KEY,
  clearStoredThemePreferenceCache,
} from '@duedatehq/ui/theme'

import {
  THEME_PREFERENCE_CHANGE_EVENT,
  getStoredThemePreference,
  subscribeToThemePreference,
  switchThemePreference,
} from './theme-preference-store'

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

function installMatchMedia(initialMatches: boolean) {
  const listeners = new Set<EventListener>()
  const media = {
    matches: initialMatches,
    media: '(prefers-color-scheme: dark)',
    addEventListener: vi.fn((type: string, listener: EventListener) => {
      if (type === 'change') listeners.add(listener)
    }),
    removeEventListener: vi.fn((type: string, listener: EventListener) => {
      if (type === 'change') listeners.delete(listener)
    }),
  }

  vi.stubGlobal(
    'matchMedia',
    vi.fn(() => media),
  )

  const emitChange = (matches: boolean) => {
    media.matches = matches
    for (const listener of listeners) listener(new Event('change'))
  }

  return { media, emitChange }
}

describe('theme preference store', () => {
  let meta: HTMLMetaElement

  beforeEach(() => {
    meta = ensureThemeColorMeta()
    document.documentElement.classList.remove(THEME_DARK_CLASS)
    document.documentElement.removeAttribute('data-theme')
    document.documentElement.style.removeProperty('color-scheme')
    window.localStorage.clear()
    clearStoredThemePreferenceCache(window.localStorage)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('ignores system color changes when the stored preference is explicit', () => {
    const { emitChange } = installMatchMedia(false)
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    clearStoredThemePreferenceCache(window.localStorage)
    const setItem = vi.spyOn(window.localStorage, 'setItem')
    const onStoreChange = vi.fn()
    const unsubscribe = subscribeToThemePreference(onStoreChange)

    emitChange(true)

    expect(setItem).not.toHaveBeenCalled()
    expect(onStoreChange).not.toHaveBeenCalled()
    expect(document.documentElement.dataset.theme).toBeUndefined()

    unsubscribe()
  })

  it('re-resolves system preference on system color changes without writing storage', () => {
    const { emitChange } = installMatchMedia(false)
    window.localStorage.setItem(THEME_STORAGE_KEY, 'system')
    clearStoredThemePreferenceCache(window.localStorage)
    const setItem = vi.spyOn(window.localStorage, 'setItem')
    const onStoreChange = vi.fn()
    const unsubscribe = subscribeToThemePreference(onStoreChange)

    emitChange(true)

    expect(setItem).not.toHaveBeenCalled()
    expect(onStoreChange).toHaveBeenCalledOnce()
    expect(document.documentElement.classList.contains(THEME_DARK_CLASS)).toBe(true)
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(meta.getAttribute('content')).toBe(THEME_COLOR_DARK)
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')

    unsubscribe()
  })

  it('filters unrelated storage events before applying the stored preference', () => {
    installMatchMedia(false)
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    clearStoredThemePreferenceCache(window.localStorage)
    const onStoreChange = vi.fn()
    const unsubscribe = subscribeToThemePreference(onStoreChange)

    window.dispatchEvent(new StorageEvent('storage', { key: 'unrelated' }))

    expect(onStoreChange).not.toHaveBeenCalled()
    expect(document.documentElement.dataset.theme).toBeUndefined()

    window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY }))

    expect(onStoreChange).toHaveBeenCalledOnce()
    expect(document.documentElement.dataset.theme).toBe('dark')

    unsubscribe()
  })

  it('keeps the current-tab preference in memory when storage writes fail', () => {
    installMatchMedia(false)
    const setItem = vi.spyOn(window.localStorage, 'setItem').mockImplementation(() => {
      throw new Error('quota exceeded')
    })
    const onStoreChange = vi.fn()
    const unsubscribe = subscribeToThemePreference(onStoreChange)

    switchThemePreference('dark')

    expect(setItem).toHaveBeenCalledWith(THEME_STORAGE_KEY, 'dark')
    expect(getStoredThemePreference()).toBe('dark')
    expect(onStoreChange).toHaveBeenCalledOnce()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.classList.contains(THEME_DARK_CLASS)).toBe(true)

    unsubscribe()
  })

  it('applies the cached preference when the current-tab event is dispatched directly', () => {
    installMatchMedia(false)
    switchThemePreference('dark')
    document.documentElement.classList.remove(THEME_DARK_CLASS)
    document.documentElement.removeAttribute('data-theme')
    const onStoreChange = vi.fn()
    const unsubscribe = subscribeToThemePreference(onStoreChange)

    window.dispatchEvent(new Event(THEME_PREFERENCE_CHANGE_EVENT))

    expect(onStoreChange).toHaveBeenCalledOnce()
    expect(document.documentElement.dataset.theme).toBe('dark')
    expect(document.documentElement.classList.contains(THEME_DARK_CLASS)).toBe(true)

    unsubscribe()
  })
})
