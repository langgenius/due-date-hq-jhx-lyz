import { describe, expect, it } from 'vitest'
import {
  getMvpRuleCoverage,
  findRuleById,
  listObligationRules,
  listRuleSources,
  listSourcesByNotificationChannel,
  MVP_RULE_JURISDICTIONS,
  normalizeRuleTaxTypeCandidates,
  OBLIGATION_RULES,
  previewObligationsFromRules,
  RULE_SOURCES,
} from './index'

const OFFICIAL_HOSTS = new Set([
  'www.irs.gov',
  'www.fema.gov',
  'www.ftb.ca.gov',
  'www.tax.ny.gov',
  'comptroller.texas.gov',
  'floridarevenue.com',
  'dor.wa.gov',
])

function expectUnique(ids: readonly string[]) {
  expect(new Set(ids).size).toBe(ids.length)
}

describe('@duedatehq/core/rules', () => {
  it('keeps MVP jurisdiction scope explicit', () => {
    expect(MVP_RULE_JURISDICTIONS).toEqual(['FED', 'CA', 'NY', 'TX', 'FL', 'WA'])
  })

  it('stores only official source URLs in the MVP registry', () => {
    expectUnique(RULE_SOURCES.map((source) => source.id))

    for (const source of RULE_SOURCES) {
      const url = new URL(source.url)
      expect(OFFICIAL_HOSTS.has(url.host), `${source.id} uses unofficial host ${url.host}`).toBe(
        true,
      )
      expect(['healthy', 'degraded']).toContain(source.healthStatus)
      expect(source.notificationChannels.length).toBeGreaterThan(0)
    }
  })

  it('links every rule to existing official sources', () => {
    const sourceIds = new Set<string>(RULE_SOURCES.map((source) => source.id))

    expectUnique(OBLIGATION_RULES.map((rule) => rule.id))

    for (const rule of OBLIGATION_RULES) {
      expect(rule.sourceIds.length, `${rule.id} has no sources`).toBeGreaterThan(0)
      expect(rule.evidence.length, `${rule.id} has no evidence`).toBeGreaterThan(0)

      for (const sourceId of rule.sourceIds) {
        expect(sourceIds.has(sourceId), `${rule.id} references missing source ${sourceId}`).toBe(
          true,
        )
      }

      for (const evidence of rule.evidence) {
        expect(sourceIds.has(evidence.sourceId), `${rule.id} has missing evidence source`).toBe(
          true,
        )
      }
    }
  })

  it('covers every MVP jurisdiction with verified rules and source watches', () => {
    const coverage = getMvpRuleCoverage()

    expect(coverage).toHaveLength(MVP_RULE_JURISDICTIONS.length)

    for (const row of coverage) {
      expect(row.sourceCount, `${row.jurisdiction} has no sources`).toBeGreaterThan(0)
      expect(row.verifiedRuleCount, `${row.jurisdiction} has no verified rules`).toBeGreaterThan(0)
      expect(
        row.highPrioritySourceCount,
        `${row.jurisdiction} lacks priority sources`,
      ).toBeGreaterThan(0)
    }
  })

  it('keeps user reminders behind verified rules only', () => {
    const userReminderSources = listSourcesByNotificationChannel('user_deadline_reminder')
    const verifiedRules = listObligationRules({ status: 'verified' })
    const defaultRules = listObligationRules()
    const withCandidates = listObligationRules({ includeCandidates: true })

    expect(userReminderSources).toHaveLength(0)
    expect(verifiedRules.every((rule) => rule.status === 'verified')).toBe(true)
    expect(defaultRules.every((rule) => rule.status !== 'candidate')).toBe(true)
    expect(withCandidates.some((rule) => rule.status === 'candidate')).toBe(true)
  })

  it('keeps audited rule corrections in the structured asset', () => {
    expect(findRuleById('fed.1065.return.2025')?.requiresApplicabilityReview).toBe(true)
    expect(findRuleById('fed.1120.return.2025')?.coverageStatus).toBe('manual')
    expect(findRuleById('ca.llc.568.return.2025')?.ruleTier).toBe('applicability_review')

    expect(findRuleById('ny.ct3s.return.2025')?.dueDateLogic).toMatchObject({
      kind: 'nth_day_after_tax_year_end',
      monthOffset: 3,
      day: 15,
    })
    expect(findRuleById('ny.ptet.election.2026')?.ruleTier).toBe('applicability_review')
    expect(findRuleById('tx.franchise.extension.2026')?.requiresApplicabilityReview).toBe(true)

    expect(findRuleById('wa.excise.monthly.2026')?.dueDateLogic).toMatchObject({
      kind: 'period_table',
      periods: expect.arrayContaining([
        { period: '2026-03', dueDate: '2026-04-27' },
        { period: '2026-11', dueDate: '2026-12-28' },
      ]),
    })
    expect(findRuleById('wa.excise.quarterly.2026')?.dueDateLogic).toMatchObject({
      kind: 'period_table',
      periods: expect.arrayContaining([{ period: '2026-Q4', dueDate: '2027-02-01' }]),
    })
  })

  it('exposes source and rule filters for Rules Console reads', () => {
    expect(listRuleSources('CA').every((source) => source.jurisdiction === 'CA')).toBe(true)
    expect(
      listObligationRules({ jurisdiction: 'WA' }).every((rule) => rule.jurisdiction === 'WA'),
    ).toBe(true)
  })

  it('normalizes matrix tax types into explicit rule tax type candidates', () => {
    expect(normalizeRuleTaxTypeCandidates('ca_llc_franchise_min_800')).toContainEqual({
      inputTaxType: 'ca_llc_franchise_min_800',
      taxType: 'ca_llc_annual_tax',
      requiresReview: false,
      reviewReason: null,
    })
    expect(normalizeRuleTaxTypeCandidates('ny_ptet_optional')).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          taxType: 'ny_ptet_election',
          requiresReview: true,
        }),
        expect.objectContaining({
          taxType: 'ny_ptet_estimated_tax',
          requiresReview: true,
        }),
        expect.objectContaining({
          taxType: 'ny_ptet',
          requiresReview: true,
        }),
      ]),
    )
  })

  it('generates reminder-ready previews only for verified full rules with concrete dates', () => {
    const previews = previewObligationsFromRules({
      client: {
        id: 'client_ca_llc',
        entityType: 'llc',
        state: 'CA',
        taxTypes: ['federal_1065_or_1040', 'ca_llc_franchise_min_800', 'ca_llc_fee_gross_receipts'],
        taxYearStart: '2026-01-01',
        taxYearEnd: '2025-12-31',
      },
    })

    const annualTax = previews.find((preview) => preview.ruleId === 'ca.llc.annual_tax.2026')
    const estimatedFee = previews.find((preview) => preview.ruleId === 'ca.llc.estimated_fee.2026')
    const federal1065 = previews.find((preview) => preview.ruleId === 'fed.1065.return.2025')

    expect(annualTax).toMatchObject({
      matchedTaxType: 'ca_llc_franchise_min_800',
      dueDate: '2026-04-15',
      requiresReview: false,
      reminderReady: true,
    })
    expect(estimatedFee).toMatchObject({
      matchedTaxType: 'ca_llc_fee_gross_receipts',
      dueDate: '2026-06-15',
      requiresReview: true,
      reminderReady: false,
    })
    expect(federal1065).toMatchObject({
      matchedTaxType: 'federal_1065_or_1040',
      dueDate: '2026-03-16',
      requiresReview: true,
      reminderReady: false,
    })
    expect(previews.some((preview) => preview.ruleId === 'fed.disaster_relief.watch')).toBe(false)
  })

  it('keeps optional PTET generated as review-only and expands period tables', () => {
    const previews = previewObligationsFromRules({
      client: {
        id: 'client_ny_scorp',
        entityType: 's_corp',
        state: 'NY',
        taxTypes: ['federal_1120s', 'ny_ct3s', 'ny_ptet_optional'],
        taxYearStart: '2026-01-01',
        taxYearEnd: '2025-12-31',
      },
    })

    const nyCt3s = previews.find((preview) => preview.ruleId === 'ny.ct3s.return.2025')
    const ptetPayments = previews.filter(
      (preview) => preview.ruleId === 'ny.ptet.estimated_payments.2026',
    )

    expect(nyCt3s).toMatchObject({
      dueDate: '2026-03-16',
      requiresReview: false,
      reminderReady: true,
    })
    expect(ptetPayments).toHaveLength(4)
    expect(ptetPayments.every((preview) => preview.requiresReview)).toBe(true)
    expect(ptetPayments.every((preview) => !preview.reminderReady)).toBe(true)
    expect(ptetPayments.map((preview) => preview.period)).toEqual([
      '2026-Q1',
      '2026-Q2',
      '2026-Q3',
      '2026-Q4',
    ])
  })

  it('surfaces source-defined calendars as review-needed previews', () => {
    const previews = previewObligationsFromRules({
      client: {
        id: 'client_fl_c_corp',
        entityType: 'c_corp',
        state: 'FL',
        taxTypes: ['fl_f1120', 'fl_cit_estimated_tax'],
        taxYearStart: '2026-01-01',
        taxYearEnd: '2025-12-31',
      },
    })

    expect(previews.find((preview) => preview.ruleId === 'fl.f1120.return.2025')).toMatchObject({
      dueDate: null,
      period: 'source_defined',
      requiresReview: true,
      reminderReady: false,
    })
    expect(
      previews.find((preview) => preview.ruleId === 'fl.cit.estimated_tax.2026'),
    ).toMatchObject({
      dueDate: null,
      period: 'source_defined',
      requiresReview: true,
      reminderReady: false,
    })
  })
})
