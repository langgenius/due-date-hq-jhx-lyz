import { describe, expect, it, vi } from 'vitest'
import type { FirmPublic } from '@duedatehq/contracts'
import { activateOrCreateOnboardingFirm, type OnboardingFirmGateway } from './onboarding-firm-flow'

function firm(overrides: Partial<FirmPublic> = {}): FirmPublic {
  return {
    id: 'firm_1',
    name: 'Bright CPA',
    slug: 'bright-cpa',
    plan: 'solo',
    seatLimit: 1,
    timezone: 'America/New_York',
    status: 'active',
    role: 'owner',
    ownerUserId: 'user_1',
    isCurrent: false,
    createdAt: '2026-04-29T00:00:00.000Z',
    updatedAt: '2026-04-29T00:00:00.000Z',
    deletedAt: null,
    ...overrides,
  }
}

function gateway(overrides: Partial<OnboardingFirmGateway> = {}): OnboardingFirmGateway {
  return {
    listMine: vi.fn(async () => []),
    switchActive: vi.fn(async ({ firmId }) => firm({ id: firmId, isCurrent: true })),
    create: vi.fn(async ({ name, timezone }) => firm({ id: 'firm_new', name, timezone })),
    ...overrides,
  }
}

describe('activateOrCreateOnboardingFirm', () => {
  it('switches through the firms gateway when an active business firm exists', async () => {
    const existing = firm({ id: 'firm_existing' })
    const api = gateway({
      listMine: vi.fn(async () => [existing]),
    })

    const result = await activateOrCreateOnboardingFirm({ gateway: api, name: 'New Name' })

    expect(result).toEqual({
      kind: 'reused',
      firm: firm({ id: 'firm_existing', isCurrent: true }),
    })
    expect(api.switchActive).toHaveBeenCalledWith({ firmId: 'firm_existing' })
    expect(api.create).not.toHaveBeenCalled()
  })

  it('creates through the firms gateway when no active business firm exists', async () => {
    const api = gateway()

    const result = await activateOrCreateOnboardingFirm({ gateway: api, name: 'New Practice' })

    expect(result).toEqual({
      kind: 'created',
      firm: firm({ id: 'firm_new', name: 'New Practice' }),
    })
    expect(api.create).toHaveBeenCalledWith({
      name: 'New Practice',
      timezone: 'America/New_York',
    })
    expect(api.switchActive).not.toHaveBeenCalled()
  })

  it('does not create a duplicate firm when listing existing firms fails', async () => {
    const api = gateway({
      listMine: vi.fn(async () => {
        throw new Error('list failed')
      }),
    })

    await expect(
      activateOrCreateOnboardingFirm({ gateway: api, name: 'New Practice' }),
    ).rejects.toThrow('list failed')
    expect(api.create).not.toHaveBeenCalled()
    expect(api.switchActive).not.toHaveBeenCalled()
  })
})
