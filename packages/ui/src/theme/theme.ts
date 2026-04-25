const THEME_PREFERENCES = ['light', 'dark', 'system'] as const

type ThemePreference = (typeof THEME_PREFERENCES)[number]
type ResolvedTheme = Exclude<ThemePreference, 'system'>

const THEME_STORAGE_KEY = 'duedatehq.theme'
const THEME_ATTRIBUTE = 'theme'
const THEME_DARK_CLASS = 'dark'
const THEME_COLOR_LIGHT = '#0A2540'
const THEME_COLOR_DARK = '#0D0E11'
const DISABLE_TRANSITIONS_STYLE = `*,*::before,*::after{-webkit-transition:none!important;-moz-transition:none!important;-o-transition:none!important;-ms-transition:none!important;transition:none!important}`

function isThemePreference(value: string | null): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system'
}

function resolveThemePreference(preference: ThemePreference, prefersDark: boolean): ResolvedTheme {
  if (preference === 'system') {
    return prefersDark ? 'dark' : 'light'
  }

  return preference
}

function readStoredThemePreference(storage: Pick<Storage, 'getItem'>): ThemePreference {
  const stored = storage.getItem(THEME_STORAGE_KEY)

  if (isThemePreference(stored)) {
    return stored
  }

  return 'system'
}

function themeColorFor(resolvedTheme: ResolvedTheme): string {
  return resolvedTheme === 'dark' ? THEME_COLOR_DARK : THEME_COLOR_LIGHT
}

function updateThemeColor(
  documentLike: Pick<Document, 'querySelector'>,
  resolvedTheme: ResolvedTheme,
): void {
  const meta = documentLike.querySelector('meta[name="theme-color"]')

  if (meta) {
    meta.setAttribute('content', themeColorFor(resolvedTheme))
  }
}

function applyResolvedTheme(
  root: Pick<HTMLElement, 'classList' | 'dataset' | 'style'>,
  resolvedTheme: ResolvedTheme,
): void {
  root.classList.toggle(THEME_DARK_CLASS, resolvedTheme === 'dark')
  root.dataset[THEME_ATTRIBUTE] = resolvedTheme
  root.style.colorScheme = resolvedTheme
}

function disableThemeTransitions(nonce?: string): () => void {
  const style = document.createElement('style')

  if (nonce) {
    style.setAttribute('nonce', nonce)
  }

  style.appendChild(document.createTextNode(DISABLE_TRANSITIONS_STYLE))
  document.head.appendChild(style)

  return () => {
    void window.getComputedStyle(document.body).getPropertyValue('opacity')

    setTimeout(() => {
      style.remove()
    }, 1)
  }
}

export {
  THEME_ATTRIBUTE,
  THEME_COLOR_DARK,
  THEME_COLOR_LIGHT,
  THEME_DARK_CLASS,
  THEME_PREFERENCES,
  THEME_STORAGE_KEY,
  applyResolvedTheme,
  disableThemeTransitions,
  isThemePreference,
  readStoredThemePreference,
  resolveThemePreference,
  themeColorFor,
  updateThemeColor,
  type ResolvedTheme,
  type ThemePreference,
}
