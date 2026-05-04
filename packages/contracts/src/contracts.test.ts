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
  FirmBillingCheckoutConfigSchema,
  FirmBillingSubscriptionPublicSchema,
  FirmCreateInputSchema,
  FirmPlanSchema,
  FirmPublicSchema,
  FirmSmartPriorityPreviewInputSchema,
  FirmSmartPriorityPreviewOutputSchema,
  FirmUpdateInputSchema,
  US_FIRM_TIMEZONE_OPTIONS,
  USFirmTimezoneSchema,
  firmsContract,
} from './firms'
import { SMART_PRIORITY_DEFAULT_PROFILE, SmartPriorityProfileSchema } from './priority'
import {
  ClientBulkAssigneeUpdateInputSchema,
  ClientBulkAssigneeUpdateOutputSchema,
  ClientJurisdictionUpdateOutputSchema,
  ClientJurisdictionUpdateSchema,
  clientsContract,
} from './clients'
import {
  ObligationBulkReadinessUpdateInputSchema,
  ObligationBulkReadinessUpdateOutputSchema,
  ObligationBulkStatusUpdateInputSchema,
  ObligationBulkStatusUpdateOutputSchema,
  ObligationReadinessUpdateInputSchema,
  ObligationReadinessUpdateOutputSchema,
  ObligationStatusUpdateInputSchema,
  ObligationStatusUpdateOutputSchema,
  obligationsContract,
} from './obligations'
import { ObligationReadinessSchema, ObligationStatusSchema } from './shared/enums'
import { ClientSchema } from './shared/client'
import {
  WORKBOARD_FILTER_MAX_SELECTIONS,
  WORKBOARD_SEARCH_MAX_LENGTH,
  WorkboardCreateSavedViewInputSchema,
  WorkboardDensitySchema,
  WorkboardExportSelectedInputSchema,
  WorkboardExportSelectedOutputSchema,
  WorkboardFacetsOutputSchema,
  WorkboardListInputSchema,
  WorkboardOwnerFilterSchema,
  WorkboardReadinessSchema,
  WorkboardSavedViewSchema,
  WorkboardSortSchema,
  WorkboardUpdateSavedViewInputSchema,
  workboardContract,
} from './workboard'
import {
  WorkloadLoadInputSchema,
  WorkloadLoadOutputSchema,
  WorkloadWindowMaxDays,
  workloadContract,
} from './workload'
import {
  MatrixSelectionSchema,
  MigrationErrorStageSchema,
  MigrationIntegrationProviderSchema,
  MigrationSourceSchema,
  MigrationStageExternalRowsInputSchema,
  migrationContract,
} from './migration'
import {
  MemberAssigneeOptionSchema,
  MemberInviteInputSchema,
  MemberManagedRoleSchema,
  MembersListOutputSchema,
  membersContract,
} from './members'
import { AuditActionSchema, PulseAuditActionSchema } from './shared/audit-actions'
import { EvidenceSourceTypeSchema } from './shared/evidence-source-types'
import {
  DASHBOARD_FILTER_MAX_SELECTIONS,
  DashboardDueBucketSchema,
  DashboardEvidenceFilterSchema,
  DashboardLoadInputSchema,
  DashboardLoadOutputSchema,
  DashboardSeveritySchema,
  DashboardTriageTabKeySchema,
  dashboardContract,
} from './dashboard'
import { EvidencePublicSchema, evidenceContract } from './evidence'
import {
  PulseAffectedClientSchema,
  PulseAlertPublicSchema,
  PulseApplyInputSchema,
  PulseApplyOutputSchema,
  PulseFirmAlertStatusSchema,
  PulseRequestReviewInputSchema,
  PulseRequestReviewOutputSchema,
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
    expect(Object.keys(auditContract)).toEqual([
      'list',
      'requestEvidencePackage',
      'getEvidencePackage',
      'listEvidencePackages',
      'createDownloadUrl',
    ])
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
    expect(ErrorCodes.FIRM_LIMIT_EXCEEDED).toBe('FIRM_LIMIT_EXCEEDED')
  })

  it('freezes firm timezone and subscription contracts', () => {
    expect(Object.keys(appContract)).toEqual(expect.arrayContaining(['firms']))
    expect(Object.keys(firmsContract)).toEqual([
      'listMine',
      'getCurrent',
      'create',
      'switchActive',
      'updateCurrent',
      'previewSmartPriorityProfile',
      'backfillPenaltyExposure',
      'listSubscriptions',
      'billingCheckoutConfig',
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
    expect(FirmPlanSchema.options).toEqual(['solo', 'pro', 'team', 'firm'])
    expect(() =>
      FirmUpdateInputSchema.parse({ name: 'Bright CPA', timezone: 'Europe/London' }),
    ).toThrow()
    expect(
      FirmUpdateInputSchema.parse({
        name: 'Bright CPA',
        timezone: 'America/New_York',
        smartPriorityProfile: SMART_PRIORITY_DEFAULT_PROFILE,
      }).smartPriorityProfile?.weights.exposure,
    ).toBe(45)
    expect(FirmCreateInputSchema.parse({ name: 'Bright CPA' }).timezone).toBe('America/New_York')
    expect(
      FirmPublicSchema.parse({
        id: 'firm_123',
        name: 'Bright CPA',
        slug: 'bright-cpa',
        plan: 'pro',
        seatLimit: 5,
        timezone: 'America/New_York',
        status: 'active',
        role: 'owner',
        ownerUserId: 'user_123',
        coordinatorCanSeeDollars: false,
        smartPriorityProfile: SMART_PRIORITY_DEFAULT_PROFILE,
        openObligationCount: 2,
        isCurrent: true,
        createdAt: '2026-04-28T00:00:00.000Z',
        updatedAt: '2026-04-28T00:00:00.000Z',
        deletedAt: null,
      }).smartPriorityProfile?.weights.urgency,
    ).toBe(25)
    expect(
      FirmPublicSchema.parse({
        id: 'firm_123',
        name: 'Bright CPA',
        slug: 'bright-cpa',
        plan: 'pro',
        seatLimit: 5,
        timezone: 'America/New_York',
        status: 'active',
        role: 'manager',
        ownerUserId: 'user_123',
        coordinatorCanSeeDollars: false,
        smartPriorityProfile: null,
        openObligationCount: 0,
        isCurrent: true,
        createdAt: '2026-04-28T00:00:00.000Z',
        updatedAt: '2026-04-28T00:00:00.000Z',
        deletedAt: null,
      }).smartPriorityProfile,
    ).toBeNull()
    expect(() =>
      SmartPriorityProfileSchema.parse({
        ...SMART_PRIORITY_DEFAULT_PROFILE,
        weights: { ...SMART_PRIORITY_DEFAULT_PROFILE.weights, readiness: 6 },
      }),
    ).toThrow()
    expect(() =>
      SmartPriorityProfileSchema.parse({
        ...SMART_PRIORITY_DEFAULT_PROFILE,
        urgencyWindowDays: 0,
      }),
    ).toThrow()
    expect(
      FirmSmartPriorityPreviewInputSchema.parse({
        smartPriorityProfile: SMART_PRIORITY_DEFAULT_PROFILE,
      }).limit,
    ).toBe(8)
    expect(
      FirmSmartPriorityPreviewOutputSchema.parse({
        asOfDate: '2026-05-03',
        rows: [
          {
            obligationId: 'obligation_1',
            clientName: 'Bright Client',
            taxType: 'federal_1065',
            currentDueDate: '2026-05-10',
            currentScore: 36.3,
            previewScore: 40.1,
            scoreDelta: 3.8,
            currentRank: 2,
            previewRank: 1,
            rankDelta: 1,
          },
        ],
      }).rows[0]?.previewRank,
    ).toBe(1)

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
      seats: 3,
      billingInterval: 'month',
      stripeScheduleId: null,
      createdAt: '2026-04-28T00:00:00.000Z',
      updatedAt: '2026-04-28T00:00:00.000Z',
    })
    expect(subscription.referenceId).toBe('firm_123')

    const checkoutConfig = FirmBillingCheckoutConfigSchema.parse({
      stripeConfigured: true,
      plans: {
        solo: { monthly: false, yearly: false },
        pro: { monthly: true, yearly: true },
        team: { monthly: true, yearly: false },
      },
    })
    expect(checkoutConfig.plans.team.monthly).toBe(true)
  })

  it('freezes members gateway contracts', () => {
    expect(Object.keys(appContract)).toEqual(expect.arrayContaining(['members']))
    expect(Object.keys(membersContract)).toEqual([
      'listCurrent',
      'listAssignable',
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

    expect(() =>
      MemberAssigneeOptionSchema.parse({
        assigneeId: 'user_1',
        memberId: 'member_1',
        name: 'Alex Chen',
        email: 'alex@example.com',
        role: 'owner',
      }),
    ).not.toThrow()
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
      'extended',
      'paid',
      'waiting_on_client',
      'review',
      'not_applicable',
    ])
  })

  it('keeps the obligation readiness enum stable', () => {
    expect(ObligationReadinessSchema.options).toEqual(['ready', 'waiting', 'needs_review'])
  })

  it('exposes obligations.updateStatus with before/after audit contract', () => {
    expect(Object.keys(obligationsContract)).toEqual(
      expect.arrayContaining([
        'createBatch',
        'updateDueDate',
        'updateStatus',
        'bulkUpdateStatus',
        'updateReadiness',
        'decideExtension',
        'bulkUpdateReadiness',
        'listByClient',
      ]),
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
        readiness: 'ready',
        extensionDecision: 'not_considered',
        extensionMemo: null,
        extensionSource: null,
        extensionExpectedDueDate: null,
        extensionDecidedAt: null,
        extensionDecidedByUserId: null,
        migrationBatchId: null,
        estimatedTaxDueCents: null,
        estimatedExposureCents: null,
        exposureStatus: 'needs_input',
        penaltyBreakdown: [],
        missingPenaltyFacts: [],
        penaltySourceRefs: [],
        penaltyFormulaLabel: null,
        penaltyFactsVersion: null,
        accruedPenaltyCents: 0,
        accruedPenaltyStatus: 'ready',
        accruedPenaltyBreakdown: [],
        penaltyAsOfDate: '2026-04-26',
        penaltyFormulaVersion: null,
        exposureCalculatedAt: null,
        createdAt: '2026-04-26T00:00:00.000Z',
        updatedAt: '2026-04-26T00:00:00.000Z',
      },
      auditId: '33333333-3333-4333-8333-333333333333',
    })
    expect(output.auditId).toMatch(/-/)

    const bulkInput = ObligationBulkStatusUpdateInputSchema.parse({
      ids: ['11111111-1111-4111-8111-111111111111'],
      status: 'extended',
      reason: 'extension filed',
    })
    expect(bulkInput.status).toBe('extended')
    const bulkOutput = ObligationBulkStatusUpdateOutputSchema.parse({
      updatedCount: 1,
      auditIds: ['33333333-3333-4333-8333-333333333333'],
    })
    expect(bulkOutput.updatedCount).toBe(1)

    const readinessInput = ObligationReadinessUpdateInputSchema.parse({
      id: '11111111-1111-4111-8111-111111111111',
      readiness: 'waiting',
      reason: 'waiting on K-1',
    })
    expect(readinessInput.readiness).toBe('waiting')

    const readinessOutput = ObligationReadinessUpdateOutputSchema.parse({
      obligation: { ...output.obligation, readiness: 'waiting' },
      auditId: '33333333-3333-4333-8333-333333333333',
    })
    expect(readinessOutput.obligation.readiness).toBe('waiting')

    const bulkReadinessInput = ObligationBulkReadinessUpdateInputSchema.parse({
      ids: ['11111111-1111-4111-8111-111111111111'],
      readiness: 'needs_review',
      reason: 'CPA review',
    })
    expect(bulkReadinessInput.readiness).toBe('needs_review')
    const bulkReadinessOutput = ObligationBulkReadinessUpdateOutputSchema.parse({
      updatedCount: 1,
      auditIds: ['33333333-3333-4333-8333-333333333333'],
    })
    expect(bulkReadinessOutput.updatedCount).toBe(1)
  })

  it('exposes clients.bulkUpdateAssignee for Obligations bulk owner changes', () => {
    expect(Object.keys(clientsContract)).toEqual(
      expect.arrayContaining(['bulkUpdateAssignee', 'updatePenaltyInputs']),
    )
    const input = ClientBulkAssigneeUpdateInputSchema.parse({
      clientIds: ['22222222-2222-4222-8222-222222222222'],
      assigneeId: 'user_123',
      reason: 'rebalance queue',
    })
    expect(input.assigneeId).toBe('user_123')
    const output = ClientBulkAssigneeUpdateOutputSchema.parse({
      updatedCount: 1,
      auditId: '33333333-3333-4333-8333-333333333333',
    })
    expect(output.updatedCount).toBe(1)
  })

  it('exposes clients.updateJurisdiction for existing client fact edits', () => {
    expect(Object.keys(clientsContract)).toEqual(expect.arrayContaining(['updateJurisdiction']))
    const input = ClientJurisdictionUpdateSchema.parse({
      id: '22222222-2222-4222-8222-222222222222',
      state: 'WA',
      county: 'King',
      reason: 'client facts correction',
    })
    expect(input.state).toBe('WA')
    expect(input.county).toBe('King')
    const output = ClientJurisdictionUpdateOutputSchema.parse({
      client: {
        id: '22222222-2222-4222-8222-222222222222',
        firmId: '11111111-1111-4111-8111-111111111111',
        name: 'Riverbend Draft Client',
        ein: null,
        state: 'WA',
        county: 'King',
        entityType: 'llc',
        email: null,
        notes: null,
        assigneeId: null,
        assigneeName: null,
        importanceWeight: 1,
        lateFilingCountLast12mo: 0,
        estimatedTaxLiabilityCents: null,
        estimatedTaxLiabilitySource: null,
        equityOwnerCount: null,
        migrationBatchId: null,
        createdAt: '2026-05-01T00:00:00.000Z',
        updatedAt: '2026-05-02T00:00:00.000Z',
        deletedAt: null,
      },
      recalculatedObligationCount: 1,
      auditId: '33333333-3333-4333-8333-333333333333',
    })
    expect(output.client.state).toBe('WA')
    expect(output.recalculatedObligationCount).toBe(1)
  })

  it('freezes workboard.list input shape', () => {
    expect(Object.keys(workboardContract)).toEqual([
      'list',
      'getDetail',
      'facets',
      'listSavedViews',
      'createSavedView',
      'updateSavedView',
      'deleteSavedView',
      'exportSelected',
    ])
    expect(WorkboardSortSchema.options).toEqual([
      'smart_priority',
      'due_asc',
      'due_desc',
      'exposure_desc',
      'exposure_asc',
      'updated_desc',
    ])
    expect(WorkboardDensitySchema.options).toEqual(['comfortable', 'compact'])
    expect(WorkboardReadinessSchema.options).toEqual(['ready', 'waiting', 'needs_review'])

    const parsed = WorkboardListInputSchema.parse({
      status: ['pending', 'in_progress'],
      search: 'acme',
      obligationIds: ['22222222-2222-4222-8222-222222222222'],
      clientIds: ['11111111-1111-4111-8111-111111111111'],
      states: ['CA'],
      counties: ['Orange'],
      taxTypes: ['1040'],
      assigneeName: 'Sarah',
      assigneeNames: ['Mina'],
      owner: 'unassigned',
      due: 'overdue',
      dueWithinDays: 7,
      exposureStatus: 'ready',
      readiness: ['ready'],
      minExposureCents: 100_00,
      maxExposureCents: 500_00,
      minDaysUntilDue: -10,
      maxDaysUntilDue: 30,
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
    expect(() =>
      WorkboardListInputSchema.parse({
        clientIds: Array.from(
          { length: WORKBOARD_FILTER_MAX_SELECTIONS + 1 },
          (_, index) => `11111111-1111-4111-8111-${String(index).padStart(12, '0')}`,
        ),
      }),
    ).toThrow()

    const facets = WorkboardFacetsOutputSchema.parse({
      clients: [
        {
          value: '11111111-1111-4111-8111-111111111111',
          label: 'Acme Holdings LLC',
          count: 2,
          state: 'CA',
          county: 'Orange',
        },
      ],
      states: [{ value: 'CA', label: 'CA', count: 2 }],
      counties: [{ value: 'Orange', label: 'Orange, CA', count: 2, state: 'CA' }],
      taxTypes: [{ value: '1040', label: '1040', count: 2 }],
      assigneeNames: [{ value: 'Sarah', label: 'Sarah', count: 2 }],
    })
    expect(facets.clients[0]?.state).toBe('CA')

    const savedView = WorkboardSavedViewSchema.parse({
      id: '55555555-5555-4555-8555-555555555555',
      firmId: 'firm_123',
      createdByUserId: 'user_123',
      name: 'CA clients due in 14 days',
      query: { state: ['CA'], dueWithin: 14 },
      columnVisibility: { clientCounty: false },
      density: 'compact',
      isPinned: true,
      createdAt: '2026-04-29T00:00:00.000Z',
      updatedAt: '2026-04-29T00:00:00.000Z',
    })
    expect(savedView.isPinned).toBe(true)
    expect(
      WorkboardCreateSavedViewInputSchema.parse({
        name: 'Waiting on client',
        query: { status: ['waiting_on_client'] },
        columnVisibility: {},
        density: 'comfortable',
      }).name,
    ).toBe('Waiting on client')
    expect(
      WorkboardUpdateSavedViewInputSchema.parse({
        id: savedView.id,
        isPinned: false,
      }).isPinned,
    ).toBe(false)
    const exportInput = WorkboardExportSelectedInputSchema.parse({
      ids: ['11111111-1111-4111-8111-111111111111'],
      format: 'pdf_zip',
    })
    expect(exportInput.format).toBe('pdf_zip')
    expect(
      WorkboardExportSelectedOutputSchema.parse({
        fileName: 'workboard.zip',
        contentType: 'application/zip',
        contentBase64: 'abcd',
        auditId: '33333333-3333-4333-8333-333333333333',
      }).fileName,
    ).toBe('workboard.zip')
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
      managerInsights: {
        capacityOwnerLabel: 'Sarah',
        capacityLoadScore: 100,
        capacityOpen: 2,
        unassignedOpen: 1,
        waitingOpen: 1,
        reviewOpen: 0,
      },
    })
    expect(output.rows[0]?.ownerLabel).toBe('Sarah')
    expect(output.managerInsights?.capacityOwnerLabel).toBe('Sarah')
  })

  it('freezes migration.listErrors stages', () => {
    expect(MigrationErrorStageSchema.options).toEqual(['mapping', 'normalize', 'matrix', 'all'])
    expect(Object.keys(migrationContract)).toEqual(
      expect.arrayContaining([
        'runMapper',
        'stageExternalRows',
        'cloneStagingRows',
        'applyDefaultMatrix',
        'discardDraft',
        'listErrors',
      ]),
    )
    expect(MigrationSourceSchema.options).toEqual(
      expect.arrayContaining(['integration_taxdome_zapier', 'integration_karbon_api']),
    )
    expect(MigrationIntegrationProviderSchema.options).toEqual([
      'taxdome',
      'karbon',
      'soraban',
      'safesend',
      'proconnect',
    ])
    expect(
      MigrationStageExternalRowsInputSchema.parse({
        batchId: '11111111-1111-4111-8111-111111111111',
        provider: 'karbon',
        rows: [
          {
            externalId: 'work_123',
            externalEntityType: 'work_item',
            rawJson: { 'Organization Name': 'Acme LLC', State: 'CA' },
          },
        ],
      }).rows[0]?.externalEntityType,
    ).toBe('work_item')
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
    expect(AuditActionSchema.parse('migration.staging_rows.created')).toBe(
      'migration.staging_rows.created',
    )
    expect(AuditActionSchema.parse('migration.discarded')).toBe('migration.discarded')
    expect(PulseAuditActionSchema.parse('pulse.apply')).toBe('pulse.apply')
    expect(PulseAuditActionSchema.parse('pulse.dismiss')).toBe('pulse.dismiss')
    expect(PulseAuditActionSchema.parse('pulse.quarantine')).toBe('pulse.quarantine')
    expect(PulseAuditActionSchema.parse('pulse.source_revoked')).toBe('pulse.source_revoked')
    expect(PulseAuditActionSchema.parse('pulse.snooze')).toBe('pulse.snooze')
    expect(AuditActionSchema.parse('pulse.revert')).toBe('pulse.revert')
    expect(AuditActionSchema.parse('pulse.reactivate')).toBe('pulse.reactivate')
    expect(AuditActionSchema.parse('pulse.review_requested')).toBe('pulse.review_requested')
    expect(EvidenceSourceTypeSchema.parse('pulse_apply')).toBe('pulse_apply')
    expect(AuditActionSchema.parse('penalty.override')).toBe('penalty.override')
    expect(EvidenceSourceTypeSchema.parse('penalty_override')).toBe('penalty_override')
    expect(AuditActionSchema.parse('rules.published')).toBe('rules.published')
    expect(AuditActionSchema.parse('rules.review.rejected')).toBe('rules.review.rejected')
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
      'reactivate',
      'requestReview',
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
      sourceStatus: 'approved',
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

    const requestReviewInput = PulseRequestReviewInputSchema.parse({
      alertId: alert.id,
      note: ' Please review LA County applicability. ',
    })
    expect(requestReviewInput.note).toBe('Please review LA County applicability.')

    const requestReview = PulseRequestReviewOutputSchema.parse({
      notificationCount: 2,
      emailCount: 2,
      auditId: '99999999-9999-4999-8999-999999999999',
    })
    expect(requestReview.notificationCount).toBe(2)
    expect(requestReview.emailCount).toBe(2)
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
    expect(DashboardTriageTabKeySchema.options).toEqual(['this_week', 'this_month', 'long_term'])
    expect(DashboardDueBucketSchema.options).toEqual([
      'overdue',
      'today',
      'next_7_days',
      'next_30_days',
      'long_term',
    ])
    expect(DashboardEvidenceFilterSchema.options).toEqual(['needs', 'linked'])

    const input = DashboardLoadInputSchema.parse({
      clientIds: ['11111111-1111-4111-8111-111111111111'],
      taxTypes: ['ca_llc_annual_tax'],
      dueBuckets: ['overdue', 'next_7_days'],
      status: ['pending', 'review'],
      severity: ['critical'],
      exposureStatus: ['ready'],
      evidence: ['linked'],
    })
    expect(input?.dueBuckets).toEqual(['overdue', 'next_7_days'])
    expect(() =>
      DashboardLoadInputSchema.parse({
        clientIds: Array.from(
          { length: DASHBOARD_FILTER_MAX_SELECTIONS + 1 },
          (_, index) => `11111111-1111-4111-8111-${String(index).padStart(12, '0')}`,
        ),
      }),
    ).toThrow()

    const output = DashboardLoadOutputSchema.parse({
      asOfDate: '2026-04-28',
      windowDays: 7,
      summary: {
        openObligationCount: 1,
        dueThisWeekCount: 1,
        needsReviewCount: 0,
        evidenceGapCount: 0,
        totalExposureCents: 80000,
        exposureReadyCount: 1,
        exposureNeedsInputCount: 0,
        exposureUnsupportedCount: 0,
        totalAccruedPenaltyCents: 0,
        accruedPenaltyReadyCount: 0,
        accruedPenaltyNeedsInputCount: 0,
        accruedPenaltyUnsupportedCount: 0,
      },
      topRows: [
        {
          obligationId: '11111111-1111-4111-8111-111111111111',
          clientId: '22222222-2222-4222-8222-222222222222',
          clientName: 'Acme LLC',
          taxType: 'ca_llc_annual_tax',
          currentDueDate: '2026-04-30',
          status: 'pending',
          estimatedExposureCents: 80000,
          exposureStatus: 'ready',
          missingPenaltyFacts: [],
          penaltySourceRefs: [],
          penaltyFormulaLabel: 'California LLC annual tax penalty',
          penaltyFactsVersion: 'penalty-facts-v1',
          accruedPenaltyCents: 0,
          accruedPenaltyStatus: 'ready',
          accruedPenaltyBreakdown: [],
          penaltyAsOfDate: '2026-04-28',
          penaltyFormulaVersion: 'penalty-v3-allstates-2026q2',
          severity: 'critical',
          evidenceCount: 1,
          smartPriority: {
            version: 'smart-priority-v1',
            score: 42.5,
            rank: 1,
            factors: [],
          },
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
      triageTabs: [
        {
          key: 'this_week',
          label: 'This Week',
          count: 1,
          totalExposureCents: 80000,
          rows: [
            {
              obligationId: '11111111-1111-4111-8111-111111111111',
              clientId: '22222222-2222-4222-8222-222222222222',
              clientName: 'Acme LLC',
              taxType: 'ca_llc_annual_tax',
              currentDueDate: '2026-04-30',
              status: 'pending',
              estimatedExposureCents: 80000,
              exposureStatus: 'ready',
              missingPenaltyFacts: [],
              penaltySourceRefs: [],
              penaltyFormulaLabel: 'California LLC annual tax penalty',
              penaltyFactsVersion: 'penalty-facts-v1',
              accruedPenaltyCents: 0,
              accruedPenaltyStatus: 'ready',
              accruedPenaltyBreakdown: [],
              penaltyAsOfDate: '2026-04-28',
              penaltyFormulaVersion: 'penalty-v3-allstates-2026q2',
              severity: 'critical',
              evidenceCount: 1,
              smartPriority: {
                version: 'smart-priority-v1',
                score: 42.5,
                rank: 1,
                factors: [],
              },
              primaryEvidence: null,
            },
          ],
        },
        {
          key: 'this_month',
          label: 'This Month',
          count: 0,
          totalExposureCents: 0,
          rows: [],
        },
        {
          key: 'long_term',
          label: 'Long-term',
          count: 0,
          totalExposureCents: 0,
          rows: [],
        },
      ],
      facets: {
        clients: [
          {
            value: '22222222-2222-4222-8222-222222222222',
            label: 'Acme LLC',
            count: 1,
          },
        ],
        taxTypes: [{ value: 'ca_llc_annual_tax', label: 'ca_llc_annual_tax', count: 1 }],
        dueBuckets: [
          { value: 'overdue', label: 'overdue', count: 0 },
          { value: 'today', label: 'today', count: 0 },
          { value: 'next_7_days', label: 'next_7_days', count: 1 },
          { value: 'next_30_days', label: 'next_30_days', count: 0 },
          { value: 'long_term', label: 'long_term', count: 0 },
        ],
        statuses: [
          { value: 'pending', label: 'pending', count: 1 },
          { value: 'in_progress', label: 'in_progress', count: 0 },
          { value: 'waiting_on_client', label: 'waiting_on_client', count: 0 },
          { value: 'review', label: 'review', count: 0 },
        ],
        severities: [
          { value: 'critical', label: 'critical', count: 1 },
          { value: 'high', label: 'high', count: 0 },
          { value: 'medium', label: 'medium', count: 0 },
          { value: 'neutral', label: 'neutral', count: 0 },
        ],
        exposureStatuses: [
          { value: 'ready', label: 'ready', count: 1 },
          { value: 'needs_input', label: 'needs_input', count: 0 },
          { value: 'unsupported', label: 'unsupported', count: 0 },
        ],
        evidence: [
          { value: 'needs', label: 'needs', count: 0 },
          { value: 'linked', label: 'linked', count: 1 },
        ],
      },
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
      'listReviewDecisions',
      'verifyCandidate',
      'rejectCandidate',
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
          state: 'XX',
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
