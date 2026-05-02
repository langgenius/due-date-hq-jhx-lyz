/* eslint-disable typescript-eslint/no-unsafe-type-assertion --
 * Drizzle select builders are mocked narrowly so we can inspect generated SQL.
 */
import { describe, expect, it, vi } from 'vitest'
import { SQLiteSyncDialect } from 'drizzle-orm/sqlite-core'
import type { SQL } from 'drizzle-orm'
import type { Db } from '../client'
import { makeFirmsRepo } from './firms'

function createFirmSelectDb() {
  const orderBy = vi.fn(async () => [])
  const where = vi.fn((_expr: SQL) => ({ orderBy }))
  const innerJoinOrganization = vi.fn(() => ({ where }))
  const innerJoinFirmProfile = vi.fn(() => ({ innerJoin: innerJoinOrganization }))
  const from = vi.fn(() => ({ innerJoin: innerJoinFirmProfile }))
  const select = vi.fn(() => ({ from }))

  return {
    db: { select } as unknown as Db,
    where,
  }
}

function normalizeWhere(expr: SQL) {
  const dialect = new SQLiteSyncDialect()
  return dialect.sqlToQuery(expr)
}

describe('makeFirmsRepo', () => {
  it('counts only active firms owned by the user for creation entitlement', async () => {
    const fake = createFirmSelectDb()
    const repo = makeFirmsRepo(fake.db)

    await repo.listOwnedActive('user_1')

    const where = normalizeWhere(fake.where.mock.calls[0]![0])
    expect(where.sql).toBe(
      [
        '("member"."user_id" = ?',
        'and "member"."status" = ?',
        'and "firm_profile"."owner_user_id" = ?',
        'and "firm_profile"."status" = ?',
        'and "firm_profile"."deleted_at" is null)',
      ].join(' '),
    )
    expect(where.params).toEqual(['user_1', 'active', 'user_1', 'active'])
  })
})
