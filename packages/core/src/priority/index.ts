export const SMART_PRIORITY_VERSION = 'smart-priority-v1'

export const SMART_PRIORITY_WEIGHTS = {
  exposure: 0.45,
  urgency: 0.25,
  importance: 0.15,
  history: 0.1,
  readiness: 0.05,
} as const

export type SmartPriorityFactorKey = keyof typeof SMART_PRIORITY_WEIGHTS

export type SmartPriorityStatus =
  | 'pending'
  | 'in_progress'
  | 'done'
  | 'extended'
  | 'paid'
  | 'waiting_on_client'
  | 'review'
  | 'not_applicable'

export type SmartPriorityExposureStatus = 'ready' | 'needs_input' | 'unsupported'

export interface SmartPriorityInput {
  obligationId: string
  currentDueDate: string | Date
  asOfDate: string
  status: SmartPriorityStatus
  estimatedExposureCents: number | null
  exposureStatus: SmartPriorityExposureStatus
  importanceWeight: number
  lateFilingCountLast12mo: number
  evidenceCount: number
}

export interface SmartPriorityFactor {
  key: SmartPriorityFactorKey
  label: string
  weight: number
  rawValue: string
  normalized: number
  contribution: number
  sourceLabel: string
}

export interface SmartPriorityBreakdown {
  version: typeof SMART_PRIORITY_VERSION
  score: number
  rank: number | null
  factors: SmartPriorityFactor[]
}

export interface SmartPriorityRanked<T> {
  row: T
  smartPriority: SmartPriorityBreakdown
}

const DAY_MS = 24 * 60 * 60 * 1000
const MAX_EXPOSURE_CENTS = 1_000_000
const MAX_HISTORY_COUNT = 5

function clamp(value: number, min = 0, max = 1): number {
  return Math.min(max, Math.max(min, value))
}

function roundScore(value: number): number {
  return Math.round(value * 10) / 10
}

function parseDateOnly(value: string | Date): Date {
  if (value instanceof Date) {
    return new Date(`${value.toISOString().slice(0, 10)}T00:00:00.000Z`)
  }
  return new Date(`${value}T00:00:00.000Z`)
}

export function smartPriorityDaysUntilDue(input: {
  currentDueDate: string | Date
  asOfDate: string
}): number {
  return Math.floor(
    (parseDateOnly(input.currentDueDate).getTime() - parseDateOnly(input.asOfDate).getTime()) /
      DAY_MS,
  )
}

function exposureFactor(input: SmartPriorityInput): SmartPriorityFactor {
  const cents =
    input.exposureStatus === 'ready' && input.estimatedExposureCents !== null
      ? Math.max(0, input.estimatedExposureCents)
      : 0
  const normalized = clamp(cents / MAX_EXPOSURE_CENTS)
  return {
    key: 'exposure',
    label: 'Dollar exposure',
    weight: SMART_PRIORITY_WEIGHTS.exposure,
    rawValue:
      input.exposureStatus === 'ready' ? `$${Math.round(cents / 100)}` : input.exposureStatus,
    normalized,
    contribution: roundScore(normalized * SMART_PRIORITY_WEIGHTS.exposure * 100),
    sourceLabel: 'Penalty Radar',
  }
}

function urgencyFactor(input: SmartPriorityInput): SmartPriorityFactor {
  const days = smartPriorityDaysUntilDue(input)
  const normalized = days <= 0 ? 1 : days >= 30 ? 0 : clamp((30 - days) / 30)
  return {
    key: 'urgency',
    label: 'Deadline urgency',
    weight: SMART_PRIORITY_WEIGHTS.urgency,
    rawValue: days < 0 ? `${Math.abs(days)} days late` : days === 0 ? 'today' : `${days} days`,
    normalized,
    contribution: roundScore(normalized * SMART_PRIORITY_WEIGHTS.urgency * 100),
    sourceLabel: 'Current due date',
  }
}

