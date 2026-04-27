import { describe, expect, it } from 'vitest'
import { appContract } from './index'
import { ErrorCodes } from './errors'
import {
  ObligationStatusUpdateInputSchema,
  ObligationStatusUpdateOutputSchema,
  obligationsContract,
} from './obligations'
import { ObligationStatusSchema } from './shared/enums'
import { ClientSchema } from './shared/client'
import { WorkboardListInputSchema, WorkboardSortSchema, workboardContract } from './workboard'
import { MigrationErrorStageSchema, migrationContract } from './migration'
import {
  ObligationRuleSchema,
  RuleCoverageRowSchema,
  RuleSourceSchema,
  rulesContract,
} from './rules'

describe('@duedatehq/contracts', () => {
  it('keeps shared error codes stable', () => {
    expect(ErrorCodes.TENANT_MISSING).toBe('TENANT_MISSING')
    expect(ErrorCodes.GUARD_REJECTED).toBe('GUARD_REJECTED')
  })

  it('validates shared client payloads', () => {
    const parsed = ClientSchema.parse({
      id: '4f3d4f6f-3da3-49d6-b663-28e9b6e7b895',
      firmId: '2b3fe0da-448d-4ae4-a041-f8264bb9c926',
      name: 'Acme Holdings LLC',
      entityType: 'llc',
      state: 'CA',
      ein: null,
      email: null,
      createdAt: '2026-04-23T00:00:00.000Z',
      updatedAt: '2026-04-23T00:00:00.000Z',
    })

    expect(parsed.state).toBe('CA')
  })

  it('keeps the obligation status enum stable (DB authoritative)', () => {
    expect(ObligationStatusSchema.options).toEqual([
      'pending',
      'in_progress',
      'done',
      'waiting_on_client',
      'review',
      'not_applicable',
    ])
  })

  it('exposes obligations.updateStatus with before/after audit contract', () => {
    expect(Object.keys(obligationsContract)).toEqual(
      expect.arrayContaining(['createBatch', 'updateDueDate', 'updateStatus', 'listByClient']),
    )

    const parsed = ObligationStatusUpdateInputSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      status: 'in_progress',
      reason: 'kicking off this week',
    })
    expect(parsed.status).toBe('in_progress')

    const output = ObligationStatusUpdateOutputSchema.parse({
      obligation: {
        id: '11111111-1111-4111-8111-111111111111',
        firmId: 'firm_123',
        clientId: '22222222-2222-4222-8222-222222222222',
        taxType: '1040',
        taxYear: 2026,
        baseDueDate: '2026-04-15',
        currentDueDate: '2026-04-15',
        status: 'in_progress',
        migrationBatchId: null,
        createdAt: '2026-04-26T00:00:00.000Z',
        updatedAt: '2026-04-26T00:00:00.000Z',
      },
      auditId: '33333333-3333-4333-8333-333333333333',
    })
    expect(output.auditId).toMatch(/-/)
  })

  it('freezes workboard.list input shape', () => {
    expect(Object.keys(workboardContract)).toEqual(['list'])
    expect(WorkboardSortSchema.options).toEqual(['due_asc', 'due_desc', 'updated_desc'])

    const parsed = WorkboardListInputSchema.parse({
      status: ['pending', 'in_progress'],
      search: 'acme',
      sort: 'due_asc',
      cursor: null,
      limit: 50,
    })
    expect(parsed.limit).toBe(50)
  })

  it('freezes migration.listErrors stages', () => {
    expect(MigrationErrorStageSchema.options).toEqual(['mapping', 'normalize', 'matrix', 'all'])
    expect(Object.keys(migrationContract)).toEqual(
      expect.arrayContaining(['runMapper', 'applyDefaultMatrix', 'listErrors']),
    )
  })

  it('freezes rules read contracts', () => {
    expect(Object.keys(rulesContract)).toEqual(['listSources', 'listRules', 'coverage'])

    const source = RuleSourceSchema.parse({
      id: 'fed.irs_pub_509_2026',
      jurisdiction: 'FED',
      title: 'IRS Publication 509 (2026), Tax Calendars',
      url: 'https://www.irs.gov/publications/p509',
      sourceType: 'publication',
      acquisitionMethod: 'html_watch',
      cadence: 'pre_season',
      priority: 'critical',
      healthStatus: 'healthy',
      isEarlyWarning: false,
      notificationChannels: ['ops_source_change', 'publish_preview'],
      lastReviewedOn: '2026-04-27',
    })
    expect(source.jurisdiction).toBe('FED')

    const rule = ObligationRuleSchema.parse({
      id: 'fed.1065.return.2025',
      title: 'Federal Form 1065 return for partnerships',
      jurisdiction: 'FED',
      entityApplicability: ['partnership', 'llc'],
      taxType: 'federal_1065',
      formName: 'Form 1065',
      eventType: 'filing',
      isFiling: true,
      isPayment: false,
      taxYear: 2025,
      applicableYear: 2026,
      ruleTier: 'basic',
      status: 'verified',
      coverageStatus: 'full',
      riskLevel: 'med',
      requiresApplicabilityReview: false,
      dueDateLogic: {
        kind: 'nth_day_after_tax_year_end',
        monthOffset: 3,
        day: 15,
        holidayRollover: 'next_business_day',
      },
      extensionPolicy: {
        available: true,
        formName: 'Form 7004',
        durationMonths: 6,
        paymentExtended: false,
        notes: 'Filing extension only.',
      },
      sourceIds: ['fed.irs_pub_509_2026'],
      evidence: [
        {
          sourceId: 'fed.irs_pub_509_2026',
          locator: 'Partnerships / Form 1065',
          summary: 'Due on the 15th day of the 3rd month after tax year end.',
        },
      ],
      defaultTip: 'Calendar-year partnership returns for tax year 2025 roll to March 16, 2026.',
      quality: {
        filingPaymentDistinguished: true,
        extensionHandled: true,
        calendarFiscalSpecified: true,
        holidayRolloverHandled: true,
        crossVerified: true,
        exceptionChannel: true,
      },
      verifiedBy: 'ops.rules.manual',
      verifiedAt: '2026-04-27',
      nextReviewOn: '2026-11-15',
      version: 1,
    })
    expect(rule.status).toBe('verified')

    expect(
      RuleCoverageRowSchema.parse({
        jurisdiction: 'CA',
        sourceCount: 5,
        verifiedRuleCount: 5,
        candidateCount: 0,
        highPrioritySourceCount: 5,
      }).jurisdiction,
    ).toBe('CA')
  })

  it('mounts every domain on appContract', () => {
    expect(Object.keys(appContract)).toEqual(
      expect.arrayContaining([
        'clients',
        'obligations',
        'dashboard',
        'workboard',
        'pulse',
        'migration',
        'rules',
      ]),
    )
  })
})
