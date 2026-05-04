import * as z from 'zod'
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
  clientFilingProfileId: EntityIdSchema.nullable(),
  taxType: z.string().min(1),
  taxYear: z.number().int().min(1900).max(2100).nullable(),
  ruleId: z.string().min(1).nullable(),
  ruleVersion: z.number().int().positive().nullable(),
  rulePeriod: z.string().min(1).nullable(),
  generationSource: z.enum(['migration', 'manual', 'annual_rollover', 'pulse']).nullable(),
  jurisdiction: z.string().min(1).nullable(),
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
export type ObligationInstancePublic = z.infer<typeof ObligationInstancePublicSchema>
