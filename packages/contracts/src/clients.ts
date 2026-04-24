import { oc } from '@orpc/contract'
import { z } from 'zod'
import { EntityTypeSchema, StateCodeSchema } from './shared/enums'

export const ClientIdentitySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  ein: z
    .string()
    .regex(/^\d{2}-\d{7}$/)
    .nullable(),
  state: StateCodeSchema.nullable(),
  county: z.string().nullable(),
  entityType: EntityTypeSchema,
})

export const ClientCreateInputSchema = z.object({
  name: z.string().min(1),
  ein: z
    .string()
    .regex(/^\d{2}-\d{7}$/)
    .nullable()
    .optional(),
  state: StateCodeSchema.nullable().optional(),
  county: z.string().nullable().optional(),
  entityType: EntityTypeSchema,
  email: z.string().email().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  assigneeName: z.string().max(200).nullable().optional(),
  migrationBatchId: z.string().uuid().nullable().optional(),
})

export const ClientPublicSchema = ClientIdentitySchema.extend({
  firmId: z.string().uuid(),
  email: z.string().email().nullable(),
  notes: z.string().nullable(),
  assigneeName: z.string().nullable(),
  migrationBatchId: z.string().uuid().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
})

export const clientsContract = oc.router({
  create: oc.input(ClientCreateInputSchema).output(ClientPublicSchema),
  createBatch: oc
    .input(z.object({ clients: z.array(ClientCreateInputSchema).min(1).max(500) }))
    .output(z.object({ clients: z.array(ClientPublicSchema) })),
  get: oc.input(z.object({ id: z.string().uuid() })).output(ClientPublicSchema.nullable()),
  listByFirm: oc
    .input(z.object({ limit: z.number().int().min(1).max(500).optional() }).optional())
    .output(z.array(ClientPublicSchema)),
})

export type ClientIdentity = z.infer<typeof ClientIdentitySchema>
export type ClientCreateInput = z.infer<typeof ClientCreateInputSchema>
export type ClientPublic = z.infer<typeof ClientPublicSchema>
export type ClientsContract = typeof clientsContract
