import { oc } from '@orpc/contract'
import * as z from 'zod'
import { AuditEventPublicSchema } from './audit'
import { EvidencePublicSchema } from './evidence'
import { ObligationInstancePublicSchema } from './obligations'
import { SmartPriorityBreakdownSchema } from './priority'
import { ClientReadinessRequestPublicSchema } from './readiness'
import { ExtensionPolicySchema, RuleEvidenceSchema } from './rules'
import {
  ExposureStatusSchema,
  ObligationReadinessSchema,
  ObligationStatusSchema,
  StateCodeSchema,
} from './shared/enums'
import { EntityIdSchema, TenantIdSchema } from './shared/ids'

/**
 * Obligations is the firm-wide obligation queue. Read-only here; mutations
 * live in `obligationsContract` (createBatch, updateDueDate, updateStatus)
 * to keep one canonical write path per entity.
 *
 * Cursor pagination follows D1 100-bound-param budget — we encode the active
 * sort value plus stable row identity so the next page query does not need a
 * wide parameter payload.
 */

export const WorkboardSortSchema = z.enum([
  'smart_priority',
  'due_asc',
  'due_desc',
  'exposure_desc',
  'exposure_asc',
  'updated_desc',
])
export type WorkboardSort = z.infer<typeof WorkboardSortSchema>
export const WorkboardDensitySchema = z.enum(['comfortable', 'compact'])
export type WorkboardDensity = z.infer<typeof WorkboardDensitySchema>
export const WorkboardOwnerFilterSchema = z.enum(['unassigned'])
export type WorkboardOwnerFilter = z.infer<typeof WorkboardOwnerFilterSchema>
export const WorkboardDueFilterSchema = z.enum(['overdue'])
export type WorkboardDueFilter = z.infer<typeof WorkboardDueFilterSchema>
export const WorkboardReadinessSchema = ObligationReadinessSchema
export type WorkboardReadiness = z.infer<typeof WorkboardReadinessSchema>
export const WORKBOARD_SEARCH_MAX_LENGTH = 64
export const WORKBOARD_FILTER_MAX_SELECTIONS = 16
export const WORKBOARD_FILTER_VALUE_MAX_LENGTH = 120

const WorkboardFilterValueSchema = z.string().trim().min(1).max(WORKBOARD_FILTER_VALUE_MAX_LENGTH)

export const WorkboardListInputSchema = z.object({
  status: z.array(ObligationStatusSchema).max(8).optional(),
  search: z.string().max(WORKBOARD_SEARCH_MAX_LENGTH).optional(),
  obligationIds: z.array(EntityIdSchema).max(WORKBOARD_FILTER_MAX_SELECTIONS).optional(),
  clientIds: z.array(EntityIdSchema).max(WORKBOARD_FILTER_MAX_SELECTIONS).optional(),
  states: z.array(StateCodeSchema).max(WORKBOARD_FILTER_MAX_SELECTIONS).optional(),
  counties: z.array(WorkboardFilterValueSchema).max(WORKBOARD_FILTER_MAX_SELECTIONS).optional(),
  taxTypes: z.array(WorkboardFilterValueSchema).max(WORKBOARD_FILTER_MAX_SELECTIONS).optional(),
  assigneeName: z.string().trim().min(1).max(120).optional(),
  assigneeNames: z
    .array(WorkboardFilterValueSchema)
    .max(WORKBOARD_FILTER_MAX_SELECTIONS)
    .optional(),
  owner: WorkboardOwnerFilterSchema.optional(),
  due: WorkboardDueFilterSchema.optional(),
  dueWithinDays: z.number().int().min(1).max(30).optional(),
  exposureStatus: ExposureStatusSchema.optional(),
  readiness: z.array(WorkboardReadinessSchema).max(3).optional(),
  minExposureCents: z.number().int().min(0).optional(),
  maxExposureCents: z.number().int().min(0).optional(),
  minDaysUntilDue: z.number().int().min(-3650).max(3650).optional(),
  maxDaysUntilDue: z.number().int().min(-3650).max(3650).optional(),
  needsEvidence: z.boolean().optional(),
  asOfDate: z.iso.date().optional(),
  sort: WorkboardSortSchema.default('smart_priority').optional(),
  cursor: z.string().nullable().optional(),
  limit: z.number().int().min(1).max(100).default(50).optional(),
})
export type WorkboardListInput = z.infer<typeof WorkboardListInputSchema>

export const WorkboardRowSchema = ObligationInstancePublicSchema.extend({
  clientName: z.string().min(1),
  clientState: StateCodeSchema.nullable(),
  clientCounty: WorkboardFilterValueSchema.nullable(),
  assigneeName: z.string().min(1).nullable(),
  readiness: WorkboardReadinessSchema,
  daysUntilDue: z.number().int(),
  evidenceCount: z.number().int().min(0),
  smartPriority: SmartPriorityBreakdownSchema,
})
export type WorkboardRow = z.infer<typeof WorkboardRowSchema>

export const WorkboardListOutputSchema = z.object({
  rows: z.array(WorkboardRowSchema),
  nextCursor: z.string().nullable(),
})
export type WorkboardListOutput = z.infer<typeof WorkboardListOutputSchema>

export const WorkboardFacetOptionSchema = z.object({
  value: WorkboardFilterValueSchema,
  label: z.string().trim().min(1).max(160),
  count: z.number().int().min(0),
})
export type WorkboardFacetOption = z.infer<typeof WorkboardFacetOptionSchema>

export const WorkboardClientFacetOptionSchema = WorkboardFacetOptionSchema.extend({
  value: EntityIdSchema,
  state: StateCodeSchema.nullable(),
  county: WorkboardFilterValueSchema.nullable(),
})
export type WorkboardClientFacetOption = z.infer<typeof WorkboardClientFacetOptionSchema>

