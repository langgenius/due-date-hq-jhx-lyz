import { z } from 'zod'
import { ObligationStatusSchema } from './enums'
import { EntityIdSchema, TenantIdSchema } from './ids'

export const ObligationSchema = z.object({
  id: EntityIdSchema,
  firmId: TenantIdSchema,
  clientId: EntityIdSchema,
  ruleId: z.string(),
  baseDueDate: z.string().date(),
  currentDueDate: z.string().date(),
  status: ObligationStatusSchema,
  assigneeId: TenantIdSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Obligation = z.infer<typeof ObligationSchema>
