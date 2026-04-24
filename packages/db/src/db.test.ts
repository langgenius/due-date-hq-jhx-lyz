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

  it('wires concrete migration copilot repos and leaves pulse deferred', () => {
    const repo = scoped(testDb, 'firm_123')

    expect(typeof repo.clients.create).toBe('function')
    expect(typeof repo.obligations.createBatch).toBe('function')
    expect(typeof repo.migration.createBatch).toBe('function')
    expect(typeof repo.audit.write).toBe('function')
    expect(typeof repo.evidence.write).toBe('function')
    expect(() => Reflect.get(repo.pulse, 'findMany')).toThrow(
      'ScopedRepo.pulse.findMany not implemented yet',
    )
  })
})
