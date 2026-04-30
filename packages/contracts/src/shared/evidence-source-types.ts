import * as z from 'zod'

export const EvidenceSourceTypes = [
  'default_inference_by_entity_state',
  'migration_revert',
  'ai_mapper',
  'ai_normalizer',
  'verified_rule',
  'pulse_apply',
  'pulse_revert',
  'user_override',
  'penalty_override',
  'migration_raw_upload',
] as const

export const EvidenceSourceTypeSchema = z.enum(EvidenceSourceTypes)
export type EvidenceSourceType = z.infer<typeof EvidenceSourceTypeSchema>
