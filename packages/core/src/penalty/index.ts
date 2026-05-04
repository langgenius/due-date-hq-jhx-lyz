export type PenaltyExposureStatus = 'ready' | 'needs_input' | 'unsupported'

export interface PenaltyEngineInput {
  jurisdiction?: string | null | undefined
  taxType: string
  entityType?: string | null | undefined
  dueDate: string | Date
  asOfDate?: string | Date | undefined
  estimatedTaxLiabilityCents?: number | null | undefined
  estimatedTaxDueCents?: number | null | undefined
  equityOwnerCount?: number | null | undefined
  horizonDays?: number | undefined
}

export interface PenaltyBreakdownItem {
  key: string
  label: string
  amountCents: number
  formula: string
}

export interface PenaltyEngineResult {
  status: PenaltyExposureStatus
  estimatedExposureCents: number | null
  estimatedTaxDueCents: number | null
  breakdown: PenaltyBreakdownItem[]
  formulaVersion: string
  missingInputs: string[]
  unsupportedReason: string | null
}

type FormulaKind =
  | 'federal_partnership_owner_month'
  | 'federal_s_corp_shareholder_month'
  | 'federal_tax_due_return'
  | 'unsupported'

interface FormulaRule {
  kind: FormulaKind
  requiredInputs: readonly string[]
  supportsOptionalTaxDue?: boolean
  unsupportedReason?: string
}

export const PENALTY_FORMULA_VERSION = 'penalty-v2-2026q2'
export const DEFAULT_EXPOSURE_HORIZON_DAYS = 90

const DAY_MS = 24 * 60 * 60 * 1000
const MAX_OWNER_MONTHS = 12
const MAX_FAILURE_TO_FILE_PERCENT = 0.25
const MAX_FAILURE_TO_PAY_PERCENT = 0.25

const FORMULA_RULES: Record<string, FormulaRule> = {
  federal_1065: {
    kind: 'federal_partnership_owner_month',
    requiredInputs: ['equityOwnerCount'],
  },
  federal_1120s: {
    kind: 'federal_s_corp_shareholder_month',
    requiredInputs: ['equityOwnerCount'],
    supportsOptionalTaxDue: true,
  },
  federal_1120: {
    kind: 'federal_tax_due_return',
    requiredInputs: ['estimatedTaxLiabilityCents'],
  },
  federal_1120_estimated_tax: {
    kind: 'unsupported',
    requiredInputs: [],
    unsupportedReason: 'Federal estimated tax underpayment requires Form 2220 / IRC 6655 inputs.',
  },
  ca_100: {
    kind: 'unsupported',
    requiredInputs: [],
    unsupportedReason: 'State penalty formula is not source-backed yet.',
  },
  ca_100s: {
    kind: 'unsupported',
    requiredInputs: [],
    unsupportedReason: 'State penalty formula is not source-backed yet.',
  },
  ca_llc_estimated_fee: {
    kind: 'unsupported',
    requiredInputs: [],
    unsupportedReason: 'State penalty formula is not source-backed yet.',
  },
  ca_llc_annual_tax: {
    kind: 'unsupported',
    requiredInputs: [],
    unsupportedReason: 'State penalty formula is not source-backed yet.',
  },
  ny_ct3: {
    kind: 'unsupported',
    requiredInputs: [],
    unsupportedReason: 'State penalty formula is not source-backed yet.',
  },
  ny_ct3s: {
    kind: 'unsupported',
    requiredInputs: [],
    unsupportedReason: 'State penalty formula is not source-backed yet.',
  },
  ny_ptet: {
    kind: 'unsupported',
    requiredInputs: [],
    unsupportedReason: 'State penalty formula is not source-backed yet.',
  },
  ny_ptet_estimated_tax: {
    kind: 'unsupported',
    requiredInputs: [],
    unsupportedReason: 'State penalty formula is not source-backed yet.',
  },
  fl_f1120: {
    kind: 'unsupported',
    requiredInputs: [],
    unsupportedReason: 'State penalty formula is not source-backed yet.',
  },
  fl_cit_estimated_tax: {
    kind: 'unsupported',
    requiredInputs: [],
    unsupportedReason: 'State penalty formula is not source-backed yet.',
  },
  tx_franchise_report: {
    kind: 'unsupported',
    requiredInputs: [],
    unsupportedReason: 'State penalty formula is not source-backed yet.',
  },
  tx_franchise_extension: {
    kind: 'unsupported',
    requiredInputs: [],
    unsupportedReason: 'State penalty formula is not source-backed yet.',
  },
  wa_combined_excise_annual: {
    kind: 'unsupported',
    requiredInputs: [],
    unsupportedReason: 'State penalty formula is not source-backed yet.',
  },
  wa_combined_excise_quarterly: {
    kind: 'unsupported',
    requiredInputs: [],
    unsupportedReason: 'State penalty formula is not source-backed yet.',
  },
  wa_combined_excise_monthly: {
    kind: 'unsupported',
    requiredInputs: [],
    unsupportedReason: 'State penalty formula is not source-backed yet.',
  },
}

