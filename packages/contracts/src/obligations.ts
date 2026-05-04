import { oc } from '@orpc/contract'
import * as z from 'zod'
import { AiInsightPublicSchema } from './ai-insights'
import { ObligationGenerationPreviewSchema } from './rules'
import {
  ExposureStatusSchema,
  ObligationExtensionDecisionSchema,
  ObligationReadinessSchema,
  ObligationStatusSchema,
} from './shared/enums'
import { EntityIdSchema, TenantIdSchema } from './shared/ids'

export const PenaltySourceRefSchema = z.object({
  label: z.string().min(1),
  url: z.url(),
  sourceExcerpt: z.string().min(1),
  effectiveDate: z.iso.date(),
  lastReviewedDate: z.iso.date(),
})
export type PenaltySourceRef = z.infer<typeof PenaltySourceRefSchema>

export const PenaltyBreakdownItemSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  amountCents: z.number().int().min(0),
  formula: z.string().min(1),
  inputs: z.record(z.string(), z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  sourceRefs: z.array(PenaltySourceRefSchema).optional(),
})
export type PenaltyBreakdownItem = z.infer<typeof PenaltyBreakdownItemSchema>

export const ObligationInstancePublicSchema = z.object({
  id: EntityIdSchema,
  firmId: TenantIdSchema,
  clientId: EntityIdSchema,
  taxType: z.string().min(1),
  taxYear: z.number().int().min(1900).max(2100).nullable(),
  ruleId: z.string().min(1).nullable(),
  ruleVersion: z.number().int().positive().nullable(),
  rulePeriod: z.string().min(1).nullable(),
  generationSource: z.enum(['migration', 'manual', 'annual_rollover', 'pulse']).nullable(),
  baseDueDate: z.iso.date(),
  currentDueDate: z.iso.date(),
  status: ObligationStatusSchema,
  readiness: ObligationReadinessSchema,
  extensionDecision: ObligationExtensionDecisionSchema,
  extensionMemo: z.string().nullable(),
  extensionSource: z.string().nullable(),
  extensionExpectedDueDate: z.iso.date().nullable(),
  extensionDecidedAt: z.iso.datetime().nullable(),
  extensionDecidedByUserId: z.string().nullable(),
  migrationBatchId: EntityIdSchema.nullable(),
  estimatedTaxDueCents: z.number().int().min(0).nullable(),
  estimatedExposureCents: z.number().int().min(0).nullable(),
  exposureStatus: ExposureStatusSchema,
  penaltyBreakdown: z.array(PenaltyBreakdownItemSchema),
  missingPenaltyFacts: z.array(z.string().min(1)),
  penaltySourceRefs: z.array(PenaltySourceRefSchema),
  penaltyFormulaLabel: z.string().nullable(),
  penaltyFactsVersion: z.string().nullable(),
  accruedPenaltyCents: z.number().int().min(0).nullable(),
  accruedPenaltyStatus: ExposureStatusSchema,
  accruedPenaltyBreakdown: z.array(PenaltyBreakdownItemSchema),
  penaltyAsOfDate: z.iso.date(),
  penaltyFormulaVersion: z.string().nullable(),
  exposureCalculatedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const ObligationCreateInputSchema = z.object({
  clientId: EntityIdSchema,
  taxType: z.string().min(1),
  taxYear: z.number().int().min(1900).max(2100).nullable().optional(),
  ruleId: z.string().min(1).nullable().optional(),
  ruleVersion: z.number().int().positive().nullable().optional(),
  rulePeriod: z.string().min(1).nullable().optional(),
  generationSource: z
    .enum(['migration', 'manual', 'annual_rollover', 'pulse'])
    .nullable()
    .optional(),
  baseDueDate: z.iso.date(),
  currentDueDate: z.iso.date().optional(),
  status: ObligationStatusSchema.optional(),
  readiness: ObligationReadinessSchema.optional(),
  migrationBatchId: EntityIdSchema.nullable().optional(),
  estimatedTaxDueCents: z.number().int().min(0).nullable().optional(),
  estimatedExposureCents: z.number().int().min(0).nullable().optional(),
  exposureStatus: ExposureStatusSchema.optional(),
  penaltyFacts: z.unknown().optional(),
  penaltyFactsVersion: z.string().nullable().optional(),
  penaltyBreakdown: z.array(PenaltyBreakdownItemSchema).optional(),
  penaltyFormulaVersion: z.string().nullable().optional(),
  missingPenaltyFacts: z.array(z.string().min(1)).optional(),
  penaltySourceRefs: z.array(PenaltySourceRefSchema).optional(),
  penaltyFormulaLabel: z.string().nullable().optional(),
  exposureCalculatedAt: z.iso.datetime().nullable().optional(),
})

export const DueDateUpdateInputSchema = z.object({
  id: EntityIdSchema,
  currentDueDate: z.iso.date(),
})

export const ObligationStatusUpdateInputSchema = z.object({
  id: EntityIdSchema,
  status: ObligationStatusSchema,
  reason: z.string().max(280).optional(),
})

export const ObligationStatusUpdateOutputSchema = z.object({
  obligation: ObligationInstancePublicSchema,
  auditId: EntityIdSchema,
})

export const ObligationReadinessUpdateInputSchema = z.object({
  id: EntityIdSchema,
  readiness: ObligationReadinessSchema,
  reason: z.string().max(280).optional(),
})

export const ObligationReadinessUpdateOutputSchema = z.object({
  obligation: ObligationInstancePublicSchema,
  auditId: EntityIdSchema,
})

export const ObligationExtensionDecisionInputSchema = z.object({
  id: EntityIdSchema,
  decision: ObligationExtensionDecisionSchema.exclude(['not_considered']),
  memo: z.string().trim().max(1000).optional(),
  source: z.string().trim().max(240).optional(),
  expectedExtendedDueDate: z.iso.date().optional(),
})

export const ObligationExtensionDecisionOutputSchema = z.object({
  obligation: ObligationInstancePublicSchema,
  auditId: EntityIdSchema,
  evidenceId: EntityIdSchema.nullable(),
})

export const ObligationBulkStatusUpdateInputSchema = z.object({
  ids: z.array(EntityIdSchema).min(1).max(100),
  status: ObligationStatusSchema,
  reason: z.string().max(280).optional(),
})
export type ObligationBulkStatusUpdateInput = z.infer<typeof ObligationBulkStatusUpdateInputSchema>

export const ObligationBulkStatusUpdateOutputSchema = z.object({
  updatedCount: z.number().int().min(0),
  auditIds: z.array(EntityIdSchema),
})
export type ObligationBulkStatusUpdateOutput = z.infer<
  typeof ObligationBulkStatusUpdateOutputSchema
>

export const ObligationBulkReadinessUpdateInputSchema = z.object({
  ids: z.array(EntityIdSchema).min(1).max(100),
  readiness: ObligationReadinessSchema,
  reason: z.string().max(280).optional(),
})
export type ObligationBulkReadinessUpdateInput = z.infer<
  typeof ObligationBulkReadinessUpdateInputSchema
>

export const ObligationBulkReadinessUpdateOutputSchema = z.object({
  updatedCount: z.number().int().min(0),
  auditIds: z.array(EntityIdSchema),
})
export type ObligationBulkReadinessUpdateOutput = z.infer<
  typeof ObligationBulkReadinessUpdateOutputSchema
>

export const DeadlineTipInputSchema = z.object({ obligationId: EntityIdSchema })
export type DeadlineTipInput = z.infer<typeof DeadlineTipInputSchema>

export const DeadlineTipRefreshInputSchema = z.object({ obligationId: EntityIdSchema })
export type DeadlineTipRefreshInput = z.infer<typeof DeadlineTipRefreshInputSchema>

export const DeadlineTipRefreshOutputSchema = z.object({
  queued: z.boolean(),
  insight: AiInsightPublicSchema,
})
export type DeadlineTipRefreshOutput = z.infer<typeof DeadlineTipRefreshOutputSchema>

export const AnnualRolloverInputSchema = z
  .object({
    sourceFilingYear: z.number().int().min(1900).max(2100),
    targetFilingYear: z.number().int().min(1901).max(2101),
    clientIds: z.array(EntityIdSchema).min(1).max(100).optional(),
  })
  .refine((input) => input.targetFilingYear === input.sourceFilingYear + 1, {
    message: 'targetFilingYear must be the next filing year.',
    path: ['targetFilingYear'],
  })
export type AnnualRolloverInput = z.infer<typeof AnnualRolloverInputSchema>

export const AnnualRolloverDispositionSchema = z.enum([
  'will_create',
  'review',
  'duplicate',
  'missing_verified_rule',
  'missing_due_date',
])
export type AnnualRolloverDisposition = z.infer<typeof AnnualRolloverDispositionSchema>

export const AnnualRolloverTargetStatusSchema = ObligationStatusSchema.extract([
  'pending',
  'review',
])
export type AnnualRolloverTargetStatus = z.infer<typeof AnnualRolloverTargetStatusSchema>

export const AnnualRolloverRowSchema = z.object({
  clientId: EntityIdSchema,
  clientName: z.string().min(1),
  taxType: z.string().min(1),
  sourceObligationIds: z.array(EntityIdSchema),
  preview: ObligationGenerationPreviewSchema.nullable(),
  disposition: AnnualRolloverDispositionSchema,
  targetStatus: AnnualRolloverTargetStatusSchema.nullable(),
  duplicateObligationId: EntityIdSchema.nullable(),
  createdObligationId: EntityIdSchema.nullable(),
  skippedReason: z.string().min(1).nullable(),
})
export type AnnualRolloverRow = z.infer<typeof AnnualRolloverRowSchema>

export const AnnualRolloverSummarySchema = z.object({
  sourceFilingYear: z.number().int().min(1900).max(2100),
  targetFilingYear: z.number().int().min(1901).max(2101),
  seedObligationCount: z.number().int().min(0),
  clientCount: z.number().int().min(0),
  willCreateCount: z.number().int().min(0),
  reviewCount: z.number().int().min(0),
  duplicateCount: z.number().int().min(0),
  skippedCount: z.number().int().min(0),
  createdCount: z.number().int().min(0),
})
export type AnnualRolloverSummary = z.infer<typeof AnnualRolloverSummarySchema>

export const AnnualRolloverOutputSchema = z.object({
  summary: AnnualRolloverSummarySchema,
  rows: z.array(AnnualRolloverRowSchema),
  auditId: EntityIdSchema.nullable(),
})
export type AnnualRolloverOutput = z.infer<typeof AnnualRolloverOutputSchema>

export const obligationsContract = oc.router({
  createBatch: oc
    .input(z.object({ obligations: z.array(ObligationCreateInputSchema).min(1).max(1000) }))
    .output(z.object({ obligations: z.array(ObligationInstancePublicSchema) })),
  previewAnnualRollover: oc.input(AnnualRolloverInputSchema).output(AnnualRolloverOutputSchema),
  createAnnualRollover: oc.input(AnnualRolloverInputSchema).output(AnnualRolloverOutputSchema),
  updateDueDate: oc.input(DueDateUpdateInputSchema).output(ObligationInstancePublicSchema),
  /**
   * Update one obligation's status. Handler must read `before`, write the
   * row, and append an `obligation.status.updated` audit row carrying both
   * `before` and `after` payloads. Returns the updated row + audit id so
   * the Obligations UI can surface the audit reference inline.
   */
  updateStatus: oc
    .input(ObligationStatusUpdateInputSchema)
    .output(ObligationStatusUpdateOutputSchema),
  bulkUpdateStatus: oc
    .input(ObligationBulkStatusUpdateInputSchema)
    .output(ObligationBulkStatusUpdateOutputSchema),
  updateReadiness: oc
    .input(ObligationReadinessUpdateInputSchema)
    .output(ObligationReadinessUpdateOutputSchema),
  decideExtension: oc
    .input(ObligationExtensionDecisionInputSchema)
    .output(ObligationExtensionDecisionOutputSchema),
  bulkUpdateReadiness: oc
    .input(ObligationBulkReadinessUpdateInputSchema)
    .output(ObligationBulkReadinessUpdateOutputSchema),
  listByClient: oc
    .input(z.object({ clientId: EntityIdSchema }))
    .output(z.array(ObligationInstancePublicSchema)),
  getDeadlineTip: oc.input(DeadlineTipInputSchema).output(AiInsightPublicSchema),
  requestDeadlineTipRefresh: oc
    .input(DeadlineTipRefreshInputSchema)
    .output(DeadlineTipRefreshOutputSchema),
})

export type ObligationInstancePublic = z.infer<typeof ObligationInstancePublicSchema>
export type ObligationCreateInput = z.infer<typeof ObligationCreateInputSchema>
export type DueDateUpdateInput = z.infer<typeof DueDateUpdateInputSchema>
export type ObligationStatusUpdateInput = z.infer<typeof ObligationStatusUpdateInputSchema>
export type ObligationStatusUpdateOutput = z.infer<typeof ObligationStatusUpdateOutputSchema>
export type ObligationReadinessUpdateInput = z.infer<typeof ObligationReadinessUpdateInputSchema>
export type ObligationReadinessUpdateOutput = z.infer<typeof ObligationReadinessUpdateOutputSchema>
export type ObligationExtensionDecisionInput = z.infer<
  typeof ObligationExtensionDecisionInputSchema
>
export type ObligationExtensionDecisionOutput = z.infer<
  typeof ObligationExtensionDecisionOutputSchema
>
export type ObligationsContract = typeof obligationsContract
