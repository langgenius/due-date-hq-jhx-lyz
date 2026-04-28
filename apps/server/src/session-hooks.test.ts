/* eslint-disable typescript-eslint/no-unsafe-type-assertion --
 * Test stubs fake the drizzle chain with minimal shapes. Building the real
 * Db type would require the whole drizzle schema bundle — the factory only
 * touches db.select / from / innerJoin / where / orderBy / limit.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Db } from '@duedatehq/db'
import { buildDatabaseHooks } from './session-hooks'

function makeFakeDb(rows: Array<{ organizationId: string }>): {
  db: Db
  limitSpy: ReturnType<typeof vi.fn>
  innerJoinSpy: ReturnType<typeof vi.fn>
} {
  const limitSpy = vi.fn(async () => rows)
  const orderBy = vi.fn(() => ({ limit: limitSpy }))
  const where = vi.fn(() => ({ orderBy }))
  const innerJoinSpy = vi.fn(() => ({ where }))
  const from = vi.fn(() => ({ innerJoin: innerJoinSpy }))
  const select = vi.fn(() => ({ from }))
  const db = { select } as unknown as Db
  return { db, limitSpy, innerJoinSpy }
}

function baseSession(userId: string | undefined) {
  return {
    id: 'sess_x',
    userId: userId as string,
    expiresAt: new Date(),
    token: 'tok',
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

describe('buildDatabaseHooks.session.create.before', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('sets activeOrganizationId from the earliest active membership when the user has one', async () => {
    const { db, limitSpy, innerJoinSpy } = makeFakeDb([{ organizationId: 'firm_early' }])
    const hooks = buildDatabaseHooks(db)
    const before = hooks.session?.create?.before
    expect(before).toBeDefined()

    const result = await before!(baseSession('user_1') as never, null)

    expect(limitSpy).toHaveBeenCalledTimes(1)
    expect(innerJoinSpy).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({
      data: { activeOrganizationId: 'firm_early', userId: 'user_1' },
    })
  })

  it('relies on the firm_profile active join before choosing a returning firm', async () => {
    const { db, innerJoinSpy } = makeFakeDb([{ organizationId: 'firm_active_second' }])
    const hooks = buildDatabaseHooks(db)

    const result = await hooks.session!.create!.before!(baseSession('user_1') as never, null)

    expect(innerJoinSpy).toHaveBeenCalledTimes(1)
    expect(result).toMatchObject({
      data: { activeOrganizationId: 'firm_active_second', userId: 'user_1' },
    })
  })

  it('returns undefined when the user has no active memberships (first-time signup)', async () => {
    const { db, limitSpy } = makeFakeDb([])
    const hooks = buildDatabaseHooks(db)
    const result = await hooks.session!.create!.before!(baseSession('user_new') as never, null)

    expect(limitSpy).toHaveBeenCalledTimes(1)
    expect(result).toBeUndefined()
  })

  it('returns undefined without hitting the db when userId is missing', async () => {
    const { db, limitSpy } = makeFakeDb([])
    const hooks = buildDatabaseHooks(db)
    const result = await hooks.session!.create!.before!(baseSession(undefined) as never, null)

    expect(limitSpy).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
