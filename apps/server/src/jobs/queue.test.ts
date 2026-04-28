import { describe, expect, it } from 'vitest'
import { assertQueueDispatchable } from './queue'

function batch(messages: unknown[]) {
  return {
    queue: 'due-date-hq-email-staging',
    messages,
  }
}

describe('queue consumer', () => {
  it('does not acknowledge non-empty batches until a dispatcher exists', () => {
    expect(() => assertQueueDispatchable(batch([{ body: { type: 'test' } }]))).toThrow(
      'No queue dispatcher is implemented',
    )
  })

  it('allows empty batches', () => {
    expect(() => assertQueueDispatchable(batch([]))).not.toThrow()
  })
})
