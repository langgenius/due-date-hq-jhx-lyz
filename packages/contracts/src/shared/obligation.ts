import * as z from 'zod'
import { ObligationStatusSchema } from './enums'
import { EntityIdSchema, TenantIdSchema } from './ids'

export const ObligationSchema = z.object({
  id: EntityIdSchema,
  firmId: TenantIdSchema,
  clientId: EntityIdSchema,
  ruleId: z.string(),
  baseDueDate: z.iso.date(),
  currentDueDate: z.iso.date(),
  status: ObligationStatusSchema,
  assigneeId: TenantIdSchema.nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type Obligation = z.infer<typeof ObligationSchema>
