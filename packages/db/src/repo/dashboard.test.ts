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
          estimatedExposureCents: null,
          exposureStatus: 'needs_input',
          penaltyFormulaVersion: null,
        },
        {
          obligationId: 'oi_week',
          clientId: 'client_2',
          clientName: 'This Week LLC',
          taxType: 'ny_ct3',
          currentDueDate: due('2026-05-02'),
          status: 'review',
          estimatedExposureCents: 125_000,
          exposureStatus: 'ready',
          penaltyFormulaVersion: 'penalty-v1-2026q2',
        },
        {
          obligationId: 'oi_later',
          clientId: 'client_3',
          clientName: 'Later LLC',
          taxType: 'federal_1120',
          currentDueDate: due('2026-05-20'),
          status: 'waiting_on_client',
          estimatedExposureCents: null,
          exposureStatus: 'unsupported',
          penaltyFormulaVersion: null,
        },
        {
          obligationId: 'oi_day_7',
          clientId: 'client_4',
          clientName: 'Boundary LLC',
          taxType: 'federal_1120',
          currentDueDate: due('2026-05-05'),
          status: 'pending',
          estimatedExposureCents: 80_000,
          exposureStatus: 'ready',
          penaltyFormulaVersion: 'penalty-v1-2026q2',
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
      totalExposureCents: 205_000,
      exposureReadyCount: 2,
      exposureNeedsInputCount: 0,
      exposureUnsupportedCount: 0,
    })
    expect(result.topRows[0]!.obligationId).toBe('oi_overdue')
    expect(result.topRows[0]!.severity).toBe('critical')
    expect(result.topRows[0]!.evidenceCount).toBe(1)
    expect(result.topRows[1]!.obligationId).toBe('oi_week')
    expect(result.triageTabs.map((tab) => [tab.key, tab.count, tab.totalExposureCents])).toEqual([
      ['this_week', 3, 205_000],
      ['this_month', 1, 0],
      ['long_term', 0, 0],
    ])
    expect(result.triageTabs[0]!.rows.map((row) => row.obligationId)).toEqual([
      'oi_overdue',
      'oi_week',
      'oi_day_7',
    ])
  })

  it('assigns rows to exactly one triage tab at dashboard window boundaries', () => {
    const result = composeDashboardLoad(
      [
        ['overdue', '2026-04-27', 10_000],
        ['day_7', '2026-05-05', 20_000],
        ['day_8', '2026-05-06', 30_000],
        ['day_30', '2026-05-28', 40_000],
        ['day_31', '2026-05-29', 50_000],
        ['day_180', '2026-10-25', 60_000],
        ['day_181', '2026-10-26', 70_000],
      ].map(([obligationId, currentDueDate, estimatedExposureCents]) => ({
        obligationId: String(obligationId),
        clientId: `client_${obligationId}`,
        clientName: `${obligationId} LLC`,
        taxType: '1040',
        currentDueDate: due(String(currentDueDate)),
        status: 'pending' as const,
        estimatedExposureCents: Number(estimatedExposureCents),
        exposureStatus: 'ready' as const,
        penaltyFormulaVersion: 'penalty-v1-2026q2',
      })),
      [],
      { asOfDate: AS_OF, windowDays: 7, topLimit: 20 },
    )

    expect(result.triageTabs.map((tab) => [tab.key, tab.count, tab.totalExposureCents])).toEqual([
      ['this_week', 2, 30_000],
      ['this_month', 2, 70_000],
      ['long_term', 2, 110_000],
    ])
    expect(result.triageTabs.flatMap((tab) => tab.rows.map((row) => row.obligationId))).toEqual([
      'overdue',
      'day_7',
      'day_8',
      'day_30',
      'day_180',
      'day_31',
    ])
  })

  it('uses deterministic severity thresholds', () => {
    expect(severityForDueDate(due('2026-04-26'), AS_OF, 'pending')).toBe('critical')
    expect(severityForDueDate(due('2026-04-30'), AS_OF, 'pending')).toBe('critical')
    expect(severityForDueDate(due('2026-05-03'), AS_OF, 'pending')).toBe('high')
    expect(severityForDueDate(due('2026-05-10'), AS_OF, 'review')).toBe('medium')
    expect(severityForDueDate(due('2026-05-30'), AS_OF, 'pending')).toBe('neutral')
  })
})
