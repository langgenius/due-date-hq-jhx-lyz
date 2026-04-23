import { describe, expect, it } from 'vitest'
import { createDb } from './client'
import { scoped } from './scoped'

const testD1: D1Database = {
  prepare(_query) {
    throw new Error('test D1 prepare not implemented')
  },
  batch: async <T = unknown>(_statements: D1PreparedStatement[]): Promise<D1Result<T>[]> => [],
  exec: async (_query) => ({ count: 0, duration: 0 }),
  withSession(_constraintOrBookmark) {
    throw new Error('test D1 session not implemented')
  },
  dump: async () => new ArrayBuffer(0),
}

const testDb = createDb(testD1)

describe('@duedatehq/db', () => {
  it('carries firmId through the scoped repo boundary', () => {
    const repo = scoped(testDb, 'firm_123')

    expect(repo.firmId).toBe('firm_123')
  })

  it('throws when an unimplemented scoped repo is used', () => {
    const repo = scoped(testDb, 'firm_123')

    expect(() => Reflect.get(repo.clients, 'findMany')).toThrow(
      'ScopedRepo.clients.findMany not implemented yet',
    )
  })
})
