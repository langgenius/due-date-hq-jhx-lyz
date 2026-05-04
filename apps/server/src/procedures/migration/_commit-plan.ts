import { ORPCError } from '@orpc/server'
import { inferTaxTypes, type EntityType } from '@duedatehq/core/default-matrix'
import { defaultReadinessForStatus } from '@duedatehq/core/obligation-workflow'
import {
  findRuleById,
  listObligationRules,
  listRuleSources,
  previewObligationsFromRules,
  STATE_RULE_JURISDICTIONS,
  type ObligationGenerationPreview,
  type ObligationRule,
  type RuleGenerationState,
} from '@duedatehq/core/rules'
import { validateEin } from '@duedatehq/core/pii'
import {
  buildPenaltyFactsFromLegacy,
  estimateProjectedExposure,
  PENALTY_FACTS_VERSION,
  type PenaltyFacts,
} from '@duedatehq/core/penalty'
import type { MappingRow, MappingTarget, NormalizationRow } from '@duedatehq/contracts'
import type { ScopedRepo } from '@duedatehq/ports/scoped'
import { validateRows } from './_deterministic'
import type { MappingJsonPayload, MatrixApplicationEntry } from './_types'

type CommitImportInput = Parameters<ScopedRepo['migration']['commitImport']>[0]
type CommitClient = CommitImportInput['clients'][number]
type CommitObligation = CommitImportInput['obligations'][number]
type CommitEvidence = CommitImportInput['evidence'][number]
type CommitAudit = CommitImportInput['audits'][number]
type CommitExternalReference = NonNullable<CommitImportInput['externalReferences']>[number]

interface BuildCommitPlanInput {
  batchId: string
  firmId: string
  userId: string
  payload: MappingJsonPayload
  rules?: readonly ObligationRule[]
}

