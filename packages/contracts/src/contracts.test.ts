import { describe, expect, it } from 'vitest'
import { ErrorCodes } from './errors'
import { ClientSchema } from './shared/client'

describe('@duedatehq/contracts', () => {
  it('keeps shared error codes stable', () => {
    expect(ErrorCodes.TENANT_MISSING).toBe('TENANT_MISSING')
    expect(ErrorCodes.GUARD_REJECTED).toBe('GUARD_REJECTED')
  })

  it('validates shared client payloads', () => {
    const parsed = ClientSchema.parse({
      id: '4f3d4f6f-3da3-49d6-b663-28e9b6e7b895',
      firmId: '2b3fe0da-448d-4ae4-a041-f8264bb9c926',
      name: 'Acme Holdings LLC',
      entityType: 'llc',
      state: 'CA',
      ein: null,
      email: null,
      createdAt: '2026-04-23T00:00:00.000Z',
      updatedAt: '2026-04-23T00:00:00.000Z',
    })

    expect(parsed.state).toBe('CA')
  })
})
