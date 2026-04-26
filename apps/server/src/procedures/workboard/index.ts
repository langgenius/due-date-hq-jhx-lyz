import type { WorkboardRow } from '@duedatehq/contracts'
import { requireTenant } from '../_context'
import { os } from '../_root'

/**
 * workboard.* — read-only firm-wide obligation queue.
 *
 * Mutations (status / due date) live in `obligationsContract` so each
 * entity has exactly one canonical write surface.
 */

interface RawRow {
  id: string
  firmId: string
  clientId: string
  taxType: string
  taxYear: number | null
  baseDueDate: Date
  currentDueDate: Date
  status: WorkboardRow['status']
  migrationBatchId: string | null
  createdAt: Date
  updatedAt: Date
  clientName: string
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function toRow(row: RawRow): WorkboardRow {
  return {
    id: row.id,
    firmId: row.firmId,
    clientId: row.clientId,
    taxType: row.taxType,
    taxYear: row.taxYear,
    baseDueDate: toIsoDate(row.baseDueDate),
    currentDueDate: toIsoDate(row.currentDueDate),
    status: row.status,
    migrationBatchId: row.migrationBatchId,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    clientName: row.clientName,
  }
}

const list = os.workboard.list.handler(async ({ input, context }) => {
  const { scoped } = requireTenant(context)

  const repoInput: {
    status?: WorkboardRow['status'][]
    search?: string
    sort?: 'due_asc' | 'due_desc' | 'updated_desc'
    cursor?: string | null
    limit?: number
  } = {}
  if (input.status !== undefined) repoInput.status = input.status
  if (input.search !== undefined) repoInput.search = input.search
  if (input.sort !== undefined) repoInput.sort = input.sort
  if (input.cursor !== undefined) repoInput.cursor = input.cursor
  if (input.limit !== undefined) repoInput.limit = input.limit

  const result = await scoped.workboard.list(repoInput)

  return {
    rows: result.rows.map(toRow),
    nextCursor: result.nextCursor,
  }
})

export const workboardHandlers = { list }
