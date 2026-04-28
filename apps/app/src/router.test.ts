/* eslint-disable typescript-eslint/no-unsafe-type-assertion --
 * Loader tests cast minimal Request fixtures into LoaderFunctionArgs and
 * narrow `unknown` thrown values into Response. Both casts are the
 * standard pattern for testing react-router loader signatures without
 * pulling in the real router runtime.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'

const getSession = vi.hoisted(() => vi.fn())

vi.mock('@/lib/auth', () => ({
  authClient: {
    getSession,
  },
}))

// Import after the mock so the loaders pick up the stubbed authClient.
const {
  dashboardAliasLoader,
  guestLoader,
  onboardingLoader,
  protectedLoader,
  pickSafeRedirect,
  notFoundLoader,
} = await import('@/router')
const { activateLocale, currentLocale } = await import('@/i18n/i18n')

type SessionShape = {
  user: { id: string; name?: string; email?: string }
  session: { activeOrganizationId: string | null }
}

function makeSession(activeOrganizationId: string | null): SessionShape {
  return {
    user: { id: 'user_1', name: 'Alex Chen', email: 'alex@example.com' },
    session: { activeOrganizationId },
  }
}

function makeArgs(url: string) {
  return { request: new Request(url) } as unknown as Parameters<typeof protectedLoader>[0]
}

async function expectRedirectTo(promise: Promise<unknown>, expected: string): Promise<void> {
  let thrown: unknown
  try {
    await promise
  } catch (err) {
    thrown = err
  }
  expect(thrown).toBeInstanceOf(Response)
  const res = thrown as Response
  expect(res.status).toBe(302)
  expect(res.headers.get('Location')).toBe(expected)
}

async function expectReplaceTo(promise: Promise<unknown>, expected: string): Promise<void> {
  let thrown: unknown
  try {
    await promise
  } catch (err) {
    thrown = err
  }
  expect(thrown).toBeInstanceOf(Response)
  const res = thrown as Response
  expect(res.status).toBe(302)
  expect(res.headers.get('Location')).toBe(expected)
  expect(res.headers.get('X-Remix-Replace')).toBe('true')
}

beforeEach(() => {
  window.localStorage.clear()
  document.documentElement.lang = ''
  activateLocale('en')
})

describe('pickSafeRedirect', () => {
  it('returns the fallback for empty / null / undefined input', () => {
    expect(pickSafeRedirect(null)).toBe('/')
    expect(pickSafeRedirect(undefined)).toBe('/')
    expect(pickSafeRedirect('')).toBe('/')
  })

  it('rejects external URLs to prevent open redirect', () => {
    expect(pickSafeRedirect('https://evil.com')).toBe('/')
    expect(pickSafeRedirect('//evil.com/path')).toBe('/')
    expect(pickSafeRedirect('javascript:alert(1)')).toBe('/')
  })

  it('accepts in-app paths only (must start with single /)', () => {
    expect(pickSafeRedirect('/dashboard')).toBe('/dashboard')
    expect(pickSafeRedirect('/workboard?scope=me')).toBe('/workboard?scope=me')
  })

  it('honours a custom fallback', () => {
    expect(pickSafeRedirect('https://evil.com', '/safe')).toBe('/safe')
  })
})

describe('notFoundLoader', () => {
  it('throws a 404 response for unmatched public routes', () => {
    let thrown: unknown
    try {
      notFoundLoader()
    } catch (err) {
      thrown = err
    }

    expect(thrown).toBeInstanceOf(Response)
    const res = thrown as Response
    expect(res.status).toBe(404)
    expect(res.statusText).toBe('Not Found')
  })
})

describe('dashboardAliasLoader', () => {
  it('redirects /dashboard to the canonical app root', async () => {
    await expectRedirectTo(
      Promise.resolve().then(() => dashboardAliasLoader()),
      '/',
    )
  })
})

describe('protectedLoader', () => {
  beforeEach(() => {
    getSession.mockReset()
  })

  it('redirects to /login with redirectTo when no session', async () => {
    getSession.mockResolvedValueOnce({ data: null })
    await expectRedirectTo(
      protectedLoader(makeArgs('http://localhost/workboard?scope=me')),
      '/login?redirectTo=%2Fworkboard%3Fscope%3Dme',
    )
  })

  it('consumes and drops a valid locale handoff when redirecting unauthenticated users', async () => {
    getSession.mockResolvedValueOnce({ data: null })
    await expectRedirectTo(
      protectedLoader(makeArgs('http://localhost/workboard?scope=me&lng=zh-CN')),
      '/login?redirectTo=%2Fworkboard%3Fscope%3Dme',
    )
    expect(window.localStorage.getItem('lng')).toBe('zh-CN')
    expect(currentLocale()).toBe('zh-CN')
  })

  it('redirects to /login (no redirectTo) when the originating path is /', async () => {
    getSession.mockResolvedValueOnce({ data: null })
    await expectRedirectTo(protectedLoader(makeArgs('http://localhost/')), '/login')
  })

  it('consumes the marketing root locale handoff before redirecting to login', async () => {
    getSession.mockResolvedValueOnce({ data: null })
    await expectRedirectTo(protectedLoader(makeArgs('http://localhost/?lng=zh-CN')), '/login')
    expect(window.localStorage.getItem('lng')).toBe('zh-CN')
    expect(currentLocale()).toBe('zh-CN')
  })

  it('redirects to /onboarding when session has no activeOrganizationId', async () => {
    getSession.mockResolvedValueOnce({ data: makeSession(null) })
    await expectRedirectTo(
      protectedLoader(makeArgs('http://localhost/dashboard')),
      '/onboarding?redirectTo=%2Fdashboard',
    )
  })

  it('returns the user when session has an active firm', async () => {
    getSession.mockResolvedValueOnce({ data: makeSession('firm_1') })
    const result = await protectedLoader(makeArgs('http://localhost/'))
    expect(result).toEqual({ user: { id: 'user_1', name: 'Alex Chen', email: 'alex@example.com' } })
  })
})

describe('onboardingLoader', () => {
  beforeEach(() => {
    getSession.mockReset()
  })

  it('redirects to /login when no session', async () => {
    getSession.mockResolvedValueOnce({ data: null })
    await expectRedirectTo(
      onboardingLoader(makeArgs('http://localhost/onboarding')),
      '/login?redirectTo=/onboarding',
    )
  })

  it('consumes and drops a valid locale handoff when bouncing onboarding to login', async () => {
    getSession.mockResolvedValueOnce({ data: null })
    await expectRedirectTo(
      onboardingLoader(makeArgs('http://localhost/onboarding?lng=zh-CN')),
      '/login?redirectTo=/onboarding',
    )
    expect(window.localStorage.getItem('lng')).toBe('zh-CN')
    expect(currentLocale()).toBe('zh-CN')
  })

  it('redirects to redirectTo (or /) when an active firm already exists', async () => {
    getSession.mockResolvedValueOnce({ data: makeSession('firm_1') })
    await expectRedirectTo(
      onboardingLoader(makeArgs('http://localhost/onboarding?redirectTo=/workboard')),
      '/workboard',
    )

    getSession.mockResolvedValueOnce({ data: makeSession('firm_1') })
    await expectRedirectTo(onboardingLoader(makeArgs('http://localhost/onboarding')), '/')
  })

  it('drops external redirectTo values to defend against open redirect', async () => {
    getSession.mockResolvedValueOnce({ data: makeSession('firm_1') })
    await expectRedirectTo(
      onboardingLoader(makeArgs('http://localhost/onboarding?redirectTo=https://evil.com')),
      '/',
    )
  })

  it('returns the user when session has no activeOrganizationId', async () => {
    getSession.mockResolvedValueOnce({ data: makeSession(null) })
    const result = await onboardingLoader(makeArgs('http://localhost/onboarding'))
    expect(result).toEqual({ user: { id: 'user_1', name: 'Alex Chen', email: 'alex@example.com' } })
  })
})

describe('guestLoader', () => {
  beforeEach(() => {
    getSession.mockReset()
  })

  it('returns null when no session', async () => {
    getSession.mockResolvedValueOnce({ data: null })
    const result = await guestLoader(makeArgs('http://localhost/login'))
    expect(result).toBeNull()
  })

  it('redirects authed users to redirectTo (safe paths only)', async () => {
    getSession.mockResolvedValueOnce({ data: makeSession('firm_1') })
    await expectRedirectTo(guestLoader(makeArgs('http://localhost/login?redirectTo=/')), '/')
  })

  it('consumes and drops a valid locale handoff when redirecting authed users away from login', async () => {
    getSession.mockResolvedValueOnce({ data: makeSession('firm_1') })
    await expectRedirectTo(guestLoader(makeArgs('http://localhost/login?lng=zh-CN')), '/')
    expect(window.localStorage.getItem('lng')).toBe('zh-CN')
    expect(currentLocale()).toBe('zh-CN')
  })

  it('replaces the login URL after consuming lng for unauthenticated users', async () => {
    getSession.mockResolvedValueOnce({ data: null })
    await expectReplaceTo(guestLoader(makeArgs('http://localhost/login?lng=zh-CN')), '/login')
    expect(window.localStorage.getItem('lng')).toBe('zh-CN')
    expect(currentLocale()).toBe('zh-CN')
  })

  it('falls back to / when redirectTo is external', async () => {
    getSession.mockResolvedValueOnce({ data: makeSession('firm_1') })
    await expectRedirectTo(
      guestLoader(makeArgs('http://localhost/login?redirectTo=//evil.com')),
      '/',
    )
  })
})
