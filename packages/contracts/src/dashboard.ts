import { oc } from '@orpc/contract'
import * as z from 'zod'
import { EvidencePublicSchema } from './evidence'
import { ExposureStatusSchema, ObligationStatusSchema } from './shared/enums'
import { EntityIdSchema } from './shared/ids'

export const DashboardSeveritySchema = z.enum(['critical', 'high', 'medium', 'neutral'])
export type DashboardSeverity = z.infer<typeof DashboardSeveritySchema>

export const DashboardTriageTabKeySchema = z.enum(['this_week', 'this_month', 'long_term'])
export type DashboardTriageTabKey = z.infer<typeof DashboardTriageTabKeySchema>

export const DashboardBriefStatusSchema = z.enum(['pending', 'ready', 'failed', 'stale'])
export type DashboardBriefStatus = z.infer<typeof DashboardBriefStatusSchema>

export const DashboardBriefScopeSchema = z.enum(['firm', 'me'])
export type DashboardBriefScope = z.infer<typeof DashboardBriefScopeSchema>

export const DashboardBriefCitationEvidenceSchema = z
  .object({
    id: EntityIdSchema.nullable(),
    sourceType: z.string().min(1),
    sourceId: z.string().nullable(),
    sourceUrl: z.string().nullable(),
  })
  .nullable()
export type DashboardBriefCitationEvidence = z.infer<typeof DashboardBriefCitationEvidenceSchema>

export const DashboardBriefCitationSchema = z.object({
  ref: z.number().int().min(1),
  obligationId: EntityIdSchema,
  evidence: DashboardBriefCitationEvidenceSchema,
})
export type DashboardBriefCitation = z.infer<typeof DashboardBriefCitationSchema>

export const DashboardBriefCitationsSchema = z.array(DashboardBriefCitationSchema)
export type DashboardBriefCitations = z.infer<typeof DashboardBriefCitationsSchema>

export const DashboardLoadInputSchema = z
  .object({
    asOfDate: z.iso.date().optional(),
    windowDays: z.number().int().min(1).max(31).default(7).optional(),
    topLimit: z.number().int().min(1).max(20).default(8).optional(),
    briefScope: DashboardBriefScopeSchema.default('firm').optional(),
  })
  .optional()
export type DashboardLoadInput = z.infer<typeof DashboardLoadInputSchema>

export const DashboardSummarySchema = z.object({
  openObligationCount: z.number().int().min(0),
  dueThisWeekCount: z.number().int().min(0),
  needsReviewCount: z.number().int().min(0),
  evidenceGapCount: z.number().int().min(0),
  totalExposureCents: z.number().int().min(0),
  exposureReadyCount: z.number().int().min(0),
  exposureNeedsInputCount: z.number().int().min(0),
  exposureUnsupportedCount: z.number().int().min(0),
})
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>

export const DashboardTopRowSchema = z.object({
  obligationId: EntityIdSchema,
  clientId: EntityIdSchema,
  clientName: z.string().min(1),
  taxType: z.string().min(1),
  currentDueDate: z.iso.date(),
  status: ObligationStatusSchema,
  estimatedExposureCents: z.number().int().min(0).nullable(),
  exposureStatus: ExposureStatusSchema,
  penaltyFormulaVersion: z.string().nullable(),
  severity: DashboardSeveritySchema,
  evidenceCount: z.number().int().min(0),
  primaryEvidence: EvidencePublicSchema.nullable(),
})
export type DashboardTopRow = z.infer<typeof DashboardTopRowSchema>

export const DashboardTriageTabSchema = z.object({
  key: DashboardTriageTabKeySchema,
  label: z.string().min(1),
  count: z.number().int().min(0),
  totalExposureCents: z.number().int().min(0),
  rows: z.array(DashboardTopRowSchema),
})
export type DashboardTriageTab = z.infer<typeof DashboardTriageTabSchema>

export const DashboardBriefPublicSchema = z.object({
  status: DashboardBriefStatusSchema,
  generatedAt: z.iso.datetime().nullable(),
  expiresAt: z.iso.datetime().nullable(),
  text: z.string().nullable(),
  citations: DashboardBriefCitationsSchema.nullable(),
  aiOutputId: EntityIdSchema.nullable(),
  errorCode: z.string().nullable(),
})
export type DashboardBriefPublic = z.infer<typeof DashboardBriefPublicSchema>

export const DashboardLoadOutputSchema = z.object({
  asOfDate: z.iso.date(),
  windowDays: z.number().int().min(1),
  summary: DashboardSummarySchema,
  topRows: z.array(DashboardTopRowSchema),
  triageTabs: z.array(DashboardTriageTabSchema),
  brief: DashboardBriefPublicSchema.nullable(),
})
export type DashboardLoadOutput = z.infer<typeof DashboardLoadOutputSchema>

export const DashboardRequestBriefRefreshInputSchema = z
  .object({
    scope: DashboardBriefScopeSchema.default('firm').optional(),
  })
  .optional()
export type DashboardRequestBriefRefreshInput = z.infer<
  typeof DashboardRequestBriefRefreshInputSchema
>

export const DashboardRequestBriefRefreshOutputSchema = z.object({
  queued: z.boolean(),
  brief: DashboardBriefPublicSchema.nullable(),
})
export type DashboardRequestBriefRefreshOutput = z.infer<
  typeof DashboardRequestBriefRefreshOutputSchema
>

export const dashboardContract = oc.router({
  load: oc.input(DashboardLoadInputSchema).output(DashboardLoadOutputSchema),
  requestBriefRefresh: oc
    .input(DashboardRequestBriefRefreshInputSchema)
    .output(DashboardRequestBriefRefreshOutputSchema),
})
export type DashboardContract = typeof dashboardContract
