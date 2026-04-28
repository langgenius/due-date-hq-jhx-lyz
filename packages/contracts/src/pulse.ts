import { oc } from '@orpc/contract'
import * as z from 'zod'
import { EntityTypeSchema, ObligationStatusSchema, StateCodeSchema } from './shared/enums'
import { EntityIdSchema } from './shared/ids'

export const PulseStatusSchema = z.enum([
  'pending_review',
  'approved',
  'rejected',
  'quarantined',
  'source_revoked',
])
export type PulseStatus = z.infer<typeof PulseStatusSchema>

export const PulseFirmAlertStatusSchema = z.enum([
  'matched',
  'dismissed',
  'snoozed',
  'partially_applied',
  'applied',
  'reverted',
])
export type PulseFirmAlertStatus = z.infer<typeof PulseFirmAlertStatusSchema>

export const PulseAffectedClientStatusSchema = z.enum([
  'eligible',
  'needs_review',
  'already_applied',
  'reverted',
])
export type PulseAffectedClientStatus = z.infer<typeof PulseAffectedClientStatusSchema>

export const PulseAlertPublicSchema = z.object({
  id: EntityIdSchema,
  pulseId: EntityIdSchema,
  status: PulseFirmAlertStatusSchema,
  title: z.string().min(1),
  source: z.string().min(1),
  sourceUrl: z.url(),
  summary: z.string().min(1),
  publishedAt: z.iso.datetime(),
  matchedCount: z.number().int().min(0),
  needsReviewCount: z.number().int().min(0),
  confidence: z.number().min(0).max(1),
  isSample: z.boolean(),
})
export type PulseAlertPublic = z.infer<typeof PulseAlertPublicSchema>

export const PulseAffectedClientSchema = z.object({
  obligationId: EntityIdSchema,
  clientId: EntityIdSchema,
  clientName: z.string().min(1),
  state: StateCodeSchema.nullable(),
  county: z.string().nullable(),
  entityType: EntityTypeSchema,
  taxType: z.string().min(1),
  currentDueDate: z.iso.date(),
  newDueDate: z.iso.date(),
  status: ObligationStatusSchema,
  matchStatus: PulseAffectedClientStatusSchema,
  reason: z.string().nullable(),
})
export type PulseAffectedClient = z.infer<typeof PulseAffectedClientSchema>

export const PulseDetailSchema = z.object({
  alert: PulseAlertPublicSchema,
  jurisdiction: StateCodeSchema,
  counties: z.array(z.string()),
  forms: z.array(z.string()),
  entityTypes: z.array(EntityTypeSchema),
  originalDueDate: z.iso.date(),
  newDueDate: z.iso.date(),
  effectiveFrom: z.iso.date().nullable(),
  sourceExcerpt: z.string().min(1),
  reviewedAt: z.iso.datetime().nullable(),
  affectedClients: z.array(PulseAffectedClientSchema),
})
export type PulseDetail = z.infer<typeof PulseDetailSchema>

export const PulseListAlertsInputSchema = z
  .object({
    limit: z.number().int().min(1).max(20).default(5).optional(),
  })
  .optional()
export type PulseListAlertsInput = z.infer<typeof PulseListAlertsInputSchema>

export const PulseAlertIdInputSchema = z.object({ alertId: EntityIdSchema })

export const PulseApplyInputSchema = z.object({
  alertId: EntityIdSchema,
  obligationIds: z.array(EntityIdSchema).min(1).max(100),
})
export type PulseApplyInput = z.infer<typeof PulseApplyInputSchema>

export const PulseApplyOutputSchema = z.object({
  alert: PulseAlertPublicSchema,
  appliedCount: z.number().int().min(0),
  auditIds: z.array(EntityIdSchema),
  evidenceIds: z.array(EntityIdSchema),
  applicationIds: z.array(EntityIdSchema),
  emailOutboxId: EntityIdSchema,
  revertExpiresAt: z.iso.datetime(),
})
export type PulseApplyOutput = z.infer<typeof PulseApplyOutputSchema>

export const PulseDismissOutputSchema = z.object({
  alert: PulseAlertPublicSchema,
  auditId: EntityIdSchema,
})
export type PulseDismissOutput = z.infer<typeof PulseDismissOutputSchema>

export const PulseRevertOutputSchema = z.object({
  alert: PulseAlertPublicSchema,
  revertedCount: z.number().int().min(0),
  auditIds: z.array(EntityIdSchema),
  evidenceIds: z.array(EntityIdSchema),
})
export type PulseRevertOutput = z.infer<typeof PulseRevertOutputSchema>

export const pulseContract = oc.router({
  listAlerts: oc
    .input(PulseListAlertsInputSchema)
    .output(z.object({ alerts: z.array(PulseAlertPublicSchema) })),
  getDetail: oc.input(PulseAlertIdInputSchema).output(PulseDetailSchema),
  apply: oc.input(PulseApplyInputSchema).output(PulseApplyOutputSchema),
  dismiss: oc.input(PulseAlertIdInputSchema).output(PulseDismissOutputSchema),
  revert: oc.input(PulseAlertIdInputSchema).output(PulseRevertOutputSchema),
})
export type PulseContract = typeof pulseContract
