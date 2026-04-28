import { describe, expect, it } from 'vitest'
import { composeDashboardLoad, severityForDueDate } from './dashboard'

const AS_OF = '2026-04-28'

function due(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`)
}

describe('dashboard aggregation', () => {
  it('computes activation summary from real obligation rows', () => {
    const result = composeDashboardLoad(
      [
        {
          obligationId: 'oi_overdue',
          clientId: 'client_1',
          clientName: 'Overdue LLC',
          taxType: 'ca_100',
          currentDueDate: due('2026-04-27'),
          status: 'pending',
        },
        {
          obligationId: 'oi_week',
          clientId: 'client_2',
          clientName: 'This Week LLC',
          taxType: 'ny_ct3',
          currentDueDate: due('2026-05-02'),
          status: 'review',
        },
        {
          obligationId: 'oi_later',
          clientId: 'client_3',
          clientName: 'Later LLC',
          taxType: 'federal_1120',
          currentDueDate: due('2026-05-20'),
          status: 'waiting_on_client',
        },
        {
          obligationId: 'oi_day_7',
          clientId: 'client_4',
          clientName: 'Boundary LLC',
          taxType: 'federal_1120',
          currentDueDate: due('2026-05-05'),
          status: 'pending',
        },
      ],
      [
        {
          id: 'ev_1',
          obligationInstanceId: 'oi_overdue',
          aiOutputId: null,
          sourceType: 'verified_rule',
          sourceId: 'rule_1',
          sourceUrl: null,
          verbatimQuote: null,
          rawValue: null,
          normalizedValue: null,
          confidence: 1,
          model: null,
          appliedAt: due('2026-04-28'),
        },
      ],
      { asOfDate: AS_OF, windowDays: 7, topLimit: 8 },
    )

    expect(result.summary).toEqual({
      openObligationCount: 4,
      dueThisWeekCount: 2,
      needsReviewCount: 1,
      evidenceGapCount: 3,
    })
    expect(result.topRows[0]!.obligationId).toBe('oi_overdue')
    expect(result.topRows[0]!.severity).toBe('critical')
    expect(result.topRows[0]!.evidenceCount).toBe(1)
    expect(result.topRows[1]!.obligationId).toBe('oi_week')
  })

  it('uses deterministic severity thresholds', () => {
    expect(severityForDueDate(due('2026-04-26'), AS_OF, 'pending')).toBe('critical')
    expect(severityForDueDate(due('2026-04-30'), AS_OF, 'pending')).toBe('critical')
    expect(severityForDueDate(due('2026-05-03'), AS_OF, 'pending')).toBe('high')
    expect(severityForDueDate(due('2026-05-10'), AS_OF, 'review')).toBe('medium')
    expect(severityForDueDate(due('2026-05-30'), AS_OF, 'pending')).toBe('neutral')
  })
})
