import { oc } from '@orpc/contract'
import * as z from 'zod'
import { EntityTypeSchema, StateCodeSchema } from './shared/enums'
import { EntityIdSchema, TenantIdSchema } from './shared/ids'

export const ClientIdentitySchema = z.object({
  id: EntityIdSchema,
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
  email: z.email().nullable().optional(),
  notes: z.string().max(5000).nullable().optional(),
  assigneeName: z.string().max(200).nullable().optional(),
  estimatedTaxLiabilityCents: z.number().int().positive().nullable().optional(),
  estimatedTaxLiabilitySource: z.enum(['manual', 'imported', 'demo_seed']).nullable().optional(),
  equityOwnerCount: z.number().int().positive().nullable().optional(),
  migrationBatchId: EntityIdSchema.nullable().optional(),
})

export const ClientPublicSchema = ClientIdentitySchema.extend({
  firmId: TenantIdSchema,
  email: z.email().nullable(),
  notes: z.string().nullable(),
  assigneeName: z.string().nullable(),
  estimatedTaxLiabilityCents: z.number().int().positive().nullable(),
  estimatedTaxLiabilitySource: z.enum(['manual', 'imported', 'demo_seed']).nullable(),
  equityOwnerCount: z.number().int().positive().nullable(),
  migrationBatchId: EntityIdSchema.nullable(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(),
})

export const ClientPenaltyInputsUpdateSchema = z.object({
  id: EntityIdSchema,
  estimatedTaxLiabilityCents: z.number().int().positive().nullable().optional(),
  equityOwnerCount: z.number().int().positive().nullable().optional(),
  reason: z.string().max(280).optional(),
})

export const ClientPenaltyInputsUpdateOutputSchema = z.object({
  client: ClientPublicSchema,
  recalculatedObligationCount: z.number().int().min(0),
})

export const clientsContract = oc.router({
  create: oc.input(ClientCreateInputSchema).output(ClientPublicSchema),
  createBatch: oc
    .input(z.object({ clients: z.array(ClientCreateInputSchema).min(1).max(500) }))
    .output(z.object({ clients: z.array(ClientPublicSchema) })),
  get: oc.input(z.object({ id: EntityIdSchema })).output(ClientPublicSchema.nullable()),
  listByFirm: oc
    .input(z.object({ limit: z.number().int().min(1).max(500).optional() }).optional())
    .output(z.array(ClientPublicSchema)),
  updatePenaltyInputs: oc
    .input(ClientPenaltyInputsUpdateSchema)
    .output(ClientPenaltyInputsUpdateOutputSchema),
})

export type ClientIdentity = z.infer<typeof ClientIdentitySchema>
export type ClientCreateInput = z.infer<typeof ClientCreateInputSchema>
export type ClientPublic = z.infer<typeof ClientPublicSchema>
export type ClientPenaltyInputsUpdateInput = z.infer<typeof ClientPenaltyInputsUpdateSchema>
export type ClientPenaltyInputsUpdateOutput = z.infer<typeof ClientPenaltyInputsUpdateOutputSchema>
export type ClientsContract = typeof clientsContract
