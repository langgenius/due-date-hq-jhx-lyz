import { oc } from '@orpc/contract'
import * as z from 'zod'
import { EvidencePublicSchema } from './evidence'
import { ObligationStatusSchema } from './shared/enums'
import { EntityIdSchema } from './shared/ids'

export const DashboardSeveritySchema = z.enum(['critical', 'high', 'medium', 'neutral'])
export type DashboardSeverity = z.infer<typeof DashboardSeveritySchema>

export const DashboardLoadInputSchema = z
  .object({
    asOfDate: z.iso.date().optional(),
    windowDays: z.number().int().min(1).max(31).default(7).optional(),
    topLimit: z.number().int().min(1).max(20).default(8).optional(),
  })
  .optional()
export type DashboardLoadInput = z.infer<typeof DashboardLoadInputSchema>

export const DashboardSummarySchema = z.object({
  openObligationCount: z.number().int().min(0),
  dueThisWeekCount: z.number().int().min(0),
  needsReviewCount: z.number().int().min(0),
  evidenceGapCount: z.number().int().min(0),
})
export type DashboardSummary = z.infer<typeof DashboardSummarySchema>

export const DashboardTopRowSchema = z.object({
  obligationId: EntityIdSchema,
  clientId: EntityIdSchema,
  clientName: z.string().min(1),
  taxType: z.string().min(1),
  currentDueDate: z.iso.date(),
  status: ObligationStatusSchema,
  severity: DashboardSeveritySchema,
  evidenceCount: z.number().int().min(0),
  primaryEvidence: EvidencePublicSchema.nullable(),
})
export type DashboardTopRow = z.infer<typeof DashboardTopRowSchema>

export const DashboardLoadOutputSchema = z.object({
  asOfDate: z.iso.date(),
  windowDays: z.number().int().min(1),
  summary: DashboardSummarySchema,
  topRows: z.array(DashboardTopRowSchema),
})
export type DashboardLoadOutput = z.infer<typeof DashboardLoadOutputSchema>

export const dashboardContract = oc.router({
  load: oc.input(DashboardLoadInputSchema).output(DashboardLoadOutputSchema),
})
export type DashboardContract = typeof dashboardContract
