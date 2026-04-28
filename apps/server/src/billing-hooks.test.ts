/* eslint-disable typescript-eslint/no-unsafe-type-assertion --
 * Test doubles model the exact drizzle chain this hook factory uses.
 */
import { describe, expect, it, vi } from 'vitest'
import type { Db } from '@duedatehq/db'
import { buildBillingHooks } from './billing-hooks'

function makeAuthzDb(rows: Array<{ role: string; status: string }>) {
  const limit = vi.fn(async () => rows)
  const where = vi.fn(() => ({ limit }))
  const from = vi.fn(() => ({ where }))
  const select = vi.fn(() => ({ from }))
  return { db: { select } as unknown as Db, limit }
}

function makeUpdateDb() {
  const where = vi.fn(async () => undefined)
  const set = vi.fn(() => ({ where }))
  const update = vi.fn(() => ({ set }))
  return { db: { update } as unknown as Db, set, where }
}

describe('buildBillingHooks', () => {
  it('allows active members to read subscriptions and reserves management for owners', async () => {
    const { db } = makeAuthzDb([{ role: 'coordinator', status: 'active' }])
    const hooks = buildBillingHooks(db)

    await expect(
      hooks.authorizeReference({
        userId: 'user_1',
        sessionId: 'session_1',
        activeOrganizationId: 'firm_1',
        referenceId: 'firm_1',
        action: 'list-subscription' as never,
      }),
    ).resolves.toBe(true)

    await expect(
      hooks.authorizeReference({
        userId: 'user_1',
        sessionId: 'session_1',
        activeOrganizationId: 'firm_1',
        referenceId: 'firm_1',
        action: 'upgrade-subscription' as never,
      }),
    ).resolves.toBe(false)
  })

  it('rejects reference ids outside the active firm before reading membership', async () => {
    const { db, limit } = makeAuthzDb([{ role: 'owner', status: 'active' }])
    const hooks = buildBillingHooks(db)

    await expect(
      hooks.authorizeReference({
        userId: 'user_1',
        sessionId: 'session_1',
        activeOrganizationId: 'firm_1',
        referenceId: 'firm_2',
        action: 'list-subscription' as never,
      }),
    ).resolves.toBe(false)
    expect(limit).not.toHaveBeenCalled()
  })

  it('writes null subscription cache when sync input omits stripeSubscriptionId', async () => {
    const { db, set } = makeUpdateDb()
    const hooks = buildBillingHooks(db)

    await hooks.syncSubscription({
      referenceId: 'firm_1',
      plan: 'solo',
      seatLimit: 1,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: undefined,
      status: 'canceled' as never,
    })

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'solo',
        seatLimit: 1,
        billingCustomerId: 'cus_123',
        billingSubscriptionId: null,
      }),
    )
  })
})
