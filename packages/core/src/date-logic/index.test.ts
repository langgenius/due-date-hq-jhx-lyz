import { describe, expect, it } from 'vitest'
import { expandDueDateLogic } from './index'

describe('@duedatehq/core/date-logic', () => {
  it('expands tax-year-end rules and rolls weekends to the next business day', () => {
    const [due] = expandDueDateLogic(
      {
        kind: 'nth_day_after_tax_year_end',
        monthOffset: 3,
        day: 15,
        holidayRollover: 'next_business_day',
      },
      { taxYearEnd: '2025-12-31' },
    )

    expect(due).toMatchObject({
      period: 'tax_year',
      dueDate: '2026-03-16',
      requiresReview: false,
    })
  })

  it('expands tax-year-start payment rules', () => {
    const [due] = expandDueDateLogic(
      {
        kind: 'nth_day_after_tax_year_begin',
        monthOffset: 4,
        day: 15,
        holidayRollover: 'next_business_day',
      },
      { taxYearStart: '2026-01-01' },
    )

    expect(due?.dueDate).toBe('2026-04-15')
  })

  it('passes source-adjusted period tables through unchanged', () => {
    const dates = expandDueDateLogic({
      kind: 'period_table',
      frequency: 'quarterly',
      periods: [{ period: '2026-Q4', dueDate: '2027-02-01' }],
      holidayRollover: 'source_adjusted',
    })

    expect(dates).toEqual([
      {
        period: '2026-Q4',
        dueDate: '2027-02-01',
        sourceDefined: true,
        requiresReview: false,
        reason: null,
      },
    ])
  })

  it('returns a review-needed item for source-defined calendars', () => {
    const [due] = expandDueDateLogic({
      kind: 'source_defined_calendar',
      description: 'Use official taxable-year-end table.',
      holidayRollover: 'source_adjusted',
    })

    expect(due).toMatchObject({
      period: 'source_defined',
      dueDate: null,
      sourceDefined: true,
      requiresReview: true,
    })
  })
})
