import { z } from 'zod'
import { EntityTypeSchema, StateCodeSchema } from './enums'

export const ClientSchema = z.object({
  id: z.string().uuid(),
  firmId: z.string().uuid(),
  name: z.string().min(1),
  entityType: EntityTypeSchema,
  state: StateCodeSchema,
  ein: z.string().nullable(),
  email: z.string().email().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Client = z.infer<typeof ClientSchema>
