/* eslint-disable typescript-eslint/no-unsafe-type-assertion --
 * Drizzle update builders are mocked narrowly so we can inspect generated SQL.
 */
import { describe, expect, it, vi } from 'vitest'
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core'
import type { SQL } from 'drizzle-orm'
import type { Db } from '../client'
import { makeMembersRepo } from './members'

function createWriteOnlyDb() {
  const where = vi.fn(async (_expr: SQL) => undefined)
  const set = vi.fn(() => ({ where }))
  const update = vi.fn(() => ({ set }))

  return {
    db: { update } as unknown as Db,
    set,
    where,
  }
}

function normalizeWhere(expr: SQL) {
  const dialect = new SQLiteSyncDialect()
  return dialect.sqlToQuery(expr)
}

describe('makeMembersRepo writes', () => {
  it('keeps role updates scoped to the firm and member id', async () => {
    const fake = createWriteOnlyDb()
    const repo = makeMembersRepo(fake.db)

    await repo.updateRole('firm_a', 'member_1', 'manager')

    expect(fake.set).toHaveBeenCalledWith({ role: 'manager' })
    const where = normalizeWhere(fake.where.mock.calls[0]![0])
    expect(where.sql).toBe('("member"."organization_id" = ? and "member"."id" = ?)')
    expect(where.params).toEqual(['firm_a', 'member_1'])
  })

  it('keeps status updates scoped to the firm and member id', async () => {
    const fake = createWriteOnlyDb()
    const repo = makeMembersRepo(fake.db)

    await repo.setMemberStatus('firm_a', 'member_1', 'suspended')

    expect(fake.set).toHaveBeenCalledWith({ status: 'suspended' })
    const where = normalizeWhere(fake.where.mock.calls[0]![0])
    expect(where.sql).toBe('("member"."organization_id" = ? and "member"."id" = ?)')
    expect(where.params).toEqual(['firm_a', 'member_1'])
  })
})
