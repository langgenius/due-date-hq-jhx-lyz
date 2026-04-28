import { describe, expect, it } from 'vitest'
import { toAuditEventPublic } from './index'

describe('audit procedure serializers', () => {
  it('serializes audit rows for the public contract', () => {
    const event = toAuditEventPublic({
      id: '33333333-3333-4333-8333-333333333333',
      firmId: 'firm_123',
      actorId: null,
      actorLabel: null,
      entityType: 'migration_batch',
      entityId: 'batch_123',
      action: 'migration.imported',
      beforeJson: undefined,
      afterJson: { status: 'applied' },
      reason: null,
      ipHash: null,
      userAgentHash: 'ua_hash',
      createdAt: new Date('2026-04-28T00:00:00.000Z'),
    })

    expect(event).toEqual({
      id: '33333333-3333-4333-8333-333333333333',
      firmId: 'firm_123',
      actorId: null,
      actorLabel: null,
      entityType: 'migration_batch',
      entityId: 'batch_123',
      action: 'migration.imported',
      beforeJson: null,
      afterJson: { status: 'applied' },
      reason: null,
      ipHash: null,
      userAgentHash: 'ua_hash',
      createdAt: '2026-04-28T00:00:00.000Z',
    })
  })
})
