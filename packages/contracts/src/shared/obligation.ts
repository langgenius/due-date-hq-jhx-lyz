import { z } from 'zod'
import { ObligationStatusSchema } from './enums'

export const ObligationSchema = z.object({
  id: z.string().uuid(),
  firmId: z.string().uuid(),
  clientId: z.string().uuid(),
  ruleId: z.string(),
  baseDueDate: z.string().date(),
  currentDueDate: z.string().date(),
  status: ObligationStatusSchema,
  assigneeId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})
export type Obligation = z.infer<typeof ObligationSchema>
