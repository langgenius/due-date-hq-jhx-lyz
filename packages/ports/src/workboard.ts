import type { WorkboardDueFilter, WorkboardOwnerFilter, WorkboardSort } from './shared'
import type { ObligationInstanceRow } from './obligations'

export interface WorkboardListInput {
  status?: ObligationInstanceRow['status'][]
  search?: string
  assigneeName?: string
  owner?: WorkboardOwnerFilter
  due?: WorkboardDueFilter
  dueWithinDays?: number
  asOfDate?: string
  sort?: WorkboardSort
  cursor?: string | null
  limit?: number
}

export interface WorkboardListRow extends ObligationInstanceRow {
  clientName: string
  assigneeName: string | null
}

export interface WorkboardListResult {
  rows: WorkboardListRow[]
  nextCursor: string | null
}

export interface WorkboardRepo {
  readonly firmId: string
  list(input?: WorkboardListInput): Promise<WorkboardListResult>
}
