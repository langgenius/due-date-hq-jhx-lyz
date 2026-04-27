import * as z from 'zod'
import { EntityTypeSchema, StateCodeSchema } from './enums'
import { EntityIdSchema, TenantIdSchema } from './ids'

export const ClientSchema = z.object({
  id: EntityIdSchema,
  firmId: TenantIdSchema,
  name: z.string().min(1),
  entityType: EntityTypeSchema,
  state: StateCodeSchema,
  ein: z.string().nullable(),
  email: z.email().nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type Client = z.infer<typeof ClientSchema>
