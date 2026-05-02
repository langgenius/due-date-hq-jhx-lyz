import { describe, expect, it } from 'vitest'
import { rankSmartPriorities, scoreSmartPriority, smartPriorityDaysUntilDue } from './index'

const baseInput = {
  obligationId: 'obligation_1',
  currentDueDate: '2026-05-10',
  asOfDate: '2026-05-01',
  status: 'pending' as const,
  estimatedExposureCents: 250_000,
  exposureStatus: 'ready' as const,
  importanceWeight: 2,
  lateFilingCountLast12mo: 0,
  evidenceCount: 1,
}

describe('smart priority', () => {
  it('scores the documented factors with stable weights', () => {
    const result = scoreSmartPriority(baseInput)

    expect(result.version).toBe('smart-priority-v1')
    expect(result.rank).toBeNull()
    expect(result.score).toBe(36.3)
    expect(result.factors.map((factor) => [factor.key, factor.weight])).toEqual([
      ['exposure', 0.45],
      ['urgency', 0.25],
      ['importance', 0.15],
      ['history', 0.1],
      ['readiness', 0.05],
    ])
  })

  it('raises blocked work through the readiness pressure factor', () => {
    const ready = scoreSmartPriority(baseInput)
    const waiting = scoreSmartPriority({ ...baseInput, status: 'waiting_on_client' })

    expect(waiting.score).toBeGreaterThan(ready.score)
    expect(waiting.factors.find((factor) => factor.key === 'readiness')?.rawValue).toBe(
      'waiting on client',
    )
  })

  it('ranks by score, then due date, then id', () => {
    const rows = rankSmartPriorities([
      { ...baseInput, obligationId: 'c', estimatedExposureCents: 100_000 },
      {
        ...baseInput,
        obligationId: 'b',
        currentDueDate: '2026-05-05',
        estimatedExposureCents: 100_000,
      },
      {
        ...baseInput,
        obligationId: 'a',
        estimatedExposureCents: 900_000,
        importanceWeight: 3,
        lateFilingCountLast12mo: 5,
      },
    ])

    expect(rows.map((item) => [item.row.obligationId, item.smartPriority.rank])).toEqual([
      ['a', 1],
      ['b', 2],
      ['c', 3],
    ])
  })

  it('computes date-only urgency without timezone drift', () => {
    expect(
      smartPriorityDaysUntilDue({
        currentDueDate: new Date('2026-05-02T23:30:00.000Z'),
        asOfDate: '2026-05-01',
      }),
    ).toBe(1)
  })
})
