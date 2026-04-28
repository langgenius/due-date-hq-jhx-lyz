import * as z from 'zod'

export const EvidenceSourceTypes = [
  'default_inference_by_entity_state',
  'migration_revert',
  'ai_mapper',
  'ai_normalizer',
  'verified_rule',
  'user_override',
] as const

export const EvidenceSourceTypeSchema = z.enum(EvidenceSourceTypes)
export type EvidenceSourceType = z.infer<typeof EvidenceSourceTypeSchema>
