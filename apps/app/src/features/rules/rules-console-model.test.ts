import { describe, expect, it } from 'vitest'

import {
  countRulesByFilter,
  countSourcesByHealth,
  DEFAULT_PREVIEW_FORM_VALUES,
  filterRules,
  filterSources,
  groupPreviewRows,
  isRulesTab,
  previewFormToInput,
} from './rules-console-model'

describe('rules console model', () => {
  it('guards tab values', () => {
    expect(isRulesTab('coverage')).toBe(true)
    expect(isRulesTab('preview')).toBe(true)
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

  it('groups preview rows by reminder readiness', () => {
    const rows = [
      { ruleId: 'ready', reminderReady: true },
      { ruleId: 'review', reminderReady: false },
    ] as const

    expect(groupPreviewRows(rows).reminderReady.map((row) => row.ruleId)).toEqual(['ready'])
    expect(groupPreviewRows(rows).requiresReview.map((row) => row.ruleId)).toEqual(['review'])
  })
})
