import { oc } from '@orpc/contract'
import { z } from 'zod'
import { ObligationStatusSchema } from './shared/enums'

export const ObligationInstancePublicSchema = z.object({
  id: z.string().uuid(),
  firmId: z.string().uuid(),
  clientId: z.string().uuid(),
  taxType: z.string().min(1),
  taxYear: z.number().int().min(1900).max(2100).nullable(),
  baseDueDate: z.string().date(),
  currentDueDate: z.string().date(),
  status: ObligationStatusSchema,
  migrationBatchId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const ObligationCreateInputSchema = z.object({
  clientId: z.string().uuid(),
  taxType: z.string().min(1),
  taxYear: z.number().int().min(1900).max(2100).nullable().optional(),
  baseDueDate: z.string().date(),
  currentDueDate: z.string().date().optional(),
  status: ObligationStatusSchema.optional(),
  migrationBatchId: z.string().uuid().nullable().optional(),
})

export const DueDateUpdateInputSchema = z.object({
  id: z.string().uuid(),
  currentDueDate: z.string().date(),
})

export const obligationsContract = oc.router({
  createBatch: oc
    .input(z.object({ obligations: z.array(ObligationCreateInputSchema).min(1).max(1000) }))
    .output(z.object({ obligations: z.array(ObligationInstancePublicSchema) })),
  updateDueDate: oc.input(DueDateUpdateInputSchema).output(ObligationInstancePublicSchema),
  listByClient: oc
    .input(z.object({ clientId: z.string().uuid() }))
    .output(z.array(ObligationInstancePublicSchema)),
})

export type ObligationInstancePublic = z.infer<typeof ObligationInstancePublicSchema>
export type ObligationCreateInput = z.infer<typeof ObligationCreateInputSchema>
export type DueDateUpdateInput = z.infer<typeof DueDateUpdateInputSchema>
export type ObligationsContract = typeof obligationsContract
