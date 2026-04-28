import { oc } from '@orpc/contract'
import * as z from 'zod'
import { TenantIdSchema } from './shared/ids'

export const FirmPlanSchema = z.enum(['solo', 'firm', 'pro'])
export const FirmStatusSchema = z.enum(['active', 'suspended', 'deleted'])
export const FirmRoleSchema = z.enum(['owner', 'manager', 'preparer', 'coordinator'])

export const FirmPublicSchema = z.object({
  id: TenantIdSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  plan: FirmPlanSchema,
  seatLimit: z.number().int().min(1),
  timezone: z.string().min(1),
  status: FirmStatusSchema,
  role: FirmRoleSchema,
  ownerUserId: z.string().min(1),
  isCurrent: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  deletedAt: z.iso.datetime().nullable(),
})

export const FirmCreateInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  timezone: z.string().trim().min(1).max(80).default('America/New_York'),
})

export const FirmUpdateInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  timezone: z.string().trim().min(1).max(80),
})

export const firmsContract = oc.router({
  listMine: oc.input(z.undefined()).output(z.array(FirmPublicSchema)),
  getCurrent: oc.input(z.undefined()).output(FirmPublicSchema.nullable()),
  create: oc.input(FirmCreateInputSchema).output(FirmPublicSchema),
  switchActive: oc.input(z.object({ firmId: TenantIdSchema })).output(FirmPublicSchema),
  updateCurrent: oc.input(FirmUpdateInputSchema).output(FirmPublicSchema),
  softDeleteCurrent: oc
    .input(z.undefined())
    .output(z.object({ nextFirmId: TenantIdSchema.nullable() })),
})

export type FirmCreateInput = z.infer<typeof FirmCreateInputSchema>
export type FirmPlan = z.infer<typeof FirmPlanSchema>
export type FirmPublic = z.infer<typeof FirmPublicSchema>
export type FirmRole = z.infer<typeof FirmRoleSchema>
export type FirmStatus = z.infer<typeof FirmStatusSchema>
export type FirmUpdateInput = z.infer<typeof FirmUpdateInputSchema>
export type FirmsContract = typeof firmsContract
