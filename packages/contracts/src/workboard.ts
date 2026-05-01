import { oc } from '@orpc/contract'
import * as z from 'zod'
import { ObligationInstancePublicSchema } from './obligations'
import { ExposureStatusSchema, ObligationStatusSchema, StateCodeSchema } from './shared/enums'
import { EntityIdSchema } from './shared/ids'

/**
 * Workboard is the firm-wide obligation queue. Read-only here; mutations
 * live in `obligationsContract` (createBatch, updateDueDate, updateStatus)
 * to keep one canonical write path per entity.
 *
 * Cursor pagination follows D1 100-bound-param budget — we encode
 * `(currentDueDate, id)` so the next page query only needs 2 extra params.
 */

export const WorkboardSortSchema = z.enum(['due_asc', 'due_desc', 'updated_desc'])
export type WorkboardSort = z.infer<typeof WorkboardSortSchema>
export const WorkboardOwnerFilterSchema = z.enum(['unassigned'])
export type WorkboardOwnerFilter = z.infer<typeof WorkboardOwnerFilterSchema>
export const WorkboardDueFilterSchema = z.enum(['overdue'])
export type WorkboardDueFilter = z.infer<typeof WorkboardDueFilterSchema>
export const WorkboardReadinessSchema = z.enum(['ready', 'waiting', 'needs_review'])
export type WorkboardReadiness = z.infer<typeof WorkboardReadinessSchema>
export const WORKBOARD_SEARCH_MAX_LENGTH = 64
export const WORKBOARD_FILTER_MAX_SELECTIONS = 16
export const WORKBOARD_FILTER_VALUE_MAX_LENGTH = 120

const WorkboardFilterValueSchema = z.string().trim().min(1).max(WORKBOARD_FILTER_VALUE_MAX_LENGTH)

export const WorkboardListInputSchema = z.object({
  status: z.array(ObligationStatusSchema).max(6).optional(),
  search: z.string().max(WORKBOARD_SEARCH_MAX_LENGTH).optional(),
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
  sort: WorkboardSortSchema.default('due_asc').optional(),
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

export const workboardContract = oc.router({
  list: oc.input(WorkboardListInputSchema).output(WorkboardListOutputSchema),
  facets: oc.input(z.undefined()).output(WorkboardFacetsOutputSchema),
})
export type WorkboardContract = typeof workboardContract
