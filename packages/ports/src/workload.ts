import type { WorkloadOwnerKind } from './shared'

export interface WorkloadLoadInput {
  asOfDate?: string
  windowDays?: number
}

export interface WorkloadSummary {
  open: number
  dueSoon: number
  overdue: number
  waiting: number
  review: number
  unassigned: number
}

export interface WorkloadOwnerRow {
  id: string
  ownerLabel: string
  assigneeName: string | null
  kind: WorkloadOwnerKind
  open: number
  dueSoon: number
  overdue: number
  waiting: number
  review: number
  loadScore: number
}

export interface WorkloadLoadResult {
  asOfDate: string
  windowDays: number
  summary: WorkloadSummary
  rows: WorkloadOwnerRow[]
}

export interface WorkloadRepo {
  readonly firmId: string
  load(input?: WorkloadLoadInput): Promise<WorkloadLoadResult>
}