export function estimateProjectedExposure(
  input: PenaltyEngineInput,
  options: { horizonDays?: number } = {},
): PenaltyEngineResult {
  const horizonDays =
    positiveInteger(options.horizonDays) ??
    positiveInteger(input.horizonDays) ??
    DEFAULT_EXPOSURE_HORIZON_DAYS
  return estimateFederalPenalty(input, {
    lateMonths: monthsForHorizonDays(horizonDays),
    daysLate: horizonDays,
  })
}

export function estimateAccruedPenalty(
  input: PenaltyEngineInput,
  options: { asOfDate?: string | Date } = {},
): PenaltyEngineResult {
  const asOfDate = options.asOfDate ?? input.asOfDate ?? new Date()
  return estimateFederalPenalty(input, {
    lateMonths: monthsLate(input.dueDate, asOfDate),
    daysLate: daysLate(input.dueDate, asOfDate),
  })
}

export function estimatePenaltyExposure(input: PenaltyEngineInput): PenaltyEngineResult {
  return estimateProjectedExposure(input)
}

function estimateFederalPenalty(
  input: PenaltyEngineInput,
  timing: { lateMonths: number; daysLate: number },
): PenaltyEngineResult {
  const rule = FORMULA_RULES[input.taxType]
  if (!rule) {
    return unsupported(`No verified penalty formula for ${input.taxType}.`)
  }
  if (rule.kind === 'unsupported') {
    return unsupported(
      rule.unsupportedReason ?? `No verified penalty formula for ${input.taxType}.`,
    )
  }

  if (timing.lateMonths <= 0) {
    return ready(0, normalizedTaxDue(input), [
      {
        key: 'not-late',
        label: 'No accrued penalty',
        amountCents: 0,
        formula: 'current due date has not passed as of the selected date',
      },
    ])
  }

  const taxDueCents = normalizedTaxDue(input)
  const ownerCount = positiveInteger(input.equityOwnerCount)
  const missingInputs = missingRequiredInputs(rule, { taxDueCents, ownerCount })
  if (missingInputs.length > 0) {
    return {
      status: 'needs_input',
      estimatedExposureCents: null,
      estimatedTaxDueCents: taxDueCents,
      breakdown: [],
      formulaVersion: PENALTY_FORMULA_VERSION,
      missingInputs,
      unsupportedReason: null,
    }
  }

  if (rule.kind === 'federal_partnership_owner_month') {
    return ownerMonthPenalty({
      label: 'Late partnership return',
      countLabel: 'partner',
      ownerCount: ownerCount!,
      dueDate: input.dueDate,
      lateMonths: timing.lateMonths,
    })
  }

  if (rule.kind === 'federal_s_corp_shareholder_month') {
    const ownerPenalty = ownerMonthPenalty({
      label: 'Late S corporation return',
      countLabel: 'shareholder',
      ownerCount: ownerCount!,
      dueDate: input.dueDate,
      lateMonths: timing.lateMonths,
    })
    if (!rule.supportsOptionalTaxDue || taxDueCents === null) return ownerPenalty

    const taxDuePenalty = taxDueReturnPenalty({
      taxDueCents,
      dueDate: input.dueDate,
      lateMonths: timing.lateMonths,
      daysLate: timing.daysLate,
    })
    if (taxDuePenalty.status !== 'ready' || taxDuePenalty.estimatedExposureCents === null) {
      return ownerPenalty
    }
    return ready(
      (ownerPenalty.estimatedExposureCents ?? 0) + taxDuePenalty.estimatedExposureCents,
      taxDueCents,
      [...ownerPenalty.breakdown, ...taxDuePenalty.breakdown],
    )
  }

  return taxDueReturnPenalty({
    taxDueCents: taxDueCents!,
    dueDate: input.dueDate,
    lateMonths: timing.lateMonths,
    daysLate: timing.daysLate,
  })
}

function ownerMonthPenalty(input: {
  label: string
  countLabel: string
  ownerCount: number
  dueDate: string | Date
  lateMonths: number
}): PenaltyEngineResult {
  const months = Math.min(MAX_OWNER_MONTHS, Math.max(0, input.lateMonths))
  const rate = passThroughMonthlyPenaltyCents(input.dueDate)
  const amount = rate * input.ownerCount * months
  return ready(amount, null, [
    {
      key: 'owner-months',
      label: input.label,
      amountCents: amount,
      formula: `${formatDollars(rate)} x ${input.ownerCount} ${input.countLabel}(s) x ${months} month(s)`,
    },
  ])
}

