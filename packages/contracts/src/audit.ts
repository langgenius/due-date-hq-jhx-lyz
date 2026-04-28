import { oc } from '@orpc/contract'
import * as z from 'zod'
import { TenantIdSchema } from './shared/ids'

export const AuditActionCategorySchema = z.enum([
  'client',
  'obligation',
  'migration',
  'rules',
  'auth',
  'team',
  'pulse',
  'export',
  'ai',
  'system',
])
export type AuditActionCategory = z.infer<typeof AuditActionCategorySchema>

export const AuditRangeSchema = z.enum(['24h', '7d', '30d', 'all'])
export type AuditRange = z.infer<typeof AuditRangeSchema>

export const AUDIT_SEARCH_MAX_LENGTH = 80
export const AUDIT_FILTER_MAX_LENGTH = 128

export const AuditListInputSchema = z.object({
  search: z.string().max(AUDIT_SEARCH_MAX_LENGTH).optional(),
  category: AuditActionCategorySchema.optional(),
  action: z.string().min(1).max(AUDIT_FILTER_MAX_LENGTH).optional(),
  actorId: TenantIdSchema.optional(),
  entityType: z.string().min(1).max(AUDIT_FILTER_MAX_LENGTH).optional(),
  entityId: z.string().min(1).max(AUDIT_FILTER_MAX_LENGTH).optional(),
  range: AuditRangeSchema.default('24h').optional(),
  cursor: z.string().nullable().optional(),
  limit: z.number().int().min(1).max(100).default(50).optional(),
})
export type AuditListInput = z.infer<typeof AuditListInputSchema>

export const AuditEventPublicSchema = z.object({
  id: z.uuid(),
  firmId: TenantIdSchema,
  actorId: TenantIdSchema.nullable(),
  actorLabel: z.string().nullable(),
  entityType: z.string().min(1),
  entityId: z.string().min(1),
  action: z.string().min(1),
  beforeJson: z.unknown().nullable(),
  afterJson: z.unknown().nullable(),
  reason: z.string().nullable(),
  ipHash: z.string().nullable(),
  userAgentHash: z.string().nullable(),
  createdAt: z.iso.datetime(),
})
export type AuditEventPublic = z.infer<typeof AuditEventPublicSchema>

export const AuditListOutputSchema = z.object({
  events: z.array(AuditEventPublicSchema),
  nextCursor: z.string().nullable(),
})
export type AuditListOutput = z.infer<typeof AuditListOutputSchema>

export const auditContract = oc.router({
  list: oc.input(AuditListInputSchema).output(AuditListOutputSchema),
})
export type AuditContract = typeof auditContract
