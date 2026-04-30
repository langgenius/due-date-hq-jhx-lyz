import type { WorkboardDueFilter, WorkboardOwnerFilter, WorkboardSort } from './shared'
import type { ObligationInstanceRow } from './obligations'

export interface WorkboardListInput {
  status?: ObligationInstanceRow['status'][]
  search?: string
  assigneeName?: string
  owner?: WorkboardOwnerFilter
  due?: WorkboardDueFilter
  dueWithinDays?: number
  exposureStatus?: ObligationInstanceRow['exposureStatus']
  needsEvidence?: boolean
  asOfDate?: string
  sort?: WorkboardSort
  cursor?: string | null
  limit?: number
}

export interface WorkboardListRow extends ObligationInstanceRow {
  clientName: string
  assigneeName: string | null
  evidenceCount: number
}

export interface WorkboardListResult {
  rows: WorkboardListRow[]
  nextCursor: string | null
}

export interface WorkboardRepo {
  readonly firmId: string
  list(input?: WorkboardListInput): Promise<WorkboardListResult>
}
