import { describe, expect, it } from 'vitest'
import { appContract } from './index'
import {
  AUDIT_SEARCH_MAX_LENGTH,
  AuditActionCategorySchema,
  AuditEventPublicSchema,
  AuditListInputSchema,
  auditContract,
} from './audit'
import { ErrorCodes } from './errors'
import {
  FirmBillingSubscriptionPublicSchema,
  FirmCreateInputSchema,
  FirmUpdateInputSchema,
  US_FIRM_TIMEZONE_OPTIONS,
  USFirmTimezoneSchema,
  firmsContract,
} from './firms'
import {
  ObligationStatusUpdateInputSchema,
  ObligationStatusUpdateOutputSchema,
  obligationsContract,
} from './obligations'
import { ObligationStatusSchema } from './shared/enums'
import { ClientSchema } from './shared/client'
import {
  WORKBOARD_SEARCH_MAX_LENGTH,
  WorkboardListInputSchema,
  WorkboardOwnerFilterSchema,
  WorkboardSortSchema,
  workboardContract,
} from './workboard'
import {
  WorkloadLoadInputSchema,
  WorkloadLoadOutputSchema,
  WorkloadWindowMaxDays,
  workloadContract,
} from './workload'
import { MatrixSelectionSchema, MigrationErrorStageSchema, migrationContract } from './migration'
import {
  MemberInviteInputSchema,
  MemberManagedRoleSchema,
  MembersListOutputSchema,
  membersContract,
} from './members'
import { AuditActionSchema, PulseAuditActionSchema } from './shared/audit-actions'
import { EvidenceSourceTypeSchema } from './shared/evidence-source-types'
import { DashboardLoadOutputSchema, DashboardSeveritySchema, dashboardContract } from './dashboard'
import { EvidencePublicSchema, evidenceContract } from './evidence'
import {
  PulseAffectedClientSchema,
  PulseAlertPublicSchema,
  PulseApplyInputSchema,
  PulseApplyOutputSchema,
  PulseFirmAlertStatusSchema,
  pulseContract,
} from './pulse'
import {
  ObligationRuleSchema,
  ObligationGenerationPreviewSchema,
  RuleGenerationPreviewInputSchema,
  RuleCoverageRowSchema,
  RuleSourceSchema,
  rulesContract,
} from './rules'

