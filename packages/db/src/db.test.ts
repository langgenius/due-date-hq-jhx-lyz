import { describe, expect, it } from 'vitest'
import { scoped } from './scoped'

describe('@duedatehq/db', () => {
  it('carries firmId through the scoped repo boundary', () => {
    const repo = scoped({} as never, 'firm_123')

    expect(repo.firmId).toBe('firm_123')
  })

  it('throws when an unimplemented scoped repo is used', () => {
    const repo = scoped({} as never, 'firm_123')

    expect(() => repo.clients.findMany).toThrow('ScopedRepo.clients.findMany not implemented yet')
  })
})
