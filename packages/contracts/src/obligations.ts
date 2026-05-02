import { oc } from '@orpc/contract'
import * as z from 'zod'
import {
  ExposureStatusSchema,
  ObligationExtensionDecisionSchema,
  ObligationReadinessSchema,
  ObligationStatusSchema,
} from './shared/enums'
import { EntityIdSchema, TenantIdSchema } from './shared/ids'

export const PenaltyBreakdownItemSchema = z.object({
  key: z.string().min(1),
  label: z.string().min(1),
  amountCents: z.number().int().min(0),
  formula: z.string().min(1),
})
export type PenaltyBreakdownItem = z.infer<typeof PenaltyBreakdownItemSchema>

export const ObligationInstancePublicSchema = z.object({
  id: EntityIdSchema,
  firmId: TenantIdSchema,
  clientId: EntityIdSchema,
  taxType: z.string().min(1),
  taxYear: z.number().int().min(1900).max(2100).nullable(),
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
  penaltyFormulaVersion: z.string().nullable(),
  exposureCalculatedAt: z.iso.datetime().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})

export const ObligationCreateInputSchema = z.object({
  clientId: EntityIdSchema,
  taxType: z.string().min(1),
  taxYear: z.number().int().min(1900).max(2100).nullable().optional(),
  baseDueDate: z.iso.date(),
  currentDueDate: z.iso.date().optional(),
  status: ObligationStatusSchema.optional(),
  readiness: ObligationReadinessSchema.optional(),
  migrationBatchId: EntityIdSchema.nullable().optional(),
  estimatedTaxDueCents: z.number().int().min(0).nullable().optional(),
  estimatedExposureCents: z.number().int().min(0).nullable().optional(),
  exposureStatus: ExposureStatusSchema.optional(),
  penaltyBreakdown: z.array(PenaltyBreakdownItemSchema).optional(),
  penaltyFormulaVersion: z.string().nullable().optional(),
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

export const obligationsContract = oc.router({
  createBatch: oc
    .input(z.object({ obligations: z.array(ObligationCreateInputSchema).min(1).max(1000) }))
    .output(z.object({ obligations: z.array(ObligationInstancePublicSchema) })),
  updateDueDate: oc.input(DueDateUpdateInputSchema).output(ObligationInstancePublicSchema),
  /**
   * Update one obligation's status. Handler must read `before`, write the
   * row, and append an `obligation.status.updated` audit row carrying both
   * `before` and `after` payloads. Returns the updated row + audit id so
   * the workboard UI can surface the audit reference inline.
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