function buildCommitPlan(input: BuildCommitPlanInput): CommitImportInput {
  const { batchId, firmId, userId, payload } = input
  if (!payload.rawInput || !payload.confirmedMappings) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Import payload is missing confirmed mappings.',
    })
  }

  const appliedAt = new Date()
  const revertExpiresAt = new Date(appliedAt.getTime() + 24 * 60 * 60 * 1000)
  const normalizations = payload.confirmedNormalizations ?? []
  const matrixByCell = new Map<string, MatrixApplicationEntry>()
  for (const cell of payload.matrixApplied ?? []) {
    matrixByCell.set(`${cell.entityType}::${cell.state}`, cell)
  }
  const hasMatrixApplication = (payload.matrixApplied ?? []).length > 0

  const clients: CommitClient[] = []
  const obligations: CommitObligation[] = []
  const evidence: CommitEvidence[] = []
  const externalReferences: CommitExternalReference[] = []
  const sourceById = new Map(listRuleSources().map((source) => [source.id, source]))
  const runtimeRules = input.rules ?? listObligationRules({ includeCandidates: true })
  const ruleById = new Map(runtimeRules.map((rule) => [rule.id, rule]))

  const skippedRows = new Set<number>()
  const rowErrors = validateRows(
    payload.rawInput.headers,
    payload.rawInput.rows,
    payload.confirmedMappings,
  )
  for (const error of rowErrors) {
    if (error.errorCode === 'EMPTY_NAME') skippedRows.add(error.rowIndex)
  }

  for (const [rowIndex, row] of payload.rawInput.rows.entries()) {
    if (skippedRows.has(rowIndex)) continue

    const facts = rowToClientFacts({
      headers: payload.rawInput.headers,
      row,
      mappings: payload.confirmedMappings,
      normalizations,
      matrixByCell,
      hasMatrixApplication,
    })
    if (!facts.name) {
      skippedRows.add(rowIndex)
      continue
    }

    const clientId = crypto.randomUUID()
    const clientRow: CommitClient = {
      id: clientId,
      firmId,
      name: facts.name,
      ein: facts.ein,
      state: facts.state,
      county: facts.county,
      entityType: facts.entityType,
      email: facts.email,
      notes: facts.notes,
      assigneeName: facts.assigneeName,
      estimatedTaxLiabilityCents: facts.estimatedTaxLiabilityCents,
      estimatedTaxLiabilitySource:
        facts.estimatedTaxLiabilityCents !== null ? ('imported' as const) : null,
      equityOwnerCount: facts.equityOwnerCount,
      migrationBatchId: batchId,
    }
    clients.push(clientRow)
    const externalRow = payload.externalStagingRows?.find((item) => item.rowIndex === rowIndex)
    if (externalRow) {
      externalReferences.push(
        buildExternalReference({
          firmId,
          batchId,
          provider: externalRow.provider,
          internalEntityType: 'client',
          internalEntityId: clientId,
          externalEntityType: externalRow.externalEntityType,
          externalId: externalRow.externalId,
          externalUrl: externalRow.externalUrl,
          metadataJson: {
            stagingRowId: externalRow.stagingRowId,
            rowHash: externalRow.rowHash,
          },
          appliedAt,
        }),
      )
    }

    if (!isRuleGenerationState(facts.state) || facts.taxTypes.length === 0) continue

    const previews = previewObligationsFromRules({
      client: {
        id: clientId,
        entityType: facts.entityType,
        state: facts.state,
        taxTypes: facts.taxTypes,
        taxYearStart: '2026-01-01',
        taxYearEnd: '2025-12-31',
      },
      rules: runtimeRules,
    })

    for (const preview of uniqueConcretePreviews(previews)) {
      const obligationId = crypto.randomUUID()
      const dueDate = new Date(`${preview.dueDate}T00:00:00.000Z`)
      const penaltyFacts = buildPenaltyFactsFromLegacy({
        taxType: preview.taxType,
        estimatedTaxLiabilityCents: facts.estimatedTaxLiabilityCents,
        equityOwnerCount: facts.equityOwnerCount,
      })
      penaltyFacts.facts = { ...penaltyFacts.facts, ...facts.penaltyFacts }
      const exposure = estimateProjectedExposure({
        jurisdiction: preview.jurisdiction,
        taxType: preview.taxType,
        entityType: facts.entityType,
        dueDate,
        asOfDate: appliedAt,
        penaltyFactsJson: penaltyFacts,
      })
      const status = preview.requiresReview ? 'review' : 'pending'
      obligations.push({
        id: obligationId,
        firmId,
        clientId,
        taxType: preview.taxType,
        taxYear:
          ruleById.get(preview.ruleId)?.taxYear ?? findRuleById(preview.ruleId)?.taxYear ?? 2026,
        baseDueDate: dueDate,
        currentDueDate: dueDate,
        status,
        readiness: defaultReadinessForStatus(status, undefined),
        migrationBatchId: batchId,
        estimatedTaxDueCents: exposure.estimatedTaxDueCents,
        estimatedExposureCents: exposure.estimatedExposureCents,
        exposureStatus: exposure.status,
        penaltyFactsJson: penaltyFacts,
        penaltyFactsVersion: PENALTY_FACTS_VERSION,
        penaltyBreakdownJson: exposure.breakdown,
        penaltyFormulaVersion: exposure.formulaVersion,
        missingPenaltyFactsJson: exposure.missingPenaltyFacts,
        penaltySourceRefsJson: exposure.penaltySourceRefs,
        penaltyFormulaLabel: exposure.penaltyFormulaLabel,
        exposureCalculatedAt: appliedAt,
      })
      if (externalRow) {
        externalReferences.push(
          buildExternalReference({
            firmId,
            batchId,
            provider: externalRow.provider,
            internalEntityType: 'obligation',
            internalEntityId: obligationId,
            externalEntityType: externalRow.externalEntityType,
            externalId: externalRow.externalId,
            externalUrl: externalRow.externalUrl,
            metadataJson: {
              stagingRowId: externalRow.stagingRowId,
              rowHash: externalRow.rowHash,
              sourceClientId: clientId,
              taxType: preview.taxType,
            },
            appliedAt,
          }),
        )
      }

      const primaryEvidence = preview.evidence[0]
      const sourceId = primaryEvidence?.sourceId ?? preview.sourceIds[0] ?? preview.ruleId
      const source = sourceById.get(sourceId)
      evidence.push({
        id: crypto.randomUUID(),
        firmId,
        obligationInstanceId: obligationId,
        aiOutputId: null,
        sourceType: 'verified_rule',
        sourceId: preview.ruleId,
        sourceUrl: source?.url ?? null,
        verbatimQuote: primaryEvidence?.sourceExcerpt ?? null,
        rawValue: preview.matchedTaxType,
        normalizedValue: preview.taxType,
        confidence: preview.reminderReady ? 1 : 0.7,
        model: null,
        matrixVersion: null,
        verifiedAt: null,
        verifiedBy: null,
        appliedAt,
        appliedBy: userId,
      })
    }
  }

  const audits: CommitAudit[] = [
    {
      id: crypto.randomUUID(),
      firmId,
      actorId: userId,
      entityType: 'migration_batch',
      entityId: batchId,
      action: 'migration.imported',
      beforeJson: { status: 'reviewing' },
      afterJson: {
        clientCount: clients.length,
        obligationCount: obligations.length,
        skippedCount: skippedRows.size,
      },
      reason: null,
      ipHash: null,
      userAgentHash: null,
    },
    {
      id: crypto.randomUUID(),
      firmId,
      actorId: userId,
      entityType: 'client_batch',
      entityId: clients[0]?.id ?? batchId,
      action: 'client.batch_created',
      beforeJson: null,
      afterJson: { count: clients.length, migrationBatchId: batchId },
      reason: null,
      ipHash: null,
      userAgentHash: null,
    },
    {
      id: crypto.randomUUID(),
      firmId,
      actorId: userId,
      entityType: 'obligation_batch',
      entityId: obligations[0]?.id ?? batchId,
      action: 'obligation.batch_created',
      beforeJson: null,
      afterJson: { count: obligations.length, migrationBatchId: batchId },
      reason: null,
      ipHash: null,
      userAgentHash: null,
    },
  ]

  return {
    batchId,
    clients,
    obligations,
    evidence,
    audits,
    externalReferences,
    successCount: clients.length,
    skippedCount: skippedRows.size,
    appliedAt,
    revertExpiresAt,
  }
}

