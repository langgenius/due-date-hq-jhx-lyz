import type {
  ExposureStatus,
  ObligationExtensionDecision,
  ObligationReadiness,
  ObligationStatus,
} from './shared'

export interface PenaltyBreakdownItem {
  key: string
  label: string
  amountCents: number
  formula: string
  inputs?: Record<string, string | number | boolean | null>
  sourceRefs?: PenaltySourceRef[]
}

export interface PenaltySourceRef {
  label: string
  url: string
  sourceExcerpt: string
  effectiveDate: string
  lastReviewedDate: string
}

export interface ObligationInstanceRow {
  id: string
  firmId: string
  clientId: string
  taxType: string
  taxYear: number | null
  baseDueDate: Date
  currentDueDate: Date
  status: ObligationStatus
  readiness: ObligationReadiness
  extensionDecision: ObligationExtensionDecision
  extensionMemo: string | null
  extensionSource: string | null
  extensionExpectedDueDate: Date | null
  extensionDecidedAt: Date | null
  extensionDecidedByUserId: string | null
  migrationBatchId: string | null
  estimatedTaxDueCents: number | null
  estimatedExposureCents: number | null
  exposureStatus: ExposureStatus
  penaltyFactsJson: unknown
  penaltyFactsVersion: string | null
  penaltyBreakdownJson: unknown
  penaltyFormulaVersion: string | null
  missingPenaltyFactsJson: unknown
  penaltySourceRefsJson: unknown
  penaltyFormulaLabel: string | null
  exposureCalculatedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

export interface ObligationCreateInput {
  id?: string
  clientId: string
  taxType: string
  taxYear?: number | null
  baseDueDate: Date
  currentDueDate?: Date
  status?: ObligationStatus
  readiness?: ObligationReadiness
  migrationBatchId?: string | null
  estimatedTaxDueCents?: number | null
  estimatedExposureCents?: number | null
  exposureStatus?: ExposureStatus
  penaltyFactsJson?: unknown
  penaltyFactsVersion?: string | null
  penaltyBreakdownJson?: unknown
  penaltyFormulaVersion?: string | null
  missingPenaltyFactsJson?: unknown
  penaltySourceRefsJson?: unknown
  penaltyFormulaLabel?: string | null
  exposureCalculatedAt?: Date | null
}

export interface ObligationsRepo {
  readonly firmId: string
  createBatch(inputs: ObligationCreateInput[]): Promise<{ ids: string[] }>
  findById(id: string): Promise<ObligationInstanceRow | undefined>
  findManyByIds(ids: string[]): Promise<ObligationInstanceRow[]>
  listByClient(clientId: string): Promise<ObligationInstanceRow[]>
  listByBatch(batchId: string): Promise<ObligationInstanceRow[]>
  updateDueDate(id: string, newDate: Date): Promise<void>
  updateExposure(
    id: string,
    patch: {
      estimatedTaxDueCents: number | null
      estimatedExposureCents: number | null
      exposureStatus: ExposureStatus
      penaltyBreakdownJson: unknown
      penaltyFormulaVersion: string | null
      missingPenaltyFactsJson: unknown
      penaltySourceRefsJson: unknown
      penaltyFormulaLabel: string | null
      exposureCalculatedAt: Date | null
      penaltyFactsJson?: unknown
      penaltyFactsVersion?: string | null
    },
  ): Promise<void>
  updateStatus(id: string, status: ObligationStatus, readiness?: ObligationReadiness): Promise<void>
  updateExtensionDecision(
    id: string,
    patch: {
      decision: Exclude<ObligationExtensionDecision, 'not_considered'>
      memo: string | null
      source: string | null
      expectedExtendedDueDate: Date | null
      decidedAt: Date
      decidedByUserId: string
      status?: ObligationStatus
      readiness?: ObligationReadiness
    },
  ): Promise<void>
  updateStatusMany(
    ids: string[],
    status: ObligationStatus,
    readiness?: ObligationReadiness,
  ): Promise<void>
  updateReadiness(id: string, readiness: ObligationReadiness): Promise<void>
  updateReadinessMany(ids: string[], readiness: ObligationReadiness): Promise<void>
  deleteByBatch(batchId: string): Promise<number>
}
