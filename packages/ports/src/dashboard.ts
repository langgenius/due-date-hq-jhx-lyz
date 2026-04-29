import type {
  DashboardBriefScope,
  DashboardBriefStatus,
  DashboardSeverity,
  ObligationStatus,
} from './shared'

export interface DashboardLoadInput {
  asOfDate: string
  windowDays?: number
  topLimit?: number
  briefScope?: DashboardBriefScope
  briefUserId?: string | null
}

export interface DashboardEvidenceRow {
  id: string
  obligationInstanceId: string | null
  aiOutputId: string | null
  sourceType: string
  sourceId: string | null
  sourceUrl: string | null
  verbatimQuote: string | null
  rawValue: string | null
  normalizedValue: string | null
  confidence: number | null
  model: string | null
  appliedAt: Date
}

export interface DashboardTopRow {
  obligationId: string
  clientId: string
  clientName: string
  taxType: string
  currentDueDate: Date
  status: ObligationStatus
  severity: DashboardSeverity
  evidenceCount: number
  primaryEvidence: DashboardEvidenceRow | null
}

export interface DashboardLoadResult {
  asOfDate: string
  windowDays: number
  summary: {
    openObligationCount: number
    dueThisWeekCount: number
    needsReviewCount: number
    evidenceGapCount: number
  }
  topRows: DashboardTopRow[]
  brief: DashboardBriefRow | null
}

export interface DashboardBriefRow {
  id: string
  firmId: string
  userId: string | null
  scope: DashboardBriefScope
  asOfDate: string
  status: DashboardBriefStatus
  inputHash: string
  aiOutputId: string | null
  summaryText: string | null
  topObligationIds: string[]
  citations: unknown
  reason: string
  errorCode: string | null
  generatedAt: Date | null
  expiresAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface DashboardBriefCreatePendingInput {
  id?: string
  scope: DashboardBriefScope
  userId?: string | null
  asOfDate: string
  inputHash: string
  reason: string
  now?: Date
}

export interface DashboardBriefReadyInput {
  aiOutputId?: string | null
  summaryText: string
  topObligationIds: string[]
  citations?: unknown
  generatedAt: Date
  expiresAt: Date
}

export interface DashboardBriefFailedInput {
  aiOutputId?: string | null
  errorCode: string
  generatedAt: Date
  expiresAt: Date
}

export interface DashboardRepo {
  readonly firmId: string
  load(input: DashboardLoadInput): Promise<DashboardLoadResult>
  findLatestBrief(input: {
    scope: DashboardBriefScope
    asOfDate: string
    userId?: string | null
    now?: Date
  }): Promise<DashboardBriefRow | null>
  findBriefByHash(input: {
    scope: DashboardBriefScope
    asOfDate: string
    inputHash: string
    userId?: string | null
    statuses?: DashboardBriefStatus[]
    now?: Date
  }): Promise<DashboardBriefRow | null>
  createBriefPending(input: DashboardBriefCreatePendingInput): Promise<DashboardBriefRow>
  markBriefReady(id: string, input: DashboardBriefReadyInput): Promise<DashboardBriefRow>
  markBriefFailed(id: string, input: DashboardBriefFailedInput): Promise<DashboardBriefRow>
}
