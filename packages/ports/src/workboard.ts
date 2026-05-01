import type {
  WorkboardDueFilter,
  WorkboardOwnerFilter,
  WorkboardReadiness,
  WorkboardSort,
} from './shared'
import type { ObligationInstanceRow } from './obligations'

export interface WorkboardListInput {
  status?: ObligationInstanceRow['status'][]
  search?: string
  clientIds?: string[]
  states?: string[]
  counties?: string[]
  taxTypes?: string[]
  assigneeName?: string
  assigneeNames?: string[]
  owner?: WorkboardOwnerFilter
  due?: WorkboardDueFilter
  dueWithinDays?: number
  exposureStatus?: ObligationInstanceRow['exposureStatus']
  readiness?: WorkboardReadiness[]
  minExposureCents?: number
  maxExposureCents?: number
  minDaysUntilDue?: number
  maxDaysUntilDue?: number
  needsEvidence?: boolean
  asOfDate?: string
  sort?: WorkboardSort
  cursor?: string | null
  limit?: number
}

export interface WorkboardListRow extends ObligationInstanceRow {
  clientName: string
  clientState: string | null
  clientCounty: string | null
  assigneeName: string | null
  readiness: WorkboardReadiness
  daysUntilDue: number
  evidenceCount: number
}

export interface WorkboardListResult {
  rows: WorkboardListRow[]
  nextCursor: string | null
}

export interface WorkboardFacetOption {
  value: string
  label: string
  count: number
}

export interface WorkboardClientFacetOption extends WorkboardFacetOption {
  state: string | null
  county: string | null
}

export interface WorkboardCountyFacetOption extends WorkboardFacetOption {
  state: string | null
}

export interface WorkboardFacetsOutput {
  clients: WorkboardClientFacetOption[]
  states: WorkboardFacetOption[]
  counties: WorkboardCountyFacetOption[]
  taxTypes: WorkboardFacetOption[]
  assigneeNames: WorkboardFacetOption[]
}

export interface WorkboardRepo {
  readonly firmId: string
  list(input?: WorkboardListInput): Promise<WorkboardListResult>
  facets(): Promise<WorkboardFacetsOutput>
}
