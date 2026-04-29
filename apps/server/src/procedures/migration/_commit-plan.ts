import { ORPCError } from '@orpc/server'
import { inferTaxTypes, type EntityType } from '@duedatehq/core/default-matrix'
import {
  findRuleById,
  listRuleSources,
  previewObligationsFromRules,
  type ObligationGenerationPreview,
  type RuleGenerationState,
} from '@duedatehq/core/rules'
import { validateEin } from '@duedatehq/core/pii'
import type { MappingRow, MappingTarget, NormalizationRow } from '@duedatehq/contracts'
import type { ScopedRepo } from '@duedatehq/ports/scoped'
import { validateRows } from './_deterministic'
import type { MappingJsonPayload, MatrixApplicationEntry } from './_types'

type CommitImportInput = Parameters<ScopedRepo['migration']['commitImport']>[0]
type CommitClient = CommitImportInput['clients'][number]
type CommitObligation = CommitImportInput['obligations'][number]
type CommitEvidence = CommitImportInput['evidence'][number]
type CommitAudit = CommitImportInput['audits'][number]

interface BuildCommitPlanInput {
  batchId: string
  firmId: string
  userId: string
  payload: MappingJsonPayload
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
  const sourceById = new Map(listRuleSources().map((source) => [source.id, source]))

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
      migrationBatchId: batchId,
    }
    clients.push(clientRow)

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
    })

    for (const preview of uniqueConcretePreviews(previews)) {
      const obligationId = crypto.randomUUID()
      const dueDate = new Date(`${preview.dueDate}T00:00:00.000Z`)
      obligations.push({
        id: obligationId,
        firmId,
        clientId,
        taxType: preview.taxType,
        taxYear: findRuleById(preview.ruleId)?.taxYear ?? 2026,
        baseDueDate: dueDate,
        currentDueDate: dueDate,
        status: preview.requiresReview ? 'review' : 'pending',
        migrationBatchId: batchId,
      })

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
    successCount: clients.length,
    skippedCount: skippedRows.size,
    appliedAt,
    revertExpiresAt,
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
  taxTypes: string[]
}

function rowToClientFacts(input: RowToClientFactsInput): ClientImportFacts {
  const name = readMappedValue(input, 'client.name')
  const rawEin = readMappedValue(input, 'client.ein')
  const rawState = readMappedValue(input, 'client.state')
  const rawEntity = readMappedValue(input, 'client.entity_type')
  const rawTaxTypes = readMappedValue(input, 'client.tax_types')
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

function isRuleGenerationState(value: string | null): value is RuleGenerationState {
  return value === 'CA' || value === 'NY' || value === 'TX' || value === 'FL' || value === 'WA'
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
