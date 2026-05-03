import { describe, expect, it } from 'vitest'
import { canCreateAdditionalFirm, canReadSmartPriorityProfile } from './index'

describe('firm creation entitlement', () => {
  it('allows the first owned active firm', () => {
    expect(canCreateAdditionalFirm([])).toBe(true)
  })

  it('blocks extra self-serve firms for Solo, Pro, and Team owners', () => {
    expect(canCreateAdditionalFirm([{ plan: 'solo' }])).toBe(false)
    expect(canCreateAdditionalFirm([{ plan: 'pro' }])).toBe(false)
    expect(canCreateAdditionalFirm([{ plan: 'team' }])).toBe(false)
  })

  it('allows additional firms for Firm-plan owners', () => {
    expect(canCreateAdditionalFirm([{ plan: 'firm' }])).toBe(true)
  })
})

describe('firm public smart priority visibility', () => {
  it('only exposes the profile to owners', () => {
    expect(
      canReadSmartPriorityProfile({ role: 'owner', ownerUserId: 'user_owner' }, 'user_owner'),
    ).toBe(true)
    expect(
      canReadSmartPriorityProfile({ role: 'manager', ownerUserId: 'user_owner' }, 'user_manager'),
    ).toBe(false)
    expect(
      canReadSmartPriorityProfile({ role: 'preparer', ownerUserId: 'user_owner' }, 'user_preparer'),
    ).toBe(false)
    expect(
      canReadSmartPriorityProfile(
        { role: 'coordinator', ownerUserId: 'user_owner' },
        'user_coordinator',
      ),
    ).toBe(false)
  })
})
