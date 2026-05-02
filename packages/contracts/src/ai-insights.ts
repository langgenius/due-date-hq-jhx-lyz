import * as z from 'zod'
import { EntityIdSchema } from './shared/ids'

export const AiInsightKindSchema = z.enum(['client_risk_summary', 'deadline_tip'])
export type AiInsightKind = z.infer<typeof AiInsightKindSchema>

export const AiInsightStatusSchema = z.enum(['pending', 'ready', 'failed', 'stale'])
export type AiInsightStatus = z.infer<typeof AiInsightStatusSchema>

export const AiInsightCitationEvidenceSchema = z
  .object({
    id: EntityIdSchema.nullable(),
    sourceType: z.string().min(1),
    sourceId: z.string().nullable(),
    sourceUrl: z.url().nullable(),
  })
  .nullable()
export type AiInsightCitationEvidence = z.infer<typeof AiInsightCitationEvidenceSchema>

export const AiInsightCitationSchema = z.object({
  ref: z.number().int().min(1),
  obligationId: EntityIdSchema.nullable(),
  evidence: AiInsightCitationEvidenceSchema,
})
export type AiInsightCitation = z.infer<typeof AiInsightCitationSchema>

export const AiInsightSectionSchema = z.object({
  key: z.string().min(1).max(80),
  label: z.string().min(1).max(120),
  text: z.string().min(1).max(800),
  citationRefs: z.array(z.number().int().min(1)).max(6),
})
export type AiInsightSection = z.infer<typeof AiInsightSectionSchema>

export const AiInsightPublicSchema = z.object({
  kind: AiInsightKindSchema,
  subjectId: EntityIdSchema,
  status: AiInsightStatusSchema,
  generatedAt: z.iso.datetime().nullable(),
  expiresAt: z.iso.datetime().nullable(),
  sections: z.array(AiInsightSectionSchema),
  citations: z.array(AiInsightCitationSchema),
  aiOutputId: EntityIdSchema.nullable(),
  errorCode: z.string().nullable(),
})
export type AiInsightPublic = z.infer<typeof AiInsightPublicSchema>