function taxDueReturnPenalty(input: {
  taxDueCents: number
  dueDate: string | Date
  lateMonths: number
  daysLate: number
}): PenaltyEngineResult {
  const taxDueCents = normalizedCents(input.taxDueCents)
  if (taxDueCents === null) {
    return {
      status: 'needs_input',
      estimatedExposureCents: null,
      estimatedTaxDueCents: taxDueCents,
      breakdown: [],
      formulaVersion: PENALTY_FORMULA_VERSION,
      missingInputs: ['estimatedTaxLiabilityCents'],
      unsupportedReason: null,
    }
  }

  const failureToFilePercent = Math.min(MAX_FAILURE_TO_FILE_PERCENT, 0.05 * input.lateMonths)
  const failureToFileGross = Math.round(taxDueCents * failureToFilePercent)
  const minimumLateFile =
    input.daysLate > 60 ? Math.min(taxDueCents, minimumLateFilePenaltyCents(input.dueDate)) : 0
  const failureToFileBeforeOffset = Math.max(failureToFileGross, minimumLateFile)
  const overlapMonths = Math.min(input.lateMonths, 5)
  const failureToPayOffset = Math.min(
    failureToFileBeforeOffset,
    Math.round(taxDueCents * 0.005 * overlapMonths),
  )
  const failureToFile = Math.max(0, failureToFileBeforeOffset - failureToPayOffset)
  const failureToPayPercent = Math.min(MAX_FAILURE_TO_PAY_PERCENT, 0.005 * input.lateMonths)
  const failureToPay = Math.round(taxDueCents * failureToPayPercent)
  const amount = failureToFile + failureToPay
  const breakdown: PenaltyBreakdownItem[] = [
    {
      key: 'failure-to-file',
      label: 'Late filing penalty estimate',
      amountCents: failureToFile,
      formula:
        minimumLateFile > 0
          ? `max(${formatPercent(failureToFilePercent)} x unpaid tax estimate, min(unpaid tax estimate, ${formatDollars(minimumLateFilePenaltyCents(input.dueDate))})) - same-month failure-to-pay offset`
          : `${formatPercent(failureToFilePercent)} x unpaid tax estimate - same-month failure-to-pay offset`,
    },
    {
      key: 'failure-to-pay',
      label: 'Late payment penalty estimate',
      amountCents: failureToPay,
      formula: `${formatPercent(failureToPayPercent)} x unpaid tax estimate`,
    },
  ]

  if (failureToPayOffset > 0) {
    breakdown.splice(1, 0, {
      key: 'failure-to-pay-offset',
      label: 'Failure-to-file offset',
      amountCents: failureToPayOffset,
      formula: `${formatPercent(0.005)} x unpaid tax estimate x ${overlapMonths} overlapping month(s)`,
    })
  }

  return ready(amount, taxDueCents, breakdown)
}

export function summarizePenaltyExposure(
  rows: readonly {
    id: string
    clientId: string
    clientName: string
    taxType: string
    currentDueDate: string | Date
    exposureStatus: PenaltyExposureStatus
    estimatedExposureCents: number | null
  }[],
): {
  totalExposureCents: number
  readyCount: number
  needsInputCount: number
  unsupportedCount: number
  topRows: Array<{
    obligationId: string
    clientId: string
    clientName: string
    taxType: string
    currentDueDate: string
    estimatedExposureCents: number
    exposureStatus: PenaltyExposureStatus
  }>
} {
  let totalExposureCents = 0
  let readyCount = 0
  let needsInputCount = 0
  let unsupportedCount = 0
  const topRows = []

  for (const row of rows) {
    if (row.exposureStatus === 'ready') {
      readyCount += 1
      const amount = row.estimatedExposureCents ?? 0
      totalExposureCents += amount
      topRows.push({
        obligationId: row.id,
        clientId: row.clientId,
        clientName: row.clientName,
        taxType: row.taxType,
        currentDueDate: toDateOnly(row.currentDueDate),
        estimatedExposureCents: amount,
        exposureStatus: row.exposureStatus,
      })
    } else if (row.exposureStatus === 'needs_input') {
      needsInputCount += 1
    } else {
      unsupportedCount += 1
    }
  }

  topRows.sort((a, b) => {
    const amountDelta = b.estimatedExposureCents - a.estimatedExposureCents
    if (amountDelta !== 0) return amountDelta
    return a.currentDueDate.localeCompare(b.currentDueDate)
  })

  return {
    totalExposureCents,
    readyCount,
    needsInputCount,
    unsupportedCount,
    topRows: topRows.slice(0, 5),
  }
}

