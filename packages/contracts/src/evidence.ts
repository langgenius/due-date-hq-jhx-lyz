import { oc } from '@orpc/contract'
import * as z from 'zod'
import { EntityIdSchema } from './shared/ids'

export const EvidencePublicSchema = z.object({
  id: EntityIdSchema,
  obligationInstanceId: EntityIdSchema.nullable(),
  aiOutputId: EntityIdSchema.nullable(),
  sourceType: z.string().min(1),
  sourceId: z.string().nullable(),
  sourceUrl: z.url().nullable(),
  verbatimQuote: z.string().nullable(),
  rawValue: z.string().nullable(),
  normalizedValue: z.string().nullable(),
  confidence: z.number().min(0).max(1).nullable(),
  model: z.string().nullable(),
  appliedAt: z.iso.datetime(),
})
export type EvidencePublic = z.infer<typeof EvidencePublicSchema>

const ObligationIdInput = z.object({ obligationId: EntityIdSchema })

export const evidenceContract = oc.router({
  listByObligation: oc
    .input(ObligationIdInput)
    .output(z.object({ evidence: z.array(EvidencePublicSchema) })),
})
export type EvidenceContract = typeof evidenceContract