function buildExternalReference(input: {
  firmId: string
  batchId: string
  provider: CommitExternalReference['provider']
  internalEntityType: CommitExternalReference['internalEntityType']
  internalEntityId: string
  externalEntityType: CommitExternalReference['externalEntityType']
  externalId: string
  externalUrl: string | null
  metadataJson: unknown
  appliedAt: Date
}): CommitExternalReference {
  return {
    id: crypto.randomUUID(),
    firmId: input.firmId,
    provider: input.provider,
    migrationBatchId: input.batchId,
    internalEntityType: input.internalEntityType,
    internalEntityId: input.internalEntityId,
    externalEntityType: input.externalEntityType,
    externalId: input.externalId,
    externalUrl: input.externalUrl,
    metadataJson: input.metadataJson,
    lastSyncedAt: input.appliedAt,
  }
}

interface RowToClientFactsInput {
  headers: readonly string[]
  row: readonly string[]
  mappings: readonly MappingRow[]
  normalizations: readonly NormalizationRow[]
  matrixByCell: ReadonlyMap<string, MatrixApplicationEntry>
  hasMatrixApplication: boolean
}

interface ClientImportFacts {
  name: string | null
  ein: string | null
  state: string | null
  county: string | null
  entityType: EntityType
  email: string | null
  notes: string | null
  assigneeName: string | null
  estimatedTaxLiabilityCents: number | null
  equityOwnerCount: number | null
  penaltyFacts: PenaltyFacts
  taxTypes: string[]
}

