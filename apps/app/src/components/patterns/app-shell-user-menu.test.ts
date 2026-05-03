import { describe, expect, it } from 'vitest'
import { currentPathForDemoSwitch, demoAccountSwitchHref, isDemoUser } from './app-shell-user-menu'

describe('app shell demo account switcher helpers', () => {
  it('only enables the demo account switcher for mock users', () => {
    expect(isDemoUser({ id: 'mock_user_owner_sarah' })).toBe(true)
    expect(isDemoUser({ id: 'user_123' })).toBe(false)
    expect(isDemoUser(null)).toBe(false)
  })

  it('preserves the current path, search, and hash when building the redirect target', () => {
    expect(
      currentPathForDemoSwitch({
        pathname: '/workboard',
        search: '?owner=unassigned',
        hash: '#row-1',
      }),
    ).toBe('/workboard?owner=unassigned#row-1')
  })

  it('builds demo account switch hrefs with role and redirectTo params', () => {
    expect(demoAccountSwitchHref('manager', '/workboard?owner=unassigned#row-1')).toBe(
      '/api/e2e/demo-login?role=manager&redirectTo=%2Fworkboard%3Fowner%3Dunassigned%23row-1',
    )
  })
})
