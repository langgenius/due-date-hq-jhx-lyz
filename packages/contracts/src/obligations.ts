import { oc } from '@orpc/contract'
import { z } from 'zod'
import { ObligationStatusSchema } from './shared/enums'
import { EntityIdSchema, TenantIdSchema } from './shared/ids'

export const ObligationInstancePublicSchema = z.object({
  id: EntityIdSchema,
  firmId: TenantIdSchema,
  clientId: EntityIdSchema,
  taxType: z.string().min(1),
  taxYear: z.number().int().min(1900).max(2100).nullable(),
  baseDueDate: z.string().date(),
  currentDueDate: z.string().date(),
  status: ObligationStatusSchema,
  migrationBatchId: EntityIdSchema.nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
})

export const ObligationCreateInputSchema = z.object({
  clientId: EntityIdSchema,
  taxType: z.string().min(1),
  taxYear: z.number().int().min(1900).max(2100).nullable().optional(),
  baseDueDate: z.string().date(),
  currentDueDate: z.string().date().optional(),
  status: ObligationStatusSchema.optional(),
  migrationBatchId: EntityIdSchema.nullable().optional(),
})

export const DueDateUpdateInputSchema = z.object({
  id: EntityIdSchema,
  currentDueDate: z.string().date(),
})

export const ObligationStatusUpdateInputSchema = z.object({
  id: EntityIdSchema,
  status: ObligationStatusSchema,
  reason: z.string().max(280).optional(),
})

export const ObligationStatusUpdateOutputSchema = z.object({
  obligation: ObligationInstancePublicSchema,
  auditId: EntityIdSchema,
})

export const obligationsContract = oc.router({
  createBatch: oc
    .input(z.object({ obligations: z.array(ObligationCreateInputSchema).min(1).max(1000) }))
    .output(z.object({ obligations: z.array(ObligationInstancePublicSchema) })),
  updateDueDate: oc.input(DueDateUpdateInputSchema).output(ObligationInstancePublicSchema),
  /**
   * Update one obligation's status. Handler must read `before`, write the
   * row, and append an `obligation.status.updated` audit row carrying both
   * `before` and `after` payloads. Returns the updated row + audit id so
   * the workboard UI can surface the audit reference inline.
   */
  updateStatus: oc
    .input(ObligationStatusUpdateInputSchema)
    .output(ObligationStatusUpdateOutputSchema),
  listByClient: oc
    .input(z.object({ clientId: EntityIdSchema }))
    .output(z.array(ObligationInstancePublicSchema)),
})

export type ObligationInstancePublic = z.infer<typeof ObligationInstancePublicSchema>
export type ObligationCreateInput = z.infer<typeof ObligationCreateInputSchema>
export type DueDateUpdateInput = z.infer<typeof DueDateUpdateInputSchema>
export type ObligationStatusUpdateInput = z.infer<typeof ObligationStatusUpdateInputSchema>
export type ObligationStatusUpdateOutput = z.infer<typeof ObligationStatusUpdateOutputSchema>
export type ObligationsContract = typeof obligationsContract
