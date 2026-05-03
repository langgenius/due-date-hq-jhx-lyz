import { describe, expect, it } from 'vitest'
import { canRequestPulseReview } from './PulseDetailDrawer'

describe('canRequestPulseReview', () => {
  it('allows preparers to request review for active Pulse alerts', () => {
    expect(
      canRequestPulseReview({
        role: 'preparer',
        alertStatus: 'matched',
        sourceStatus: 'approved',
      }),
    ).toBe(true)
  })

  it('keeps coordinators and managers out of the Preparer escalation CTA', () => {
    expect(
      canRequestPulseReview({
        role: 'coordinator',
        alertStatus: 'matched',
        sourceStatus: 'approved',
      }),
    ).toBe(false)
    expect(
      canRequestPulseReview({
        role: 'manager',
        alertStatus: 'matched',
        sourceStatus: 'approved',
      }),
    ).toBe(false)
  })

  it('does not allow requests for closed or source-revoked alerts', () => {
    expect(
      canRequestPulseReview({
        role: 'preparer',
        alertStatus: 'dismissed',
        sourceStatus: 'approved',
      }),
    ).toBe(false)
    expect(
      canRequestPulseReview({
        role: 'preparer',
        alertStatus: 'reverted',
        sourceStatus: 'approved',
      }),
    ).toBe(false)
    expect(
      canRequestPulseReview({
        role: 'preparer',
        alertStatus: 'matched',
        sourceStatus: 'source_revoked',
      }),
    ).toBe(false)
  })
})
