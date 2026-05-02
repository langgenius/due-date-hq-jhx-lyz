import { describe, expect, it } from 'vitest'

import {
  countRulesByFilter,
  countSourcesByHealth,
  DEFAULT_PREVIEW_FORM_VALUES,
  DEFAULT_RULES_TAB,
  filterRules,
  filterSources,
  groupPreviewRows,
  humanizeDueDateLogic,
  isRulesTab,
  PREVIEW_CLIENT_OPTIONS,
  previewCalendarYearFromFormDates,
  previewCalendarYearToFormDates,
  previewFormToInput,
  RULES_TAB_VALUES,
} from './rules-console-model'

describe('rules console model', () => {
  it('guards tab values from the shared literal tuple', () => {
    expect(DEFAULT_RULES_TAB).toBe('coverage')
    expect(RULES_TAB_VALUES).toEqual(['coverage', 'sources', 'library', 'preview'])
    expect(RULES_TAB_VALUES.every(isRulesTab)).toBe(true)
    expect(isRulesTab('publish')).toBe(false)
  })

  it('converts preview form values into contract input', () => {
    expect(previewFormToInput(DEFAULT_PREVIEW_FORM_VALUES)).toEqual({
      client: {
        id: 'cli_demo_acme_llc',
        entityType: 'llc',
        state: 'CA',
        taxTypes: ['federal_1065_or_1040', 'ca_llc_franchise_min_800', 'ca_llc_fee_gross_receipts'],
        taxYearStart: '2026-01-01',
        taxYearEnd: '2025-12-31',
      },
    })
  })

  it('keeps preview client options parseable by the form contract', () => {
    expect(PREVIEW_CLIENT_OPTIONS.map((option) => option.clientId)).toEqual([
      'cli_demo_acme_llc',
      'cli_demo_hudson_scorp',
      'cli_demo_suncoast_c_corp',
    ])
    expect(
      PREVIEW_CLIENT_OPTIONS.map((option) =>
        previewFormToInput({
          ...DEFAULT_PREVIEW_FORM_VALUES,
          ...option,
        }),
      ),
    ).toHaveLength(3)
  })

  it('maps the preview calendar year to rule-engine date inputs', () => {
    expect(previewCalendarYearFromFormDates(DEFAULT_PREVIEW_FORM_VALUES)).toBe(2026)
    expect(previewCalendarYearFromFormDates({ taxYearStart: '', taxYearEnd: '2025-12-31' })).toBe(
      2026,
    )
    expect(previewCalendarYearToFormDates(2027)).toEqual({
      taxYearStart: '2027-01-01',
      taxYearEnd: '2026-12-31',
    })
  })

  it('derives source and rule filter counts without state drift', () => {
    const sources = [
      { id: 's1', healthStatus: 'healthy' },
      { id: 's2', healthStatus: 'degraded' },
      { id: 's3', healthStatus: 'healthy' },
    ] as const

    expect(countSourcesByHealth(sources)).toMatchObject({
      all: 3,
      healthy: 2,
      degraded: 1,
    })
    expect(filterSources(sources, 'degraded')).toHaveLength(1)

    const rules = [
      { status: 'verified', ruleTier: 'basic' },
      { status: 'candidate', ruleTier: 'exception' },
      { status: 'verified', ruleTier: 'applicability_review' },
    ] as const

    expect(countRulesByFilter(rules)).toMatchObject({
      all: 3,
      verified: 2,
      candidate: 1,
      applicability_review: 1,
      exception: 1,
    })
    expect(filterRules(rules, 'candidate')).toHaveLength(1)
    expect(filterRules(rules, 'applicability_review')).toHaveLength(1)
  })

  it('humanizes the five DueDateLogic kinds for the rule detail drawer', () => {
    expect(
      humanizeDueDateLogic({
        kind: 'fixed_date',
        date: '2026-05-15',
        holidayRollover: 'next_business_day',
      }),
    ).toBe('Fixed: 2026-05-15 · next business day rollover')

    expect(
      humanizeDueDateLogic({
        kind: 'nth_day_after_tax_year_end',
        monthOffset: 3,
        day: 15,
        holidayRollover: 'next_business_day',
      }),
    ).toBe('15th day of the 3rd month after tax year end · next business day rollover')

    expect(
      humanizeDueDateLogic({
        kind: 'nth_day_after_tax_year_begin',
        monthOffset: 4,
        day: 15,
        holidayRollover: 'next_business_day',
      }),
    ).toBe('15th day of the 4th month after tax year begin · next business day rollover')

    expect(
      humanizeDueDateLogic({
        kind: 'period_table',
        frequency: 'quarterly',
        periods: [
          { period: '2026-Q1', dueDate: '2026-04-30' },
          { period: '2026-Q2', dueDate: '2026-07-31' },
        ],
        holidayRollover: 'source_adjusted',
      }),
    ).toBe('quarterly schedule · 2 periods · source-adjusted rollover')

    expect(
      humanizeDueDateLogic({
        kind: 'source_defined_calendar',
        description: 'Notice-specific localities and postponed due dates.',
        holidayRollover: 'source_adjusted',
      }),
    ).toBe('Notice-specific localities and postponed due dates.')
  })

  it('groups preview rows by reminder readiness', () => {
    const rows = [
      { ruleId: 'ready', reminderReady: true },
      { ruleId: 'review', reminderReady: false },
    ] as const

    expect(groupPreviewRows(rows).reminderReady.map((row) => row.ruleId)).toEqual(['ready'])
    expect(groupPreviewRows(rows).requiresReview.map((row) => row.ruleId)).toEqual(['review'])
  })
})