function ready(
  amount: number,
  taxDueCents: number | null,
  breakdown: PenaltyBreakdownItem[],
): PenaltyEngineResult {
  return {
    status: 'ready',
    estimatedExposureCents: Math.max(0, Math.round(amount)),
    estimatedTaxDueCents: taxDueCents,
    breakdown,
    formulaVersion: PENALTY_FORMULA_VERSION,
    missingInputs: [],
    unsupportedReason: null,
  }
}

function unsupported(reason: string): PenaltyEngineResult {
  return {
    status: 'unsupported',
    estimatedExposureCents: null,
    estimatedTaxDueCents: null,
    breakdown: [],
    formulaVersion: PENALTY_FORMULA_VERSION,
    missingInputs: [],
    unsupportedReason: reason,
  }
}

function missingRequiredInputs(
  rule: FormulaRule,
  input: { taxDueCents: number | null; ownerCount: number | null },
): string[] {
  const missing: string[] = []
  for (const key of rule.requiredInputs) {
    if (
      key === 'estimatedTaxLiabilityCents' &&
      (input.taxDueCents === null || input.taxDueCents <= 0)
    ) {
      missing.push(key)
    } else if (key === 'equityOwnerCount' && input.ownerCount === null) {
      missing.push(key)
    }
  }
  return missing
}

function normalizedTaxDue(
  input: Pick<PenaltyEngineInput, 'estimatedTaxDueCents' | 'estimatedTaxLiabilityCents'>,
): number | null {
  return normalizedCents(input.estimatedTaxDueCents ?? input.estimatedTaxLiabilityCents)
}

function normalizedCents(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.round(value)
}

function positiveInteger(value: number | null | undefined): number | null {
  if (value === null || value === undefined) return null
  if (!Number.isFinite(value) || value <= 0) return null
  return Math.floor(value)
}

function monthsForHorizonDays(days: number): number {
  return Math.max(0, Math.ceil(days / 30))
}

function daysLate(dueDate: string | Date, asOfDate: string | Date): number {
  const due = parseDateOnly(dueDate)
  const asOf = parseDateOnly(asOfDate)
  return Math.max(0, Math.floor((asOf.getTime() - due.getTime()) / DAY_MS))
}

function monthsLate(dueDate: string | Date, asOfDate: string | Date): number {
  const due = parseDateOnly(dueDate)
  const asOf = parseDateOnly(asOfDate)
  if (asOf.getTime() <= due.getTime()) return 0

  let months = 1
  while (months < 50 && asOf.getTime() > addCalendarMonths(due, months).getTime()) {
    months += 1
  }
  return months
}

function addCalendarMonths(date: Date, months: number): Date {
  const year = date.getUTCFullYear()
  const month = date.getUTCMonth() + months
  const day = date.getUTCDate()
  const candidate = new Date(Date.UTC(year, month, 1))
  const lastDay = new Date(
    Date.UTC(candidate.getUTCFullYear(), candidate.getUTCMonth() + 1, 0),
  ).getUTCDate()
  candidate.setUTCDate(Math.min(day, lastDay))
  return candidate
}

function passThroughMonthlyPenaltyCents(dueDate: string | Date): number {
  const due = parseDateOnly(dueDate)
  if (due >= parseDateOnly('2026-01-01')) return 25_500
  if (due >= parseDateOnly('2025-01-01')) return 24_500
  if (due >= parseDateOnly('2024-01-01')) return 23_500
  if (due >= parseDateOnly('2023-01-01')) return 22_000
  if (due >= parseDateOnly('2021-01-01')) return 21_000
  if (due >= parseDateOnly('2020-01-01')) return 20_500
  if (due >= parseDateOnly('2018-01-01')) return 20_000
  return 19_500
}

function minimumLateFilePenaltyCents(dueDate: string | Date): number {
  const due = parseDateOnly(dueDate)
  if (due >= parseDateOnly('2026-01-01')) return 52_500
  if (due >= parseDateOnly('2025-01-01')) return 51_000
  if (due >= parseDateOnly('2024-01-01')) return 48_500
  if (due >= parseDateOnly('2023-01-01')) return 45_000
  if (due >= parseDateOnly('2020-01-01')) return 43_500
  if (due >= parseDateOnly('2018-01-01')) return 21_000
  if (due >= parseDateOnly('2016-01-01')) return 20_500
  return 13_500
}

function formatPercent(value: number): string {
  return `${Number((value * 100).toFixed(2))}%`
}

function formatDollars(cents: number): string {
  const dollars = cents / 100
  return Number.isInteger(dollars) ? `$${dollars}` : `$${dollars.toFixed(2)}`
}

function parseDateOnly(value: string | Date): Date {
  if (value instanceof Date) return new Date(`${value.toISOString().slice(0, 10)}T00:00:00.000Z`)
  return new Date(`${value.slice(0, 10)}T00:00:00.000Z`)
}

function toDateOnly(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return value.slice(0, 10)
}
