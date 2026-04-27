import * as z from 'zod'

// Entity type (PRD §6A · Default Matrix keys).
export const EntityTypeSchema = z.enum([
  'llc',
  's_corp',
  'partnership',
  'c_corp',
  'sole_prop',
  'trust',
  'individual',
  'other',
])
export type EntityType = z.infer<typeof EntityTypeSchema>

// US state code whitelist lives in packages/core/default-matrix.
export const StateCodeSchema = z.string().regex(/^[A-Z]{2}$/, {
  error: 'Expected 2-letter state code',
})
export type StateCode = z.infer<typeof StateCodeSchema>

// Obligation status (PRD §5.2).
export const ObligationStatusSchema = z.enum([
  'pending',
  'in_progress',
  'done',
  'waiting_on_client',
  'review',
  'not_applicable',
])
export type ObligationStatus = z.infer<typeof ObligationStatusSchema>