function importanceFactor(input: SmartPriorityInput): SmartPriorityFactor {
  const weight = Math.round(clamp(input.importanceWeight, 1, 3))
  const normalized = clamp((weight - 1) / 2)
  const label = weight === 3 ? 'high' : weight === 2 ? 'medium' : 'low'
  return {
    key: 'importance',
    label: 'Client importance',
    weight: SMART_PRIORITY_WEIGHTS.importance,
    rawValue: label,
    normalized,
    contribution: roundScore(normalized * SMART_PRIORITY_WEIGHTS.importance * 100),
    sourceLabel: 'Client risk profile',
  }
}

function historyFactor(input: SmartPriorityInput): SmartPriorityFactor {
  const count = Math.max(0, Math.floor(input.lateFilingCountLast12mo))
  const normalized = clamp(count / MAX_HISTORY_COUNT)
  return {
    key: 'history',
    label: 'Late filing history',
    weight: SMART_PRIORITY_WEIGHTS.history,
    rawValue: `${count}`,
    normalized,
    contribution: roundScore(normalized * SMART_PRIORITY_WEIGHTS.history * 100),
    sourceLabel: 'Client risk profile',
  }
}

function readinessFactor(input: SmartPriorityInput): SmartPriorityFactor {
  const blocked =
    input.status === 'waiting_on_client' ||
    input.status === 'review' ||
    input.exposureStatus === 'needs_input' ||
    input.evidenceCount === 0
  const normalized = blocked ? 1 : 0
  const rawValue =
    input.status === 'waiting_on_client'
      ? 'waiting on client'
      : input.status === 'review'
        ? 'needs review'
        : input.exposureStatus === 'needs_input'
          ? 'needs exposure input'
          : input.evidenceCount === 0
            ? 'needs evidence'
            : 'ready'
  return {
    key: 'readiness',
    label: 'Readiness pressure',
    weight: SMART_PRIORITY_WEIGHTS.readiness,
    rawValue,
    normalized,
    contribution: roundScore(normalized * SMART_PRIORITY_WEIGHTS.readiness * 100),
    sourceLabel: 'Workboard status',
  }
}

export function scoreSmartPriority(input: SmartPriorityInput): SmartPriorityBreakdown {
  const factors = [
    exposureFactor(input),
    urgencyFactor(input),
    importanceFactor(input),
    historyFactor(input),
    readinessFactor(input),
  ]
  return {
    version: SMART_PRIORITY_VERSION,
    score: roundScore(factors.reduce((sum, factor) => sum + factor.contribution, 0)),
    rank: null,
    factors,
  }
}

export function compareSmartPriority(
  a: Pick<SmartPriorityInput, 'obligationId' | 'currentDueDate'> & {
    smartPriority: Pick<SmartPriorityBreakdown, 'score'>
  },
  b: Pick<SmartPriorityInput, 'obligationId' | 'currentDueDate'> & {
    smartPriority: Pick<SmartPriorityBreakdown, 'score'>
  },
): number {
  const scoreDelta = b.smartPriority.score - a.smartPriority.score
  if (scoreDelta !== 0) return scoreDelta
  const dateDelta =
    parseDateOnly(a.currentDueDate).getTime() - parseDateOnly(b.currentDueDate).getTime()
  if (dateDelta !== 0) return dateDelta
  return a.obligationId.localeCompare(b.obligationId)
}

export function rankSmartPriorities<T extends SmartPriorityInput>(
  rows: readonly T[],
): Array<SmartPriorityRanked<T>> {
  return rows
    .map((row) => ({ row, smartPriority: scoreSmartPriority(row) }))
    .toSorted((a, b) =>
      compareSmartPriority(
        { ...a.row, smartPriority: a.smartPriority },
        { ...b.row, smartPriority: b.smartPriority },
      ),
    )
    .map((item, index) => ({
      row: item.row,
      smartPriority: {
        ...item.smartPriority,
        rank: index + 1,
      },
    }))
}
