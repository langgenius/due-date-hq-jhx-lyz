import type {
  WorkboardDueFilter,
  WorkboardOwnerFilter,
  WorkboardReadiness,
  WorkboardSort,
} from './shared'
import type { ObligationInstanceRow } from './obligations'
import type { SmartPriorityBreakdown } from './priority'

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
  smartPriority: SmartPriorityBreakdown
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

export type WorkboardDensity = 'comfortable' | 'compact'

export interface WorkboardSavedViewRow {
  id: string
  firmId: string
  createdByUserId: string
  name: string
  queryJson: unknown
  columnVisibilityJson: unknown
  density: WorkboardDensity
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
}

export interface WorkboardSavedViewCreateInput {
  name: string
  createdByUserId: string
  queryJson: unknown
  columnVisibilityJson: unknown
  density: WorkboardDensity
  isPinned: boolean
}

export interface WorkboardSavedViewUpdateInput {
  id: string
  name?: string
  queryJson?: unknown
  columnVisibilityJson?: unknown
  density?: WorkboardDensity
  isPinned?: boolean
}

export interface WorkboardRepo {
  readonly firmId: string
  list(input?: WorkboardListInput): Promise<WorkboardListResult>
  listByIds(ids: string[], input?: { asOfDate?: string }): Promise<WorkboardListRow[]>
  facets(): Promise<WorkboardFacetsOutput>
  listSavedViews(): Promise<WorkboardSavedViewRow[]>
  createSavedView(input: WorkboardSavedViewCreateInput): Promise<WorkboardSavedViewRow>
  updateSavedView(input: WorkboardSavedViewUpdateInput): Promise<WorkboardSavedViewRow>
  deleteSavedView(id: string): Promise<void>
}
