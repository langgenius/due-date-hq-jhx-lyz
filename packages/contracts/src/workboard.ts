import { oc } from '@orpc/contract'
import * as z from 'zod'
import { ObligationInstancePublicSchema } from './obligations'
import { ObligationStatusSchema } from './shared/enums'

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
export const WORKBOARD_SEARCH_MAX_LENGTH = 64

export const WorkboardListInputSchema = z.object({
  status: z.array(ObligationStatusSchema).max(6).optional(),
  search: z.string().max(WORKBOARD_SEARCH_MAX_LENGTH).optional(),
  assigneeName: z.string().trim().min(1).max(120).optional(),
  owner: WorkboardOwnerFilterSchema.optional(),
  due: WorkboardDueFilterSchema.optional(),
  dueWithinDays: z.number().int().min(1).max(30).optional(),
  asOfDate: z.iso.date().optional(),
  sort: WorkboardSortSchema.default('due_asc').optional(),
  cursor: z.string().nullable().optional(),
  limit: z.number().int().min(1).max(100).default(50).optional(),
})
export type WorkboardListInput = z.infer<typeof WorkboardListInputSchema>

export const WorkboardRowSchema = ObligationInstancePublicSchema.extend({
  clientName: z.string().min(1),
  assigneeName: z.string().min(1).nullable(),
})
export type WorkboardRow = z.infer<typeof WorkboardRowSchema>

export const WorkboardListOutputSchema = z.object({
  rows: z.array(WorkboardRowSchema),
  nextCursor: z.string().nullable(),
})
export type WorkboardListOutput = z.infer<typeof WorkboardListOutputSchema>

export const workboardContract = oc.router({
  list: oc.input(WorkboardListInputSchema).output(WorkboardListOutputSchema),
})
export type WorkboardContract = typeof workboardContract
