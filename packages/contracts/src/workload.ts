import { oc } from '@orpc/contract'
import * as z from 'zod'

export const WorkloadWindowMaxDays = 30

export const WorkloadLoadInputSchema = z.object({
  asOfDate: z.iso.date().optional(),
  windowDays: z.number().int().min(1).max(WorkloadWindowMaxDays).default(7).optional(),
})
export type WorkloadLoadInput = z.infer<typeof WorkloadLoadInputSchema>

export const WorkloadOwnerKindSchema = z.enum(['assignee', 'unassigned'])
export type WorkloadOwnerKind = z.infer<typeof WorkloadOwnerKindSchema>

export const WorkloadSummarySchema = z.object({
  open: z.number().int().min(0),
  dueSoon: z.number().int().min(0),
  overdue: z.number().int().min(0),
  waiting: z.number().int().min(0),
  review: z.number().int().min(0),
  unassigned: z.number().int().min(0),
})
export type WorkloadSummary = z.infer<typeof WorkloadSummarySchema>

export const WorkloadOwnerRowSchema = WorkloadSummarySchema.omit({ unassigned: true }).extend({
  id: z.string().min(1),
  ownerLabel: z.string().min(1),
  assigneeName: z.string().min(1).nullable(),
  kind: WorkloadOwnerKindSchema,
  loadScore: z.number().int().min(0).max(100),
})
export type WorkloadOwnerRow = z.infer<typeof WorkloadOwnerRowSchema>

export const WorkloadManagerInsightsSchema = z.object({
  capacityOwnerLabel: z.string().min(1).nullable(),
  capacityLoadScore: z.number().int().min(0).max(100),
  capacityOpen: z.number().int().min(0),
  unassignedOpen: z.number().int().min(0),
  waitingOpen: z.number().int().min(0),
  reviewOpen: z.number().int().min(0),
})
export type WorkloadManagerInsights = z.infer<typeof WorkloadManagerInsightsSchema>

export const WorkloadLoadOutputSchema = z.object({
  asOfDate: z.iso.date(),
  windowDays: z.number().int().min(1).max(WorkloadWindowMaxDays),
  summary: WorkloadSummarySchema,
  rows: z.array(WorkloadOwnerRowSchema),
  managerInsights: WorkloadManagerInsightsSchema.nullable(),
})
export type WorkloadLoadOutput = z.infer<typeof WorkloadLoadOutputSchema>

export const workloadContract = oc.router({
  load: oc.input(WorkloadLoadInputSchema).output(WorkloadLoadOutputSchema),
})
export type WorkloadContract = typeof workloadContract
