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
  const updateWhere = vi.fn(async () => undefined)
  const set = vi.fn(() => ({ where: updateWhere }))
  const update = vi.fn(() => ({ set }))
  const selectResults = [
    [] as Array<{ id: string; role: string; createdAt: Date }>,
    [] as Array<{ id: string }>,
  ]
  const orderBy = vi.fn(async () => selectResults.shift() ?? [])
  const selectWhere = vi.fn(() => ({ orderBy }))
  const from = vi.fn(() => ({ where: selectWhere }))
  const select = vi.fn(() => ({ from }))
  return { db: { update, select } as unknown as Db, set, updateWhere }
}

function makeOverLimitUpdateDb() {
  const updateWhere = vi.fn(async () => undefined)
  const set = vi.fn(() => ({ where: updateWhere }))
  const update = vi.fn(() => ({ set }))
  const selectResults = [
    [
      { id: 'member_owner', role: 'owner', createdAt: new Date('2026-01-01T00:00:00.000Z') },
      { id: 'member_manager', role: 'manager', createdAt: new Date('2026-01-02T00:00:00.000Z') },
      { id: 'member_preparer', role: 'preparer', createdAt: new Date('2026-01-03T00:00:00.000Z') },
    ],
    [{ id: 'invitation_1' }, { id: 'invitation_2' }],
  ]
  const orderBy = vi.fn(async () => selectResults.shift() ?? [])
  const selectWhere = vi.fn(() => ({ orderBy }))
  const from = vi.fn(() => ({ where: selectWhere }))
  const select = vi.fn(() => ({ from }))
  return { db: { update, select } as unknown as Db, set, updateWhere }
}

describe('buildBillingHooks', () => {
  it('allows billing readers to list subscriptions and reserves management for owners', async () => {
    const { db } = makeAuthzDb([{ role: 'manager', status: 'active' }])
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
  })

  it('rejects preparer and coordinator billing reads', async () => {
    const coordinator = buildBillingHooks(
      makeAuthzDb([{ role: 'coordinator', status: 'active' }]).db,
    )
    const preparer = buildBillingHooks(makeAuthzDb([{ role: 'preparer', status: 'active' }]).db)

    const input = {
      userId: 'user_1',
      sessionId: 'session_1',
      activeOrganizationId: 'firm_1',
      referenceId: 'firm_1',
      action: 'list-subscription' as never,
    }

    await expect(coordinator.authorizeReference(input)).resolves.toBe(false)
    await expect(preparer.authorizeReference(input)).resolves.toBe(false)
  })

  it('reserves billing management for owners', async () => {
    const { db } = makeAuthzDb([{ role: 'manager', status: 'active' }])
    const hooks = buildBillingHooks(db)

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

  it('writes Team plan and seat limit from subscription sync input', async () => {
    const { db, set } = makeUpdateDb()
    const hooks = buildBillingHooks(db)

    await hooks.syncSubscription({
      referenceId: 'firm_1',
      plan: 'team',
      seatLimit: 10,
      stripeCustomerId: 'cus_team',
      stripeSubscriptionId: 'sub_team',
      status: 'active' as never,
    })

    expect(set).toHaveBeenCalledWith(
      expect.objectContaining({
        plan: 'team',
        seatLimit: 10,
        billingCustomerId: 'cus_team',
        billingSubscriptionId: 'sub_team',
      }),
    )
  })

  it('suspends over-limit non-owners and cancels excess pending invitations', async () => {
    const { db, set } = makeOverLimitUpdateDb()
    const hooks = buildBillingHooks(db)

    await hooks.syncSubscription({
      referenceId: 'firm_1',
      plan: 'solo',
      seatLimit: 1,
      stripeCustomerId: 'cus_123',
      stripeSubscriptionId: undefined,
      status: 'canceled' as never,
    })

    expect(set).toHaveBeenCalledWith(expect.objectContaining({ status: 'suspended' }))
    expect(set).toHaveBeenCalledWith(expect.objectContaining({ status: 'canceled' }))
  })
})
