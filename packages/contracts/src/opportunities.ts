import { oc } from '@orpc/contract'
import * as z from 'zod'
import { EntityTypeSchema, StateCodeSchema } from './shared/enums'
import { EntityIdSchema } from './shared/ids'

export const OpportunityKindSchema = z.enum([
  'advisory_conversation',
  'scope_review',
  'retention_check_in',
])
export type OpportunityKind = z.infer<typeof OpportunityKindSchema>

export const OpportunityTimingSchema = z.enum(['now', 'next_30_days', 'next_quarter'])
export type OpportunityTiming = z.infer<typeof OpportunityTimingSchema>

export const OpportunitySeveritySchema = z.enum(['high', 'medium', 'low'])
export type OpportunitySeverity = z.infer<typeof OpportunitySeveritySchema>

export const OpportunityListInputSchema = z
  .object({
    clientId: EntityIdSchema.optional(),
    kinds: z.array(OpportunityKindSchema).max(OpportunityKindSchema.options.length).optional(),
    limit: z.number().int().min(1).max(50).default(12).optional(),
  })
  .optional()
export type OpportunityListInput = z.infer<typeof OpportunityListInputSchema>

export const OpportunityClientSchema = z.object({
  id: EntityIdSchema,
  name: z.string().min(1),
  entityType: EntityTypeSchema,
  state: StateCodeSchema.nullable(),
  assigneeName: z.string().nullable(),
})
export type OpportunityClient = z.infer<typeof OpportunityClientSchema>

export const OpportunityEvidenceSchema = z.object({
  label: z.string().min(1).max(120),
  value: z.string().min(1).max(160),
})
export type OpportunityEvidence = z.infer<typeof OpportunityEvidenceSchema>

export const OpportunityPublicSchema = z.object({
  id: z.string().min(1).max(160),
  kind: OpportunityKindSchema,
  client: OpportunityClientSchema,
  title: z.string().min(1).max(160),
  summary: z.string().min(1).max(500),
  timing: OpportunityTimingSchema,
  severity: OpportunitySeveritySchema,
  evidence: z.array(OpportunityEvidenceSchema).min(1).max(5),
  primaryAction: z.object({
    label: z.string().min(1).max(80),
    href: z.string().min(1).max(240),
  }),
})
export type OpportunityPublic = z.infer<typeof OpportunityPublicSchema>

export const OpportunitySummarySchema = z.object({
  total: z.number().int().min(0),
  advisoryConversationCount: z.number().int().min(0),
  scopeReviewCount: z.number().int().min(0),
  retentionCheckInCount: z.number().int().min(0),
})
export type OpportunitySummary = z.infer<typeof OpportunitySummarySchema>

export const OpportunityListOutputSchema = z.object({
  opportunities: z.array(OpportunityPublicSchema),
  summary: OpportunitySummarySchema,
})
export type OpportunityListOutput = z.infer<typeof OpportunityListOutputSchema>

export const opportunitiesContract = oc.router({
  list: oc.input(OpportunityListInputSchema).output(OpportunityListOutputSchema),
})
export type OpportunitiesContract = typeof opportunitiesContract
