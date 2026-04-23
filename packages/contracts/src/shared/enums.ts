import { z } from 'zod'

// Entity type (PRD §6A · Default Matrix keys).
export const EntityTypeSchema = z.enum([
  'individual',
  'sole_prop',
  'llc',
  's_corp',
  'c_corp',
  'partnership',
  'trust',
])
export type EntityType = z.infer<typeof EntityTypeSchema>

// US state code whitelist lives in packages/core/default-matrix.
export const StateCodeSchema = z.string().regex(/^[A-Z]{2}$/, 'Expected 2-letter state code')
export type StateCode = z.infer<typeof StateCodeSchema>

// Obligation status (PRD §5.2).
export const ObligationStatusSchema = z.enum(['open', 'in_progress', 'filed', 'extended', 'waived'])
export type ObligationStatus = z.infer<typeof ObligationStatusSchema>
