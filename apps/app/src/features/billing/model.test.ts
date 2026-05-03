import { SMART_PRIORITY_DEFAULT_PROFILE, type FirmPublic } from '@duedatehq/contracts'
import { describe, expect, it } from 'vitest'
import { activeFirmEntitlementLimit, canCreateAdditionalFirm, ownedActiveFirms } from './model'

function firm(overrides: Partial<FirmPublic> = {}): FirmPublic {
  return {
    id: 'firm_1',
    name: 'Test Firm',
    slug: 'test-firm',
    plan: 'solo',
    seatLimit: 1,
    timezone: 'America/New_York',
    status: 'active',
    role: 'owner',
    ownerUserId: 'user_1',
    coordinatorCanSeeDollars: false,
    smartPriorityProfile: SMART_PRIORITY_DEFAULT_PROFILE,
    isCurrent: true,
    createdAt: '2026-05-02T00:00:00.000Z',
    updatedAt: '2026-05-02T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  }
}

describe('billing firm entitlement model', () => {
  it('counts only owned active firms', () => {
    expect(
      ownedActiveFirms([
        firm({ id: 'owned_active' }),
        firm({ id: 'member_active', role: 'manager' }),
        firm({ id: 'owned_deleted', deletedAt: '2026-05-02T00:00:00.000Z' }),
        firm({ id: 'owned_suspended', status: 'suspended' }),
      ]).map((item) => item.id),
    ).toEqual(['owned_active'])
  })

  it('allows first owned firm and blocks extra self-serve firms', () => {
    expect(canCreateAdditionalFirm([])).toBe(true)
    expect(activeFirmEntitlementLimit([firm({ plan: 'solo' })])).toBe(1)
    expect(canCreateAdditionalFirm([firm({ plan: 'solo' })])).toBe(false)
    expect(canCreateAdditionalFirm([firm({ plan: 'pro' })])).toBe(false)
  })

  it('treats Firm plan as contract-limited for additional firms', () => {
    expect(activeFirmEntitlementLimit([firm({ plan: 'firm' })])).toBeNull()
    expect(canCreateAdditionalFirm([firm({ plan: 'firm' })])).toBe(true)
  })
})