function rowToClientFacts(input: RowToClientFactsInput): ClientImportFacts {
  const name = readMappedValue(input, 'client.name')
  const rawEin = readMappedValue(input, 'client.ein')
  const rawState = readMappedValue(input, 'client.state')
  const rawEntity = readMappedValue(input, 'client.entity_type')
  const rawTaxTypes = readMappedValue(input, 'client.tax_types')
  const rawEstimatedTaxLiability = readMappedValue(input, 'client.estimated_tax_liability')
  const rawEquityOwnerCount = readMappedValue(input, 'client.equity_owner_count')
  const rawPenaltyTaxDue = readMappedValue(input, 'penalty.tax_due')
  const rawPaymentsAndCredits = readMappedValue(input, 'penalty.payments_and_credits')
  const rawFilingFrequency = readMappedValue(input, 'penalty.filing_frequency')
  const rawPeriodStart = readMappedValue(input, 'penalty.period_start')
  const rawPeriodEnd = readMappedValue(input, 'penalty.period_end')
  const rawInstallments = readMappedValue(input, 'penalty.installments')
  const rawMemberCount = readMappedValue(input, 'penalty.member_count')
  const rawPartnerCount = readMappedValue(input, 'penalty.partner_count')
  const rawShareholderCount = readMappedValue(input, 'penalty.shareholder_count')
  const rawGrossReceipts = readMappedValue(input, 'penalty.gross_receipts')
  const rawReceiptsBand = readMappedValue(input, 'penalty.receipts_band')
  const rawAnnualReportNoTaxDue = readMappedValue(input, 'penalty.annual_report_no_tax_due')
  const rawWaSubtotalMinusCredits = readMappedValue(input, 'penalty.wa_subtotal_minus_credits')
  const rawTxPriorYearFranchiseTax = readMappedValue(input, 'penalty.tx_prior_year_franchise_tax')
  const rawTxCurrentYearFranchiseTax = readMappedValue(
    input,
    'penalty.tx_current_year_franchise_tax',
  )
  const rawFlTentativeTax = readMappedValue(input, 'penalty.fl_tentative_tax')
  const rawNyPtetElectionMade = readMappedValue(input, 'penalty.ny_ptet_election_made')
  const rawNyPtetPayments = readMappedValue(input, 'penalty.ny_ptet_payments')
  const rawWithholdingReportCount = readMappedValue(input, 'penalty.withholding_report_count')
  const rawUiWageReportCount = readMappedValue(input, 'penalty.ui_wage_report_count')
  const state = normalizeMappedValue(input.normalizations, 'state', rawState)
  const entity = normalizeMappedValue(input.normalizations, 'entity_type', rawEntity)
  const entityCandidate = entity ?? ''
  const entityType: EntityType = isEntityType(entityCandidate) ? entityCandidate : 'other'
  const taxTypes = normalizeTaxTypes(input.normalizations, rawTaxTypes)

  if (taxTypes.length === 0 && state) {
    const matrix = input.matrixByCell.get(`${entityType}::${state}`)
    if (matrix) {
      if (matrix.enabled) taxTypes.push(...matrix.taxTypes)
    } else if (!input.hasMatrixApplication) {
      taxTypes.push(...inferTaxTypes(entityType, state).taxTypes)
    }
  }

  return {
    name,
    ein: rawEin && validateEin(rawEin) ? rawEin : null,
    state: state && /^[A-Z]{2}$/.test(state) ? state : null,
    county: readMappedValue(input, 'client.county'),
    entityType,
    email: normalizeEmail(readMappedValue(input, 'client.email')),
    notes: readMappedValue(input, 'client.notes'),
    assigneeName: readMappedValue(input, 'client.assignee_name'),
    estimatedTaxLiabilityCents: parseMoneyCents(rawEstimatedTaxLiability),
    equityOwnerCount: parsePositiveInteger(rawEquityOwnerCount),
    penaltyFacts: compactPenaltyFacts({
      taxDueCents: parseMoneyCents(rawPenaltyTaxDue),
      paymentsAndCreditsCents: parseMoneyCents(rawPaymentsAndCredits),
      filingFrequency: rawFilingFrequency,
      periodStart: normalizeIsoDate(rawPeriodStart),
      periodEnd: normalizeIsoDate(rawPeriodEnd),
      installments: parseInstallments(rawInstallments),
      memberCount: parsePositiveInteger(rawMemberCount),
      partnerCount: parsePositiveInteger(rawPartnerCount),
      shareholderCount: parsePositiveInteger(rawShareholderCount),
      grossReceiptsCents: parseMoneyCents(rawGrossReceipts),
      receiptsBand: rawReceiptsBand,
      annualReportNoTaxDueStatus: parseBoolean(rawAnnualReportNoTaxDue),
      waSubtotalMinusCreditsCents: parseMoneyCents(rawWaSubtotalMinusCredits),
      txPriorYearFranchiseTaxCents: parseMoneyCents(rawTxPriorYearFranchiseTax),
      txCurrentYearFranchiseTaxCents: parseMoneyCents(rawTxCurrentYearFranchiseTax),
      flTentativeTaxCents: parseMoneyCents(rawFlTentativeTax),
      nyPtetElectionMade: parseBoolean(rawNyPtetElectionMade),
      nyPtetPaymentsCents: parseMoneyCents(rawNyPtetPayments),
      withholdingReportCount: parsePositiveInteger(rawWithholdingReportCount),
      uiWageReportCount: parsePositiveInteger(rawUiWageReportCount),
    }),
    taxTypes: Array.from(new Set(taxTypes.filter((value) => value.length > 0))),
  }
}

function readMappedValue(input: RowToClientFactsInput, target: MappingTarget): string | null {
  const mapping = input.mappings.find((item) => item.targetField === target)
  if (!mapping) return null
  const index = input.headers.findIndex((header) => header === mapping.sourceHeader)
  if (index < 0) return null
  const value = input.row[index]?.trim()
  return value ? value : null
}

