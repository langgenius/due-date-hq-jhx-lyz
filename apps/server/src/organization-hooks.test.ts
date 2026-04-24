/* eslint-disable typescript-eslint/no-unsafe-type-assertion --
 * Test stubs deliberately cast minimal-shape fixtures into the rich
 * better-auth payload types. Building real values would mean reproducing
 * the entire User / Member / Organization shapes for every test, which
 * adds noise without catching anything the typed factory doesn't already
 * enforce.
 */
import { describe, expect, it, vi } from 'vitest'
import { APIError } from 'better-auth/api'
import type { Db } from '@duedatehq/db'
import { buildOrganizationHooks } from './organization-hooks'

/**
 * Pure-function tests for the organization-plugin hook factory.
 *
 * Plan deviation note (recorded in dev-log 2026-04-24): the plan's
 * `test-auth-hook` todo named `packages/auth/src/auth.test.ts` as the home
 * for these assertions, but the factory itself lives in apps/server because
 * it imports the firm_profile schema (packages/auth must NOT depend on
 * @duedatehq/db — see scripts/check-dep-direction.mjs). Putting the test
 * next to its subject keeps both sides on the same side of the dep DAG.
 */

function makeFakeDb(opts: { insertImpl?: () => Promise<void> } = {}): {
  db: Db
  insertSpy: ReturnType<typeof vi.fn>
  valuesSpy: ReturnType<typeof vi.fn>
} {
  const valuesSpy = vi.fn(opts.insertImpl ?? (async () => undefined))
  const insertSpy = vi.fn(() => ({ values: valuesSpy }))
  // Cast through unknown — the real Db has many more methods our hook
  // doesn't touch; the factory only needs db.insert.
  const db = { insert: insertSpy } as unknown as Db
  return { db, insertSpy, valuesSpy }
}

describe('buildOrganizationHooks', () => {
  describe('afterCreateOrganization', () => {
    it('inserts a P0-shaped firm_profile row keyed by organization.id', async () => {
      const { db, insertSpy, valuesSpy } = makeFakeDb()
      const hooks = buildOrganizationHooks(db)

      await hooks.afterCreateOrganization!({
        organization: {
          id: 'org_abc',
          name: 'Bright CPA Practice',
          slug: 'bright-cpa-x1y2z3',
          createdAt: new Date(),
          metadata: null,
        } as never,
        member: { id: 'mem_1', userId: 'user_1', organizationId: 'org_abc' } as never,
        user: {
          id: 'user_1',
          name: 'Alex Chen',
          email: 'alex@bright-cpa.com',
        } as never,
      })

      expect(insertSpy).toHaveBeenCalledTimes(1)
      expect(valuesSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'org_abc',
          name: 'Bright CPA Practice',
          plan: 'solo',
          seatLimit: 1,
          timezone: 'America/New_York',
          ownerUserId: 'user_1',
          status: 'active',
        }),
      )
      // createdAt / updatedAt must be Dates (not undefined / strings) so the
      // drizzle integer-timestamp serialization picks the same path as the
      // explicit defaults in the schema.
      const args = valuesSpy.mock.calls[0]?.[0] as { createdAt: Date; updatedAt: Date }
      expect(args.createdAt).toBeInstanceOf(Date)
      expect(args.updatedAt).toBeInstanceOf(Date)
    })

    it('swallows insert errors and logs them so onboarding submit still resolves', async () => {
      const error = new Error('boom: simulated D1 failure')
      const { db } = makeFakeDb({
        insertImpl: () => {
          throw error
        },
      })
      const hooks = buildOrganizationHooks(db)
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      try {
        await expect(
          hooks.afterCreateOrganization!({
            organization: { id: 'org_x', name: 'Other Practice' } as never,
            member: {} as never,
            user: { id: 'user_2' } as never,
          }),
        ).resolves.toBeUndefined()

        expect(errorSpy).toHaveBeenCalledWith(
          '[firm_profile.afterCreateOrganization] insert failed',
          expect.objectContaining({
            orgId: 'org_x',
            userId: 'user_2',
            message: 'boom: simulated D1 failure',
          }),
        )
      } finally {
        errorSpy.mockRestore()
      }
    })
  })

  describe('beforeAddMember', () => {
    it('rejects non-owner roles with APIError(FORBIDDEN)', async () => {
      const { db } = makeFakeDb()
      const hooks = buildOrganizationHooks(db)

      const promise = hooks.beforeAddMember!({
        member: { userId: 'user_3', organizationId: 'org_x', role: 'member' },
        organization: { id: 'org_x', name: 'X' } as never,
        user: { id: 'user_3' } as never,
      })

      await expect(promise).rejects.toBeInstanceOf(APIError)
      await expect(promise).rejects.toMatchObject({
        // better-auth's APIError exposes the status string we passed in.
        message: expect.stringContaining('P0 only allows the creator owner'),
      })
    })

    it('allows the creator owner role to pass through', async () => {
      const { db } = makeFakeDb()
      const hooks = buildOrganizationHooks(db)

      await expect(
        hooks.beforeAddMember!({
          member: { userId: 'user_4', organizationId: 'org_y', role: 'owner' },
          organization: { id: 'org_y', name: 'Y' } as never,
          user: { id: 'user_4' } as never,
        }),
      ).resolves.toBeUndefined()
    })
  })
})
