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

type FormulaKind = 'federal_tax_due_return' | 'federal_pass_through_owner' | 'fixed_tax_due'

interface FormulaRule {
  jurisdiction: string
  kind: FormulaKind
  requiredInputs: readonly string[]
  fixedTaxDueCents?: number
}

export const PENALTY_FORMULA_VERSION = 'penalty-v1-2026q2'
export const DEFAULT_EXPOSURE_HORIZON_DAYS = 90

const FEDERAL_OWNER_MONTHLY_PENALTY_CENTS = 25_500
const FEDERAL_MINIMUM_LATE_FILE_PENALTY_CENTS = 52_500

const FORMULA_RULES: Record<string, FormulaRule> = {
  federal_1065: {
    jurisdiction: 'FED',
    kind: 'federal_pass_through_owner',
    requiredInputs: ['equityOwnerCount'],
  },
  federal_1120s: {
    jurisdiction: 'FED',
    kind: 'federal_pass_through_owner',
    requiredInputs: ['equityOwnerCount'],
  },
  federal_1120: {
    jurisdiction: 'FED',
    kind: 'federal_tax_due_return',
    requiredInputs: ['estimatedTaxLiabilityCents'],
  },
  federal_1120_estimated_tax: {
    jurisdiction: 'FED',
    kind: 'federal_tax_due_return',
    requiredInputs: ['estimatedTaxLiabilityCents'],
  },
  ca_100: {
    jurisdiction: 'CA',
    kind: 'federal_tax_due_return',
    requiredInputs: ['estimatedTaxLiabilityCents'],
  },
  ca_100s: {
    jurisdiction: 'CA',
    kind: 'federal_tax_due_return',
    requiredInputs: ['estimatedTaxLiabilityCents'],
  },
  ca_llc_estimated_fee: {
    jurisdiction: 'CA',
    kind: 'federal_tax_due_return',
    requiredInputs: ['estimatedTaxLiabilityCents'],
  },
  ca_llc_annual_tax: {
    jurisdiction: 'CA',
    kind: 'fixed_tax_due',
    requiredInputs: [],
    fixedTaxDueCents: 80_000,
  },
  ny_ct3: {
    jurisdiction: 'NY',
    kind: 'federal_tax_due_return',
    requiredInputs: ['estimatedTaxLiabilityCents'],
  },
  ny_ct3s: {
    jurisdiction: 'NY',
    kind: 'federal_tax_due_return',
    requiredInputs: ['estimatedTaxLiabilityCents'],
  },
  ny_ptet: {
    jurisdiction: 'NY',
    kind: 'federal_tax_due_return',
    requiredInputs: ['estimatedTaxLiabilityCents'],
  },
  ny_ptet_estimated_tax: {
    jurisdiction: 'NY',
    kind: 'federal_tax_due_return',
    requiredInputs: ['estimatedTaxLiabilityCents'],
  },
  fl_f1120: {
    jurisdiction: 'FL',
    kind: 'federal_tax_due_return',
    requiredInputs: ['estimatedTaxLiabilityCents'],
  },
  fl_cit_estimated_tax: {
    jurisdiction: 'FL',
    kind: 'federal_tax_due_return',
    requiredInputs: ['estimatedTaxLiabilityCents'],
  },
  tx_franchise_report: {
    jurisdiction: 'TX',
    kind: 'federal_tax_due_return',
    requiredInputs: ['estimatedTaxLiabilityCents'],
  },
  tx_franchise_extension: {
    jurisdiction: 'TX',
    kind: 'federal_tax_due_return',
    requiredInputs: ['estimatedTaxLiabilityCents'],
  },
  wa_combined_excise_annual: {
    jurisdiction: 'WA',
    kind: 'federal_tax_due_return',
    requiredInputs: ['estimatedTaxLiabilityCents'],
  },
  wa_combined_excise_quarterly: {
    jurisdiction: 'WA',
    kind: 'federal_tax_due_return',
    requiredInputs: ['estimatedTaxLiabilityCents'],
  },
  wa_combined_excise_monthly: {
    jurisdiction: 'WA',
    kind: 'federal_tax_due_return',
    requiredInputs: ['estimatedTaxLiabilityCents'],
  },
}

export function estimatePenaltyExposure(input: PenaltyEngineInput): PenaltyEngineResult {
  const rule = FORMULA_RULES[input.taxType]
  if (!rule) {
    return unsupported(`No verified penalty formula for ${input.taxType}.`)
  }

  const horizonDays = positiveInteger(input.horizonDays) ?? DEFAULT_EXPOSURE_HORIZON_DAYS
  const months = Math.min(12, Math.max(1, Math.ceil(horizonDays / 30)))
  const taxDueCents = normalizedCents(
    input.estimatedTaxDueCents ?? input.estimatedTaxLiabilityCents ?? rule.fixedTaxDueCents,
  )
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

  if (rule.kind === 'fixed_tax_due') {
    const amount = rule.fixedTaxDueCents ?? 0
    return ready(amount, amount, [
      {
        key: 'fixed-tax-due',
        label: 'Fixed statutory payment due',
        amountCents: amount,
        formula: 'verified fixed amount from rule metadata',
      },
    ])
  }

  if (rule.kind === 'federal_pass_through_owner') {
    const amount = FEDERAL_OWNER_MONTHLY_PENALTY_CENTS * ownerCount! * months
    return ready(amount, null, [
      {
        key: 'owner-months',
        label: 'Late filing by owner-month',
        amountCents: amount,
        formula: `$255 x ${ownerCount} owner(s) x ${months} month(s)`,
      },
    ])
  }

  if (taxDueCents === null || taxDueCents <= 0) {
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

  const failureToFilePercent = Math.min(0.25, 0.05 * months)
  const failureToPayPercent = Math.min(0.25, 0.005 * months)
  const failureToFile = Math.round(taxDueCents * failureToFilePercent)
  const minimumLateFile =
    horizonDays > 60 ? Math.min(taxDueCents, FEDERAL_MINIMUM_LATE_FILE_PENALTY_CENTS) : 0
  const adjustedFailureToFile = Math.max(failureToFile, minimumLateFile)
  const failureToPay = Math.round(taxDueCents * failureToPayPercent)
  const amount = adjustedFailureToFile + failureToPay

  return ready(amount, taxDueCents, [
    {
      key: 'failure-to-file',
      label: 'Late filing exposure',
      amountCents: adjustedFailureToFile,
      formula:
        horizonDays > 60
          ? `max(${formatPercent(failureToFilePercent)} x tax due, min(tax due, $525))`
          : `${formatPercent(failureToFilePercent)} x tax due`,
    },
    {
      key: 'failure-to-pay',
      label: 'Late payment exposure',
      amountCents: failureToPay,
      formula: `${formatPercent(failureToPayPercent)} x tax due`,
    },
  ])
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

function formatPercent(value: number): string {
  return `${Number((value * 100).toFixed(2))}%`
}

function toDateOnly(value: string | Date): string {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  return value.slice(0, 10)
}
