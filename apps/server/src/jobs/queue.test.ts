import { describe, expect, it } from 'vitest'
import { assertQueueDispatchable } from './queue'

function batch(messages: Array<{ body?: unknown }>) {
  return {
    queue: 'due-date-hq-email-staging',
    messages,
  }
}

describe('queue consumer', () => {
  it('rejects unsupported non-empty batches', () => {
    expect(() => assertQueueDispatchable(batch([{ body: { type: 'test' } }]))).toThrow(
      'No queue dispatcher is implemented',
    )
  })

  it('allows empty batches', () => {
    expect(() => assertQueueDispatchable(batch([]))).not.toThrow()
  })

  it('allows dashboard brief refresh messages', () => {
    expect(() =>
      assertQueueDispatchable(
        batch([
          {
            body: {
              type: 'dashboard.brief.refresh',
              firmId: 'firm_1',
              scope: 'firm',
              reason: 'manual_refresh',
              idempotencyKey: 'key',
              requestedAt: '2026-04-29T00:00:00.000Z',
            },
          },
        ]),
      ),
    ).not.toThrow()
  })
})