describe('@duedatehq/contracts', () => {
  it('freezes audit.list read contract', () => {
    expect(Object.keys(appContract)).toEqual(expect.arrayContaining(['audit']))
    expect(Object.keys(auditContract)).toEqual(['list'])
    expect(AuditActionCategorySchema.options).toEqual([
      'client',
      'obligation',
      'migration',
      'rules',
      'auth',
      'team',
      'pulse',
      'export',
      'ai',
      'system',
    ])

    const input = AuditListInputSchema.parse({
      search: 'status',
      category: 'obligation',
      action: 'obligation.status.updated',
      actorId: 'user_123',
      entityType: 'obligation',
      entityId: '11111111-1111-4111-8111-111111111111',
      range: '7d',
      cursor: null,
      limit: 50,
    })
    expect(input.category).toBe('obligation')
    expect(() =>
      AuditListInputSchema.parse({ search: 'x'.repeat(AUDIT_SEARCH_MAX_LENGTH + 1) }),
    ).toThrow()

    const event = AuditEventPublicSchema.parse({
      id: '33333333-3333-4333-8333-333333333333',
      firmId: 'firm_123',
      actorId: null,
      actorLabel: null,
      entityType: 'migration_batch',
      entityId: 'batch_123',
      action: 'migration.imported',
      beforeJson: { status: 'reviewing' },
      afterJson: { status: 'applied' },
      reason: null,
      ipHash: null,
      userAgentHash: null,
      createdAt: '2026-04-28T00:00:00.000Z',
    })
    expect(event.actorId).toBeNull()
  })

  it('keeps shared error codes stable', () => {
    expect(ErrorCodes.TENANT_MISSING).toBe('TENANT_MISSING')
    expect(ErrorCodes.GUARD_REJECTED).toBe('GUARD_REJECTED')
    expect(ErrorCodes.MEMBER_SEAT_LIMIT).toBe('MEMBER_SEAT_LIMIT')
  })

  it('freezes firm timezone and subscription contracts', () => {
    expect(Object.keys(appContract)).toEqual(expect.arrayContaining(['firms']))
    expect(Object.keys(firmsContract)).toEqual([
      'listMine',
      'getCurrent',
      'create',
      'switchActive',
      'updateCurrent',
      'listSubscriptions',
      'softDeleteCurrent',
    ])

    expect(US_FIRM_TIMEZONE_OPTIONS.map((option) => option.value)).toEqual(
      USFirmTimezoneSchema.options,
    )
    expect(USFirmTimezoneSchema.options).toEqual(
      expect.arrayContaining([
        'America/New_York',
        'America/Adak',
        'Pacific/Honolulu',
        'America/Puerto_Rico',
        'Pacific/Guam',
        'Pacific/Pago_Pago',
        'Pacific/Wake',
      ]),
    )
    expect(USFirmTimezoneSchema.options).not.toContain('Pacific/Johnston')
    expect(() =>
      FirmUpdateInputSchema.parse({ name: 'Bright CPA', timezone: 'Europe/London' }),
    ).toThrow()
    expect(FirmCreateInputSchema.parse({ name: 'Bright CPA' }).timezone).toBe('America/New_York')

    const subscription = FirmBillingSubscriptionPublicSchema.parse({
      id: 'sub_123',
      plan: 'pro',
      referenceId: 'firm_123',
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      status: 'active',
      periodStart: null,
      periodEnd: null,
      trialStart: null,
      trialEnd: null,
      cancelAtPeriodEnd: false,
      cancelAt: null,
      canceledAt: null,
      endedAt: null,
      seats: 5,
      billingInterval: 'month',
      stripeScheduleId: null,
      createdAt: '2026-04-28T00:00:00.000Z',
      updatedAt: '2026-04-28T00:00:00.000Z',
    })
    expect(subscription.referenceId).toBe('firm_123')
  })

  it('freezes members gateway contracts', () => {
    expect(Object.keys(appContract)).toEqual(expect.arrayContaining(['members']))
    expect(Object.keys(membersContract)).toEqual([
      'listCurrent',
      'invite',
      'cancelInvitation',
      'resendInvitation',
      'updateRole',
      'suspend',
      'reactivate',
      'remove',
    ])
    expect(MemberManagedRoleSchema.options).toEqual(['manager', 'preparer', 'coordinator'])
    expect(() =>
      MemberInviteInputSchema.parse({ email: 'owner@example.com', role: 'owner' }),
    ).toThrow()

    const output = MembersListOutputSchema.parse({
      seatLimit: 5,
      usedSeats: 2,
      availableSeats: 3,
      members: [
        {
          id: 'member_1',
          userId: 'user_1',
          name: 'Alex Chen',
          email: 'alex@example.com',
          image: null,
          role: 'owner',
          status: 'active',
          isCurrentUser: true,
          createdAt: '2026-04-28T00:00:00.000Z',
        },
      ],
      invitations: [
        {
          id: 'invitation_1',
          email: 'maya@example.com',
          role: 'preparer',
          status: 'canceled',
          inviterId: 'user_1',
          expiresAt: '2026-05-05T00:00:00.000Z',
          createdAt: '2026-04-28T00:00:00.000Z',
        },
      ],
    })
    expect(output.availableSeats).toBe(3)
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
      assigneeName: 'Sarah',
      owner: 'unassigned',
      due: 'overdue',
      dueWithinDays: 7,
      asOfDate: '2026-04-29',
      sort: 'due_asc',
      cursor: null,
      limit: 50,
    })
    expect(parsed.limit).toBe(50)
    expect(WorkboardOwnerFilterSchema.parse('unassigned')).toBe('unassigned')
    expect(() =>
      WorkboardListInputSchema.parse({ search: 'x'.repeat(WORKBOARD_SEARCH_MAX_LENGTH + 1) }),
    ).toThrow()
  })

  it('freezes workload paid surface contract', () => {
    expect(Object.keys(workloadContract)).toEqual(['load'])
    expect(WorkloadLoadInputSchema.parse({ asOfDate: '2026-04-29', windowDays: 7 })).toEqual({
      asOfDate: '2026-04-29',
      windowDays: 7,
    })
    expect(() => WorkloadLoadInputSchema.parse({ windowDays: WorkloadWindowMaxDays + 1 })).toThrow()

    const output = WorkloadLoadOutputSchema.parse({
      asOfDate: '2026-04-29',
      windowDays: 7,
      summary: { open: 3, dueSoon: 1, overdue: 1, waiting: 1, review: 0, unassigned: 1 },
      rows: [
        {
          id: 'assignee:Sarah',
          ownerLabel: 'Sarah',
          assigneeName: 'Sarah',
          kind: 'assignee',
          open: 2,
          dueSoon: 1,
          overdue: 0,
          waiting: 1,
          review: 0,
          loadScore: 100,
        },
      ],
    })
    expect(output.rows[0]?.ownerLabel).toBe('Sarah')
  })

  it('freezes migration.listErrors stages', () => {
    expect(MigrationErrorStageSchema.options).toEqual(['mapping', 'normalize', 'matrix', 'all'])
    expect(Object.keys(migrationContract)).toEqual(
      expect.arrayContaining(['runMapper', 'applyDefaultMatrix', 'listErrors']),
    )
  })

  it('accepts explicit Default Matrix cell selections', () => {
    expect(MatrixSelectionSchema.parse({ entityType: 'llc', state: 'CA', enabled: false })).toEqual(
      { entityType: 'llc', state: 'CA', enabled: false },
    )
  })

  it('allows verified rule evidence for generated obligations', () => {
    expect(EvidenceSourceTypeSchema.parse('verified_rule')).toBe('verified_rule')
  })

  it('allows migration and Pulse audit strings used by batch apply', () => {
    expect(AuditActionSchema.parse('migration.batch.created')).toBe('migration.batch.created')
    expect(PulseAuditActionSchema.parse('pulse.apply')).toBe('pulse.apply')
    expect(PulseAuditActionSchema.parse('pulse.dismiss')).toBe('pulse.dismiss')
    expect(PulseAuditActionSchema.parse('pulse.quarantine')).toBe('pulse.quarantine')
    expect(PulseAuditActionSchema.parse('pulse.snooze')).toBe('pulse.snooze')
    expect(AuditActionSchema.parse('pulse.revert')).toBe('pulse.revert')
    expect(EvidenceSourceTypeSchema.parse('pulse_apply')).toBe('pulse_apply')
  })

  it('freezes Pulse demo backend contracts', () => {
    expect(Object.keys(pulseContract)).toEqual([
      'listAlerts',
      'listHistory',
      'listSourceHealth',
      'getDetail',
      'apply',
      'dismiss',
      'snooze',
      'revert',
    ])
    expect(PulseFirmAlertStatusSchema.options).toEqual([
      'matched',
      'dismissed',
      'snoozed',
      'partially_applied',
      'applied',
      'reverted',
    ])
    expect(ErrorCodes.PULSE_APPLY_CONFLICT).toBe('PULSE_APPLY_CONFLICT')

    const alert = PulseAlertPublicSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      pulseId: '22222222-2222-4222-8222-222222222222',
      status: 'matched',
      title: 'IRS CA storm relief',
      source: 'IRS Disaster Relief',
      sourceUrl: 'https://www.irs.gov/newsroom/tax-relief-in-disaster-situations',
      summary: 'IRS extends selected filing deadlines for Los Angeles County.',
      publishedAt: '2026-04-15T17:00:00.000Z',
      matchedCount: 1,
      needsReviewCount: 1,
      confidence: 0.94,
      isSample: true,
    })
    expect(alert.isSample).toBe(true)

    const affected = PulseAffectedClientSchema.parse({
      obligationId: '33333333-3333-4333-8333-333333333333',
      clientId: '44444444-4444-4444-8444-444444444444',
      clientName: 'Arbor & Vale LLC',
      state: 'CA',
      county: null,
      entityType: 'llc',
      taxType: 'federal_1065',
      currentDueDate: '2026-03-15',
      newDueDate: '2026-10-15',
      status: 'pending',
      matchStatus: 'needs_review',
      reason: 'Client county is missing; confirm county applicability before applying.',
    })
    expect(affected.matchStatus).toBe('needs_review')

    const applyInput = PulseApplyInputSchema.parse({
      alertId: '11111111-1111-4111-8111-111111111111',
      obligationIds: ['33333333-3333-4333-8333-333333333333'],
      confirmedObligationIds: ['33333333-3333-4333-8333-333333333333'],
    })
    expect(applyInput.confirmedObligationIds).toEqual(['33333333-3333-4333-8333-333333333333'])

    const apply = PulseApplyOutputSchema.parse({
      alert: { ...alert, status: 'applied', matchedCount: 0, needsReviewCount: 1 },
      appliedCount: 1,
      auditIds: ['55555555-5555-4555-8555-555555555555'],
      evidenceIds: ['66666666-6666-4666-8666-666666666666'],
      applicationIds: ['77777777-7777-4777-8777-777777777777'],
      emailOutboxId: '88888888-8888-4888-8888-888888888888',
      revertExpiresAt: '2026-04-16T18:00:00.000Z',
    })
    expect(apply.appliedCount).toBe(1)
  })

  it('freezes evidence.listByObligation public shape', () => {
    expect(Object.keys(evidenceContract)).toEqual(['listByObligation'])

    const row = EvidencePublicSchema.parse({
      id: '33333333-3333-4333-8333-333333333333',
      obligationInstanceId: '11111111-1111-4111-8111-111111111111',
      aiOutputId: null,
      sourceType: 'verified_rule',
      sourceId: 'ca.llc.annual_tax.2026',
      sourceUrl: 'https://www.ftb.ca.gov/file/business/types/limited-liability-company/',
      verbatimQuote: 'Annual tax is due by the 15th day of the 4th month.',
      rawValue: 'ca_llc_franchise_min_800',
      normalizedValue: 'ca_llc_annual_tax',
      confidence: 1,
      model: null,
      appliedAt: '2026-04-28T00:00:00.000Z',
    })
    expect(row.sourceType).toBe('verified_rule')
  })

  it('freezes dashboard.load activation slice shape', () => {
    expect(Object.keys(dashboardContract)).toEqual(['load', 'requestBriefRefresh'])
    expect(DashboardSeveritySchema.options).toEqual(['critical', 'high', 'medium', 'neutral'])

    const output = DashboardLoadOutputSchema.parse({
      asOfDate: '2026-04-28',
      windowDays: 7,
      summary: {
        openObligationCount: 1,
        dueThisWeekCount: 1,
        needsReviewCount: 0,
        evidenceGapCount: 0,
      },
      topRows: [
        {
          obligationId: '11111111-1111-4111-8111-111111111111',
          clientId: '22222222-2222-4222-8222-222222222222',
          clientName: 'Acme LLC',
          taxType: 'ca_llc_annual_tax',
          currentDueDate: '2026-04-30',
          status: 'pending',
          severity: 'critical',
          evidenceCount: 1,
          primaryEvidence: {
            id: '33333333-3333-4333-8333-333333333333',
            obligationInstanceId: '11111111-1111-4111-8111-111111111111',
            aiOutputId: null,
            sourceType: 'verified_rule',
            sourceId: 'ca.llc.annual_tax.2026',
            sourceUrl: null,
            verbatimQuote: null,
            rawValue: null,
            normalizedValue: null,
            confidence: 1,
            model: null,
            appliedAt: '2026-04-28T00:00:00.000Z',
          },
        },
      ],
      brief: {
        status: 'ready',
        generatedAt: '2026-04-28T12:00:00.000Z',
        expiresAt: '2026-04-29T12:00:00.000Z',
        text: 'Review Acme LLC first. [1]',
        citations: [
          {
            ref: 1,
            obligationId: '11111111-1111-4111-8111-111111111111',
            evidence: {
              id: '33333333-3333-4333-8333-333333333333',
              sourceType: 'verified_rule',
              sourceId: 'ca.llc.annual_tax.2026',
              sourceUrl: null,
            },
          },
        ],
        aiOutputId: '44444444-4444-4444-8444-444444444444',
        errorCode: null,
      },
    })
    expect(output.topRows[0]!.severity).toBe('critical')
    expect(output.brief?.status).toBe('ready')
  })

  it('freezes rules read contracts', () => {
    expect(Object.keys(rulesContract)).toEqual([
      'listSources',
      'listRules',
      'coverage',
      'previewObligations',
    ])

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
    expect(
      RuleSourceSchema.parse({
        ...source,
        id: 'ny.email_services',
        jurisdiction: 'NY',
        title: 'New York Tax Department Email Services',
        url: 'https://www.tax.ny.gov/help/subscribe.htm',
        sourceType: 'subscription',
        acquisitionMethod: 'email_subscription',
      }).sourceType,
    ).toBe('subscription')

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
          authorityRole: 'basis',
          locator: {
            kind: 'table',
            heading: 'Partnerships / Form 1065',
          },
          summary: 'Due on the 15th day of the 3rd month after tax year end.',
          sourceExcerpt: 'If any due date falls on a Saturday, Sunday, or legal holiday',
          retrievedAt: '2026-04-27',
          sourceUpdatedOn: '2026-04-27',
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

    const previewInput = RuleGenerationPreviewInputSchema.parse({
      client: {
        id: 'client_ca_llc',
        entityType: 'llc',
        state: 'CA',
        taxTypes: ['ca_llc_franchise_min_800'],
        taxYearStart: '2026-01-01',
        taxYearEnd: '2025-12-31',
      },
      holidays: ['2026-01-01'],
    })
    expect(previewInput.client.taxTypes).toEqual(['ca_llc_franchise_min_800'])

    expect(() =>
      RuleGenerationPreviewInputSchema.parse({
        client: {
          id: 'client_any_business',
          entityType: 'any_business',
          state: 'WA',
          taxTypes: ['wa_combined_excise'],
        },
      }),
    ).toThrow()

    expect(() =>
      RuleGenerationPreviewInputSchema.parse({
        client: {
          id: 'client_lowercase_state',
          entityType: 'llc',
          state: 'ca',
          taxTypes: ['ca_llc_franchise_min_800'],
        },
      }),
    ).toThrow()

    expect(() =>
      RuleGenerationPreviewInputSchema.parse({
        client: {
          id: 'client_unsupported_state',
          entityType: 'llc',
          state: 'MA',
          taxTypes: ['federal_1065_or_1040'],
        },
      }),
    ).toThrow()

    expect(() =>
      RuleGenerationPreviewInputSchema.parse({
        client: {
          id: 'client_fed_state',
          entityType: 'llc',
          state: 'FED',
          taxTypes: ['federal_1065_or_1040'],
        },
      }),
    ).toThrow()

    const preview = ObligationGenerationPreviewSchema.parse({
      clientId: 'client_ca_llc',
      ruleId: 'ca.llc.annual_tax.2026',
      ruleVersion: 1,
      ruleTitle: 'California LLC annual tax payment',
      jurisdiction: 'CA',
      taxType: 'ca_llc_annual_tax',
      matchedTaxType: 'ca_llc_franchise_min_800',
      period: 'tax_year',
      dueDate: '2026-04-15',
      eventType: 'payment',
      isFiling: false,
      isPayment: true,
      formName: 'FTB 3522',
      sourceIds: ['ca.ftb_business_due_dates'],
      evidence: [
        {
          sourceId: 'ca.ftb_business_due_dates',
          authorityRole: 'basis',
          locator: {
            kind: 'table',
            heading: 'Annual LLC tax',
          },
          summary: 'Due on the 15th day of the 4th month.',
          sourceExcerpt: 'Business due dates',
          retrievedAt: '2026-04-27',
          sourceUpdatedOn: '2026-04-27',
        },
      ],
      requiresReview: false,
      reminderReady: true,
      reviewReasons: [],
    })
    expect(preview.reminderReady).toBe(true)

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
        'evidence',
        'workboard',
        'workload',
        'pulse',
        'migration',
        'rules',
      ]),
    )
  })
})