function normalizeMappedValue(
  normalizations: readonly NormalizationRow[],
  field: string,
  raw: string | null,
): string | null {
  if (!raw) return null
  const hit = normalizations.find((item) => item.field === field && item.rawValue === raw)
  return hit?.normalizedValue ?? raw
}

function normalizeTaxTypes(
  normalizations: readonly NormalizationRow[],
  raw: string | null,
): string[] {
  if (!raw) return []
  const hit = normalizations.find((item) => item.field === 'tax_types' && item.rawValue === raw)
  const normalized = hit?.normalizedValue
  if (normalized) {
    try {
      const parsed = JSON.parse(normalized)
      if (Array.isArray(parsed)) {
        return parsed.filter((item): item is string => typeof item === 'string')
      }
    } catch {
      return [normalized]
    }
    return [normalized]
  }
  return raw
    .split(/[;,|]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

function normalizeEmail(value: string | null): string | null {
  if (!value) return null
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? value : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseMoneyCents(value: string | null): number | null {
  if (!value) return null
  const normalized = value.replace(/[$,\s]/g, '')
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) return null
  const dollars = Number(normalized)
  if (!Number.isFinite(dollars) || dollars < 0) return null
  return Math.round(dollars * 100)
}

function parseBoolean(value: string | null): boolean | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()
  if (['true', 'yes', 'y', '1', 'no tax due', 'elected'].includes(normalized)) return true
  if (['false', 'no', 'n', '0', 'not elected'].includes(normalized)) return false
  return null
}

function normalizeIsoDate(value: string | null): string | null {
  if (!value) return null
  const direct = value.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(direct)) return direct
  const parsed = new Date(direct)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString().slice(0, 10)
}

function parseInstallments(value: string | null): PenaltyInstallmentFacts | null {
  if (!value) return null
  try {
    const parsed: unknown = JSON.parse(value)
    if (!Array.isArray(parsed)) return null
    return parsed.flatMap((item) => {
      if (!isRecord(item)) return []
      return [
        {
          dueDate: typeof item.dueDate === 'string' ? normalizeIsoDate(item.dueDate) : null,
          requiredPaymentCents:
            typeof item.requiredPaymentCents === 'number'
              ? item.requiredPaymentCents
              : parseMoneyCents(
                  typeof item.requiredPayment === 'string' ? item.requiredPayment : null,
                ),
          paidCents:
            typeof item.paidCents === 'number'
              ? item.paidCents
              : parseMoneyCents(typeof item.paid === 'string' ? item.paid : null),
          paidDate: typeof item.paidDate === 'string' ? normalizeIsoDate(item.paidDate) : null,
          annualRateBps:
            typeof item.annualRateBps === 'number'
              ? item.annualRateBps
              : parsePositiveInteger(
                  typeof item.annualRateBps === 'string' ? item.annualRateBps : null,
                ),
        },
      ]
    })
  } catch {
    return null
  }
}

type PenaltyInstallmentFacts = NonNullable<PenaltyFacts['installments']>

function compactPenaltyFacts(facts: PenaltyFacts): PenaltyFacts {
  const result: PenaltyFacts = {}
  for (const [key, value] of Object.entries(facts)) {
    if (value !== null && value !== undefined && value !== '') {
      Object.assign(result, { [key]: value })
    }
  }
  return result
}

function parsePositiveInteger(value: string | null): number | null {
  if (!value) return null
  const normalized = value.replace(/[, ]/g, '')
  if (!/^\d+$/.test(normalized)) return null
  const parsed = Number(normalized)
  if (!Number.isSafeInteger(parsed) || parsed <= 0) return null
  return parsed
}

function isRuleGenerationState(value: string | null): value is RuleGenerationState {
  return (
    typeof value === 'string' && (STATE_RULE_JURISDICTIONS as readonly string[]).includes(value)
  )
}

function uniqueConcretePreviews(
  previews: readonly ObligationGenerationPreview[],
): ObligationGenerationPreview[] {
  const out: ObligationGenerationPreview[] = []
  const seen = new Set<string>()
  for (const preview of previews) {
    if (!preview.dueDate) continue
    const key = `${preview.ruleId}::${preview.period}::${preview.dueDate}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(preview)
  }
  return out
}

function isEntityType(value: string): value is EntityType {
  return (
    value === 'llc' ||
    value === 's_corp' ||
    value === 'partnership' ||
    value === 'c_corp' ||
    value === 'sole_prop' ||
    value === 'trust' ||
    value === 'individual' ||
    value === 'other'
  )
}

export { buildCommitPlan }
