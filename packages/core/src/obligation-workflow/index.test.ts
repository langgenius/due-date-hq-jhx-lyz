import { describe, expect, it } from 'vitest'
import {
  CLOSED_OBLIGATION_STATUSES,
  OBLIGATION_STATUS_DISPLAY_KEYS,
  OPEN_OBLIGATION_STATUSES,
  defaultReadinessForStatus,
  isClosedObligationStatus,
  isOpenObligationStatus,
  type ObligationStatus,
} from './index'

describe('obligation workflow state model', () => {
  it('classifies open and closed statuses', () => {
    expect(OPEN_OBLIGATION_STATUSES).toEqual([
      'pending',
      'in_progress',
      'waiting_on_client',
      'review',
    ])
    expect(CLOSED_OBLIGATION_STATUSES).toEqual(['done', 'extended', 'paid', 'not_applicable'])

    expect(isOpenObligationStatus('pending')).toBe(true)
    expect(isOpenObligationStatus('paid')).toBe(false)
    expect(isClosedObligationStatus('extended')).toBe(true)
    expect(isClosedObligationStatus('review')).toBe(false)
  })

  it('keeps DB wire status decoupled from display semantics', () => {
    expect(OBLIGATION_STATUS_DISPLAY_KEYS).toMatchObject({
      pending: 'not_started',
      review: 'needs_review',
      done: 'filed',
    })
  })

  it('derives default readiness without blocking corrective transitions', () => {
    const defaults: Record<ObligationStatus, ReturnType<typeof defaultReadinessForStatus>> = {
      pending: defaultReadinessForStatus('pending', undefined),
      in_progress: defaultReadinessForStatus('in_progress', 'needs_review'),
      waiting_on_client: defaultReadinessForStatus('waiting_on_client', 'ready'),
      review: defaultReadinessForStatus('review', 'ready'),
      done: defaultReadinessForStatus('done', 'waiting'),
      extended: defaultReadinessForStatus('extended', 'waiting'),
      paid: defaultReadinessForStatus('paid', 'needs_review'),
      not_applicable: defaultReadinessForStatus('not_applicable', 'needs_review'),
    }

    expect(defaults).toEqual({
      pending: 'ready',
      in_progress: 'needs_review',
      waiting_on_client: 'waiting',
      review: 'needs_review',
      done: 'ready',
      extended: 'ready',
      paid: 'ready',
      not_applicable: 'ready',
    })
  })
})