export const WorkboardCountyFacetOptionSchema = WorkboardFacetOptionSchema.extend({
  state: StateCodeSchema.nullable(),
})
export type WorkboardCountyFacetOption = z.infer<typeof WorkboardCountyFacetOptionSchema>

export const WorkboardFacetsOutputSchema = z.object({
  clients: z.array(WorkboardClientFacetOptionSchema),
  states: z.array(WorkboardFacetOptionSchema),
  counties: z.array(WorkboardCountyFacetOptionSchema),
  taxTypes: z.array(WorkboardFacetOptionSchema),
  assigneeNames: z.array(WorkboardFacetOptionSchema),
})
export type WorkboardFacetsOutput = z.infer<typeof WorkboardFacetsOutputSchema>

export const WorkboardSavedViewQuerySchema = z.record(z.string(), z.unknown())
export type WorkboardSavedViewQuery = z.infer<typeof WorkboardSavedViewQuerySchema>

export const WorkboardColumnVisibilitySchema = z.record(z.string(), z.boolean())
export type WorkboardColumnVisibility = z.infer<typeof WorkboardColumnVisibilitySchema>

export const WorkboardSavedViewSchema = z.object({
  id: EntityIdSchema,
  firmId: TenantIdSchema,
  createdByUserId: z.string().min(1),
  name: z.string().trim().min(1).max(80),
  query: WorkboardSavedViewQuerySchema,
  columnVisibility: WorkboardColumnVisibilitySchema,
  density: WorkboardDensitySchema,
  isPinned: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
})
export type WorkboardSavedView = z.infer<typeof WorkboardSavedViewSchema>

export const WorkboardCreateSavedViewInputSchema = z.object({
  name: z.string().trim().min(1).max(80),
  query: WorkboardSavedViewQuerySchema,
  columnVisibility: WorkboardColumnVisibilitySchema.default({}).optional(),
  density: WorkboardDensitySchema.default('comfortable').optional(),
  isPinned: z.boolean().default(false).optional(),
})
export type WorkboardCreateSavedViewInput = z.infer<typeof WorkboardCreateSavedViewInputSchema>

export const WorkboardUpdateSavedViewInputSchema = z.object({
  id: EntityIdSchema,
  name: z.string().trim().min(1).max(80).optional(),
  query: WorkboardSavedViewQuerySchema.optional(),
  columnVisibility: WorkboardColumnVisibilitySchema.optional(),
  density: WorkboardDensitySchema.optional(),
  isPinned: z.boolean().optional(),
})
export type WorkboardUpdateSavedViewInput = z.infer<typeof WorkboardUpdateSavedViewInputSchema>

export const WorkboardDeleteSavedViewInputSchema = z.object({ id: EntityIdSchema })
export type WorkboardDeleteSavedViewInput = z.infer<typeof WorkboardDeleteSavedViewInputSchema>

export const WorkboardExportSelectedInputSchema = z.object({
  ids: z.array(EntityIdSchema).min(1).max(100),
  format: z.enum(['csv', 'pdf_zip']),
})
export type WorkboardExportSelectedInput = z.infer<typeof WorkboardExportSelectedInputSchema>

export const WorkboardExportSelectedOutputSchema = z.object({
  fileName: z.string().min(1),
  contentType: z.string().min(1),
  contentBase64: z.string().min(1),
  auditId: EntityIdSchema,
})
export type WorkboardExportSelectedOutput = z.infer<typeof WorkboardExportSelectedOutputSchema>

export const WorkboardDetailTabSchema = z.enum([
  'readiness',
  'extension',
  'risk',
  'evidence',
  'audit',
])
export type WorkboardDetailTab = z.infer<typeof WorkboardDetailTabSchema>

export const WorkboardMatchedRuleSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  defaultTip: z.string().min(1),
  extensionPolicy: ExtensionPolicySchema,
  evidence: z.array(RuleEvidenceSchema),
})
export type WorkboardMatchedRule = z.infer<typeof WorkboardMatchedRuleSchema>

export const WorkboardDetailInputSchema = z.object({
  obligationId: EntityIdSchema,
  asOfDate: z.iso.date().optional(),
})
export type WorkboardDetailInput = z.infer<typeof WorkboardDetailInputSchema>

export const WorkboardDetailSchema = z.object({
  row: WorkboardRowSchema,
  matchedRule: WorkboardMatchedRuleSchema.nullable(),
  evidence: z.array(EvidencePublicSchema),
  auditEvents: z.array(AuditEventPublicSchema),
  readinessRequests: z.array(ClientReadinessRequestPublicSchema),
})
export type WorkboardDetail = z.infer<typeof WorkboardDetailSchema>

export const workboardContract = oc.router({
  list: oc.input(WorkboardListInputSchema).output(WorkboardListOutputSchema),
  getDetail: oc.input(WorkboardDetailInputSchema).output(WorkboardDetailSchema),
  facets: oc.input(z.undefined()).output(WorkboardFacetsOutputSchema),
  listSavedViews: oc.input(z.undefined()).output(z.array(WorkboardSavedViewSchema)),
  createSavedView: oc.input(WorkboardCreateSavedViewInputSchema).output(WorkboardSavedViewSchema),
  updateSavedView: oc.input(WorkboardUpdateSavedViewInputSchema).output(WorkboardSavedViewSchema),
  deleteSavedView: oc
    .input(WorkboardDeleteSavedViewInputSchema)
    .output(z.object({ id: EntityIdSchema })),
  exportSelected: oc
    .input(WorkboardExportSelectedInputSchema)
    .output(WorkboardExportSelectedOutputSchema),
})
export type WorkboardContract = typeof workboardContract
