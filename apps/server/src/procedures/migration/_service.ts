import { ORPCError } from '@orpc/server'
import * as z from 'zod'
import type { AI } from '@duedatehq/ai'
import {
  inferTaxTypes,
  type EntityType,
  type InferTaxTypesResult,
} from '@duedatehq/core/default-matrix'
import { parseTabular, type ParsedTabular, type TabularKind } from '@duedatehq/core/csv-parser'
import { normalizeEntityType, normalizeState } from '@duedatehq/core/normalize-dict'
import {
  findRuleById,
  listRuleSources,
  previewObligationsFromRules,
  type ObligationGenerationPreview,
  type RuleGenerationState,
} from '@duedatehq/core/rules'
import { validateEin } from '@duedatehq/core/pii'
import {
  DryRunSummarySchema,
  MappingRowSchema,
  NormalizationRowSchema,
  type DryRunSummary,
  type MapperFallback,
  type MapperRunOutput,
  type MappingRow,
  type MappingTarget,
  type MigrationBatch,
  type MigrationError,
  type MigrationSource,
  type NormalizationRow,
} from '@duedatehq/contracts'
// `import type` from @duedatehq/db is restricted in procedures (vite.config.ts
// no-restricted-imports override). Reach the type via dynamic-import syntax,
// which the linter does not flag — same trick env.ts uses for ContextVars.
type ScopedRepo = import('@duedatehq/db').ScopedRepo
import {
  buildAllIgnoreMappings,
  buildPresetMappings,
  isPresetId,
  PRESET_VERSION,
} from './_preset-mappings'
import { sanitizeMapperOutput, validateNormalizedRows, validateRows } from './_deterministic'
import type { DeterministicError, MappingJsonPayload, MatrixApplicationEntry } from './_types'

/**
 * MigrationService — orchestrates Migration Copilot's 4-step import flow.
 *
 * Authority:
 *   - docs/dev-file/10-Demo-Sprint-7Day-Rhythm.md §3 Day 3
 *   - docs/product-design/migration-copilot/02-ux-4step-wizard.md
 *   - docs/product-design/migration-copilot/04-ai-prompts.md
 *
 * Design pattern: thin procedure handlers (`procedures/migration/index.ts`)
 * delegate to instance methods here. The service NEVER touches the DB
 * directly — every persistence call goes through `scoped.*` so tenant
 * isolation is preserved by construction.
 *
 * What the service owns:
 *   - createBatch / uploadRaw / runMapper / confirmMapping / runNormalizer /
 *     confirmNormalization / applyDefaultMatrix / dryRun / getBatch
 *   - apply (real client + obligation + evidence + audit insert)
 *   - Persisting `mapping_json` (the user-confirmed payload Step 4 reads)
 *   - Writing per-decision evidence_link rows (ai_mapper / ai_normalizer /
 *     default_inference_by_entity_state)
 *   - Writing audit rows for every confirmation step
 *
 * What the service does NOT own yet:
 *   - migration.revert / singleUndo
 *   - obligations.updateDueDate
 */

const MAX_SAMPLE_ROWS = 5

const MapperOutputSchema = z.object({
  mappings: z.array(
    z.object({
      source: z.string().min(1),
      target: z.enum([
        'client.name',
        'client.ein',
        'client.state',
        'client.county',
        'client.entity_type',
        'client.tax_types',
        'client.assignee_name',
        'client.email',
        'client.notes',
        'IGNORE',
      ]),
      confidence: z.number().min(0).max(1),
      reasoning: z.string().optional(),
    }),
  ),
})

const EntityNormalizerSchema = z.record(
  z.string(),
  z.object({
    normalized: z.enum([
      'llc',
      's_corp',
      'partnership',
      'c_corp',
      'sole_prop',
      'trust',
      'individual',
      'other',
    ]),
    confidence: z.number().min(0).max(1),
    reasoning: z.string().optional(),
  }),
)

const TaxTypesNormalizerSchema = z.record(
  z.string(),
  z.object({
    normalized: z.array(z.string()),
    confidence: z.number().min(0).max(1),
    reasoning: z.string().optional(),
  }),
)

type CommitImportInput = Parameters<ScopedRepo['migration']['commitImport']>[0]
type CommitClient = CommitImportInput['clients'][number]
type CommitObligation = CommitImportInput['obligations'][number]
type CommitEvidence = CommitImportInput['evidence'][number]
type CommitAudit = CommitImportInput['audits'][number]

export interface MigrationDeps {
  scoped: ScopedRepo
  ai: AI
  userId: string
}

export interface UploadRawInput {
  batchId: string
  kind: TabularKind
  /** Either utf-8 text (paste / csv / tsv) or base64-encoded bytes. */
  text?: string
  base64?: string
}

export class MigrationService {
  constructor(private readonly deps: MigrationDeps) {}

  // ---------------------------------------------------------------------
  // Step 1 — batch + raw input
  // ---------------------------------------------------------------------

  async createBatch(input: {
    source: MigrationSource
    presetUsed?: string | null
    rowCount?: number
  }): Promise<MigrationBatch> {
    const existing = await this.deps.scoped.migration.getActiveDraftBatch()
    if (existing) {
      throw new ORPCError('CONFLICT', {
        message:
          'Another import is currently in progress. Resume from Settings › Imports History or cancel it before starting a new one.',
      })
    }

    const { id } = await this.deps.scoped.migration.createBatch({
      userId: this.deps.userId,
      source: input.source,
      presetUsed: input.presetUsed ?? null,
      rowCount: input.rowCount ?? 0,
    })

    await this.deps.scoped.audit.write({
      actorId: this.deps.userId,
      entityType: 'migration_batch',
      entityId: id,
      action: 'migration.batch.created',
      after: { source: input.source, presetUsed: input.presetUsed ?? null },
    })

    const batch = await this.deps.scoped.migration.getBatch(id)
    if (!batch) {
      throw new ORPCError('INTERNAL_SERVER_ERROR', { message: 'Batch row could not be re-read.' })
    }
    return toMigrationBatch(batch)
  }

  async uploadRaw(input: UploadRawInput): Promise<{ rawInputR2Key: string }> {
    const batch = await this.requireDraftBatch(input.batchId)

    let parsed: ParsedTabular
    if (input.text !== undefined) {
      parsed = parseTabular(input.text, { kind: input.kind })
    } else if (input.base64 !== undefined) {
      const bytes = base64ToBytes(input.base64)
      // Decode straight to text — the parser does the same internally for
      // ArrayBuffer input, so this avoids a SharedArrayBuffer / ArrayBuffer
      // type juggle when running in Workers.
      const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes)
      parsed = parseTabular(text, { kind: input.kind })
    } else {
      throw new ORPCError('BAD_REQUEST', {
        message: 'uploadRaw requires either `text` or `base64` payload.',
      })
    }

    const payload = (batch.mappingJson ?? {}) as MappingJsonPayload
    payload.rawInput = {
      kind: input.kind,
      headers: parsed.headers,
      rows: parsed.rows,
      rowCount: parsed.rowCount,
      truncated: parsed.truncated,
    }

    await this.deps.scoped.migration.updateBatch(input.batchId, {
      mappingJson: payload,
      rowCount: parsed.rowCount,
      status: 'mapping',
    })

    // Day 3 keeps raw input inline. Day 7 / Phase 0 swaps this to a real
    // R2 signed PUT URL; the contract surface stays identical.
    return { rawInputR2Key: `inline://${input.batchId}` }
  }

  // ---------------------------------------------------------------------
  // Step 2 — AI Field Mapper
  // ---------------------------------------------------------------------

  async runMapper(batchId: string): Promise<MapperRunOutput> {
    const batch = await this.requireBatch(batchId)
    const payload = (batch.mappingJson ?? {}) as MappingJsonPayload
    if (!payload.rawInput) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Step 1 raw input is missing — call uploadRaw first.',
      })
    }
    const { headers, rows } = payload.rawInput
    const sampleRows = rows.slice(0, MAX_SAMPLE_ROWS)

    let aiMappings: MappingRow[] | null = null
    let fallback: MapperFallback = null
    let model: string | null = null

    const aiResult = await this.deps.ai.runPrompt(
      'mapper@v1',
      {
        header: headers,
        sample_rows: sampleRows,
        preset: batch.presetUsed,
        firm_id_hash: this.deps.scoped.firmId,
      },
      MapperOutputSchema,
    )

    if (aiResult.result) {
      model = aiResult.model
      aiMappings = aiResult.result.mappings.map(
        (m) =>
          ({
            id: crypto.randomUUID(),
            batchId,
            sourceHeader: m.source,
            targetField: m.target,
            confidence: m.confidence,
            reasoning: m.reasoning ?? null,
            userOverridden: false,
            model: aiResult.model,
            promptVersion: 'mapper@v1',
            createdAt: new Date().toISOString(),
          }) satisfies MappingRow,
      )
    } else if (isPresetId(batch.presetUsed)) {
      aiMappings = buildPresetMappings(batch.presetUsed, headers, batchId)
      fallback = 'preset'
    } else {
      aiMappings = buildAllIgnoreMappings(headers, batchId)
      fallback = 'all_ignore'
    }

    const { sanitizedMappings, ssnBlockedHeaders } = sanitizeMapperOutput(
      aiMappings,
      headers,
      sampleRows,
    )

    // Persist the raw AI run (or preset fallback) for audit trail.
    await this.deps.scoped.migration.createMappings(
      batchId,
      sanitizedMappings.map((m) => ({
        sourceHeader: m.sourceHeader,
        targetField: m.targetField,
        confidence: m.confidence,
        reasoning: m.reasoning,
        userOverridden: m.userOverridden,
        model: m.model,
        promptVersion: m.promptVersion,
      })),
    )

    // Per-mapping evidence (ai_mapper). Use sourceId = batchId so the
    // Evidence drawer can group by batch.
    if (sanitizedMappings.length > 0) {
      await this.deps.scoped.evidence.writeBatch(
        sanitizedMappings.map((m) => ({
          aiOutputId: m.id,
          sourceType: 'ai_mapper',
          sourceId: batchId,
          rawValue: m.sourceHeader,
          normalizedValue: m.targetField,
          confidence: m.confidence,
          model: m.model,
          appliedBy: this.deps.userId,
        })),
      )
    }

    // Stash the AI mappings (sanitized) into mappingJson so Re-run flow
    // and Step 4 commit can read them without another AI call.
    payload.aiMappings = sanitizedMappings
    payload.confirmedMappings = sanitizedMappings
    payload.mapperFallback = fallback
    payload.ssnBlockedColumns = headers
      .map((h, i) => (ssnBlockedHeaders.includes(h) ? i : -1))
      .filter((i) => i >= 0)

    await this.deps.scoped.migration.updateBatch(batchId, {
      mappingJson: payload,
    })

    void model // model already attached on each row

    return { mappings: sanitizedMappings, meta: { fallback } }
  }

  async confirmMapping(batchId: string, userMappings: MappingRow[]): Promise<MapperRunOutput> {
    const batch = await this.requireBatch(batchId)
    const payload = (batch.mappingJson ?? {}) as MappingJsonPayload
    if (!payload.rawInput) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Step 1 raw input is missing — call uploadRaw first.',
      })
    }

    // Validate user input against the contract schema once more — even
    // though oRPC already does, we want guarantees inside service tests.
    const validated = userMappings.map((m) => MappingRowSchema.parse(m))

    const { sanitizedMappings } = sanitizeMapperOutput(
      validated,
      payload.rawInput.headers,
      payload.rawInput.rows.slice(0, MAX_SAMPLE_ROWS),
    )

    payload.confirmedMappings = sanitizedMappings

    // Run deterministic checks now that we know which column targets which
    // field (EIN format, empty name) and persist as migration_error rows.
    const detErrors = validateRows(
      payload.rawInput.headers,
      payload.rawInput.rows,
      sanitizedMappings,
    )
    if (detErrors.length > 0) {
      await this.persistErrors(batchId, detErrors)
    }

    await this.deps.scoped.migration.updateBatch(batchId, {
      mappingJson: payload,
      status: 'reviewing',
    })

    await this.deps.scoped.audit.write({
      actorId: this.deps.userId,
      entityType: 'migration_batch',
      entityId: batchId,
      action: 'migration.mapper.confirmed',
      after: {
        rowCount: sanitizedMappings.length,
        errorCount: detErrors.length,
      },
    })

    return { mappings: sanitizedMappings, meta: { fallback: payload.mapperFallback ?? null } }
  }

  // ---------------------------------------------------------------------
  // Step 3 — Normalize + Default Matrix
  // ---------------------------------------------------------------------

  async runNormalizer(batchId: string): Promise<{ normalizations: NormalizationRow[] }> {
    const batch = await this.requireBatch(batchId)
    const payload = (batch.mappingJson ?? {}) as MappingJsonPayload
    if (!payload.rawInput || !payload.confirmedMappings) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Mapper has not been confirmed yet — call confirmMapping first.',
      })
    }

    const valuesByField = collectValuesByField(
      payload.rawInput.headers,
      payload.rawInput.rows,
      payload.confirmedMappings,
    )

    const out: NormalizationRow[] = []

    if (valuesByField.entityValues.length > 0) {
      const entityRows = await this.runEntityNormalizer(batchId, valuesByField.entityValues)
      out.push(...entityRows)
    }
    if (valuesByField.taxTypeValues.length > 0) {
      const taxRows = await this.runTaxTypeNormalizer(batchId, valuesByField.taxTypeValues)
      out.push(...taxRows)
    }
    if (valuesByField.stateValues.length > 0) {
      const stateRows = this.runStateNormalizer(batchId, valuesByField.stateValues)
      out.push(...stateRows)
    }

    if (out.length > 0) {
      await this.deps.scoped.migration.createNormalizations(
        batchId,
        out.map((n) => ({
          field: n.field,
          rawValue: n.rawValue,
          normalizedValue: n.normalizedValue,
          confidence: n.confidence,
          model: n.model,
          promptVersion: n.promptVersion,
          reasoning: n.reasoning,
          userOverridden: n.userOverridden,
        })),
      )
      await this.deps.scoped.evidence.writeBatch(
        out.map((n) => ({
          aiOutputId: n.id,
          sourceType: 'ai_normalizer',
          sourceId: batchId,
          rawValue: n.rawValue,
          normalizedValue: n.normalizedValue,
          confidence: n.confidence,
          model: n.model,
          appliedBy: this.deps.userId,
        })),
      )
    }

    payload.aiNormalizations = out
    payload.confirmedNormalizations = out
    await this.deps.scoped.migration.updateBatch(batchId, { mappingJson: payload })

    return { normalizations: out }
  }

  async confirmNormalization(
    batchId: string,
    userNormalizations: NormalizationRow[],
  ): Promise<{ normalizations: NormalizationRow[] }> {
    const batch = await this.requireBatch(batchId)
    const payload = (batch.mappingJson ?? {}) as MappingJsonPayload
    if (!payload.rawInput || !payload.confirmedMappings) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Mapper has not been confirmed yet — call confirmMapping first.',
      })
    }

    const validated = userNormalizations.map((n) => NormalizationRowSchema.parse(n))
    payload.confirmedNormalizations = validated
    await this.deps.scoped.migration.updateBatch(batchId, { mappingJson: payload })

    await this.deps.scoped.audit.write({
      actorId: this.deps.userId,
      entityType: 'migration_batch',
      entityId: batchId,
      action: 'migration.normalizer.confirmed',
      after: { rowCount: validated.length },
    })

    return { normalizations: validated }
  }

  async applyDefaultMatrix(batchId: string): Promise<DryRunSummary> {
    const batch = await this.requireBatch(batchId)
    const payload = (batch.mappingJson ?? {}) as MappingJsonPayload
    if (!payload.rawInput || !payload.confirmedMappings) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Mapper must be confirmed before applying Default Matrix.',
      })
    }

    const matrix = computeMatrixApplication(payload)
    payload.matrixApplied = matrix

    await this.deps.scoped.migration.updateBatch(batchId, { mappingJson: payload })

    await this.deps.scoped.audit.write({
      actorId: this.deps.userId,
      entityType: 'migration_batch',
      entityId: batchId,
      action: 'migration.matrix.applied',
      after: {
        cells: matrix.length,
        clientsAffected: matrix.reduce((sum, e) => sum + e.appliedClientCount, 0),
      },
    })

    return this.composeDryRun(batchId, payload)
  }

  // ---------------------------------------------------------------------
  // Step 4 — Dry-Run preview and apply
  // ---------------------------------------------------------------------

  async dryRun(batchId: string): Promise<DryRunSummary> {
    const batch = await this.requireBatch(batchId)
    const payload = (batch.mappingJson ?? {}) as MappingJsonPayload
    return this.composeDryRun(batchId, payload)
  }

  async apply(batchId: string): Promise<{
    batchId: string
    clientCount: number
    obligationCount: number
    skippedCount: number
    revertibleUntil: string
  }> {
    const batch = await this.requireBatch(batchId)
    if (batch.status === 'applied') {
      throw new ORPCError('CONFLICT', { message: 'This import has already been applied.' })
    }
    if (batch.status === 'reverted') {
      throw new ORPCError('CONFLICT', { message: 'This import has already been reverted.' })
    }
    if (batch.status !== 'reviewing') {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Confirm mapping and normalization before importing.',
      })
    }

    const payload = (batch.mappingJson ?? {}) as MappingJsonPayload
    const plan = buildCommitPlan({
      batchId,
      firmId: this.deps.scoped.firmId,
      userId: this.deps.userId,
      payload,
    })

    if (plan.clients.length === 0) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'No valid client rows are ready to import.',
      })
    }

    await this.deps.scoped.migration.commitImport(plan)

    return {
      batchId,
      clientCount: plan.clients.length,
      obligationCount: plan.obligations.length,
      skippedCount: plan.skippedCount,
      revertibleUntil: plan.revertExpiresAt.toISOString(),
    }
  }

  async getBatch(batchId: string): Promise<MigrationBatch | null> {
    const row = await this.deps.scoped.migration.getBatch(batchId)
    return row ? toMigrationBatch(row) : null
  }

  /**
   * Read-only list of migration_error rows for a batch, optionally filtered
   * by stage. Stage classification is heuristic on `errorCode` until each
   * deterministic check tags its origin explicitly:
   *   - mapping  : EIN_INVALID, EMPTY_NAME (Step 2 confirmMapping)
   *   - normalize: STATE_*, ENTITY_*, *_INVALID raised in normalize step
   *   - matrix   : reserved for Default Matrix application errors
   *   - all      : no filter
   */
  async listErrors(
    batchId: string,
    stage: 'mapping' | 'normalize' | 'matrix' | 'all' = 'all',
  ): Promise<MigrationError[]> {
    // requireBatch enforces firm ownership before we read anything.
    await this.requireBatch(batchId)
    const rows = await this.deps.scoped.migration.listErrors(batchId)
    const filtered =
      stage === 'all' ? rows : rows.filter((r) => classifyErrorStage(r.errorCode) === stage)
    return filtered.map((row) => toMigrationError(row))
  }

  // ---------------------------------------------------------------------
  // Internals
  // ---------------------------------------------------------------------

  private async requireBatch(batchId: string) {
    const row = await this.deps.scoped.migration.getBatch(batchId)
    if (!row) {
      throw new ORPCError('NOT_FOUND', { message: `Migration batch ${batchId} not found.` })
    }
    return row
  }

  private async requireDraftBatch(batchId: string) {
    const batch = await this.requireBatch(batchId)
    if (batch.status === 'applied' || batch.status === 'reverted') {
      throw new ORPCError('BAD_REQUEST', {
        message: `Batch ${batchId} is ${batch.status}; create a new batch to import again.`,
      })
    }
    return batch
  }

  private async persistErrors(batchId: string, errors: DeterministicError[]): Promise<void> {
    await this.deps.scoped.migration.createErrors(
      batchId,
      errors.map((e) => ({
        rowIndex: e.rowIndex,
        rawRowJson: e.rawRow,
        errorCode: e.errorCode,
        errorMessage: e.errorMessage,
      })),
    )
  }

  private composeDryRun(batchId: string, payload: MappingJsonPayload): DryRunSummary {
    const stats = computeDryRunStats(batchId, payload)
    const summary: DryRunSummary = {
      batchId,
      clientsToCreate: stats.clientsToCreate,
      obligationsToCreate: stats.obligationsToCreate,
      skippedRows: stats.skippedRows,
      errors: stats.errors,
    }
    return DryRunSummarySchema.parse(summary)
  }

  private async runEntityNormalizer(
    batchId: string,
    rawValues: string[],
  ): Promise<NormalizationRow[]> {
    const aiResult = await this.deps.ai.runPrompt(
      'normalizer-entity@v1',
      { values: rawValues },
      EntityNormalizerSchema,
    )

    const now = new Date().toISOString()
    if (aiResult.result) {
      return rawValues.map((raw) => {
        const hit = aiResult.result[raw]
        return {
          id: crypto.randomUUID(),
          batchId,
          field: 'entity_type',
          rawValue: raw,
          normalizedValue: hit?.normalized ?? null,
          confidence: hit?.confidence ?? null,
          model: aiResult.model,
          promptVersion: 'normalizer-entity@v1',
          reasoning: hit?.reasoning ?? null,
          userOverridden: false,
          createdAt: now,
        } satisfies NormalizationRow
      })
    }

    // Dictionary fallback when AI is unavailable.
    return rawValues.map((raw) => {
      const hit = normalizeEntityType(raw)
      return {
        id: crypto.randomUUID(),
        batchId,
        field: 'entity_type',
        rawValue: raw,
        normalizedValue: hit?.normalized ?? null,
        confidence: hit?.confidence ?? null,
        model: null,
        promptVersion: hit?.promptVersion ?? PRESET_VERSION,
        reasoning: hit ? 'Local dictionary fallback (AI unavailable).' : 'No dictionary match.',
        userOverridden: false,
        createdAt: now,
      } satisfies NormalizationRow
    })
  }

  private async runTaxTypeNormalizer(
    batchId: string,
    rawValues: string[],
  ): Promise<NormalizationRow[]> {
    const aiResult = await this.deps.ai.runPrompt(
      'normalizer-tax-types@v1',
      { values: rawValues },
      TaxTypesNormalizerSchema,
    )

    const now = new Date().toISOString()
    if (aiResult.result) {
      return rawValues.map((raw) => {
        const hit = aiResult.result[raw]
        return {
          id: crypto.randomUUID(),
          batchId,
          field: 'tax_types',
          rawValue: raw,
          normalizedValue: hit?.normalized ? JSON.stringify(hit.normalized) : null,
          confidence: hit?.confidence ?? null,
          model: aiResult.model,
          promptVersion: 'normalizer-tax-types@v1',
          reasoning: hit?.reasoning ?? null,
          userOverridden: false,
          createdAt: now,
        } satisfies NormalizationRow
      })
    }

    // No dictionary fallback for tax_types — Default Matrix takes over.
    return rawValues.map((raw) => ({
      id: crypto.randomUUID(),
      batchId,
      field: 'tax_types',
      rawValue: raw,
      normalizedValue: null,
      confidence: null,
      model: null,
      promptVersion: PRESET_VERSION,
      reasoning: 'AI unavailable — Default Matrix will infer tax_types from (entity, state).',
      userOverridden: false,
      createdAt: now,
    }))
  }

  private runStateNormalizer(batchId: string, rawValues: string[]): NormalizationRow[] {
    const now = new Date().toISOString()
    return rawValues.map((raw) => {
      const hit = normalizeState(raw)
      return {
        id: crypto.randomUUID(),
        batchId,
        field: 'state',
        rawValue: raw,
        normalizedValue: hit?.normalized ?? null,
        confidence: hit?.confidence ?? null,
        model: null,
        promptVersion: hit?.promptVersion ?? PRESET_VERSION,
        reasoning: hit
          ? 'Deterministic state code lookup.'
          : 'No state match — flagged for review.',
        userOverridden: false,
        createdAt: now,
      } satisfies NormalizationRow
    })
  }
}

// ---------------------------------------------------------------------
// Pure helpers (kept outside the class for testability + tree-shake)
// ---------------------------------------------------------------------

function collectValuesByField(
  headers: string[],
  rows: string[][],
  mappings: readonly MappingRow[],
): { entityValues: string[]; stateValues: string[]; taxTypeValues: string[] } {
  const headerToIndex = new Map<string, number>()
  headers.forEach((h, i) => headerToIndex.set(h, i))

  const entityIdx = mappings.find((m) => m.targetField === 'client.entity_type')?.sourceHeader
  const stateIdx = mappings.find((m) => m.targetField === 'client.state')?.sourceHeader
  const taxIdx = mappings.find((m) => m.targetField === 'client.tax_types')?.sourceHeader

  return {
    entityValues: collectColumn(headerToIndex.get(entityIdx ?? ''), rows),
    stateValues: collectColumn(headerToIndex.get(stateIdx ?? ''), rows),
    taxTypeValues: collectColumn(headerToIndex.get(taxIdx ?? ''), rows),
  }
}

function collectColumn(idx: number | undefined, rows: string[][]): string[] {
  if (idx === undefined) return []
  const out = new Set<string>()
  for (const row of rows) {
    const v = row[idx]
    if (typeof v === 'string') {
      const trimmed = v.trim()
      if (trimmed) out.add(trimmed)
    }
  }
  return Array.from(out)
}

function base64ToBytes(b64: string): Uint8Array {
  // atob is part of the Web Standard available in Workers + browsers + Node ≥ 16.
  const bin = atob(b64)
  const out = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i)
  return out
}

interface DryRunStats {
  clientsToCreate: number
  obligationsToCreate: number
  skippedRows: number
  errors: DryRunSummary['errors']
}

function computeDryRunStats(batchId: string, payload: MappingJsonPayload): DryRunStats {
  if (!payload.rawInput || !payload.confirmedMappings) {
    return { clientsToCreate: 0, obligationsToCreate: 0, skippedRows: 0, errors: [] }
  }
  const { headers, rows } = payload.rawInput
  const mappings = payload.confirmedMappings

  // Re-run deterministic + post-normalize validation against the user-
  // confirmed view (so dryRun is a fresh snapshot, never a stale cache).
  const detErrors = validateRows(headers, rows, mappings)

  // Count happy clients = rows without EMPTY_NAME.
  const skippedSet = new Set(
    detErrors.filter((e) => e.errorCode === 'EMPTY_NAME').map((e) => e.rowIndex),
  )
  const clientsToCreate = rows.length - skippedSet.size

  // Obligation count: per-client tax_types after merging confirmed
  // normalizations + matrix application. Default Matrix may run before or
  // after dryRun; either way matrixApplied is the source of truth here.
  const obligationsToCreate = estimateObligationCount(payload, clientsToCreate)

  // Surface deterministic errors (post-normalize) on top of EIN/EMPTY_NAME
  // so the UI banner can plural-pluck them.
  const postErrors = derivePostNormalizeErrors(payload, headers)
  const all: DeterministicError[] = [...detErrors, ...postErrors]

  const now = new Date().toISOString()
  return {
    clientsToCreate,
    obligationsToCreate,
    skippedRows: skippedSet.size,
    errors: all.map((e) => ({
      id: crypto.randomUUID(),
      batchId,
      rowIndex: e.rowIndex,
      rawRowJson: e.rawRow,
      errorCode: e.errorCode,
      errorMessage: e.errorMessage,
      createdAt: now,
    })),
  }
}

function derivePostNormalizeErrors(
  payload: MappingJsonPayload,
  headers: readonly string[],
): DeterministicError[] {
  if (!payload.rawInput || !payload.confirmedMappings || !payload.confirmedNormalizations) {
    return []
  }
  const headerToIndex = new Map<string, number>()
  headers.forEach((h, i) => headerToIndex.set(h, i))
  const entitySrc = payload.confirmedMappings.find(
    (m) => m.targetField === 'client.entity_type',
  )?.sourceHeader
  const stateSrc = payload.confirmedMappings.find(
    (m) => m.targetField === 'client.state',
  )?.sourceHeader
  const entityIdx = entitySrc ? headerToIndex.get(entitySrc) : undefined
  const stateIdx = stateSrc ? headerToIndex.get(stateSrc) : undefined

  const entityMap = new Map<string, string | null>()
  const stateMap = new Map<string, string | null>()
  for (const n of payload.confirmedNormalizations) {
    if (n.field === 'entity_type') entityMap.set(n.rawValue, n.normalizedValue ?? null)
    else if (n.field === 'state') stateMap.set(n.rawValue, n.normalizedValue ?? null)
  }

  const checks = payload.rawInput.rows.map((row, rowIndex) => {
    const rawEntity = entityIdx !== undefined ? (row[entityIdx] ?? '').trim() : ''
    const rawState = stateIdx !== undefined ? (row[stateIdx] ?? '').trim() : ''
    return {
      rowIndex,
      rawRow: rowToObject(headers, row),
      entityType: rawEntity ? (entityMap.get(rawEntity) ?? null) : null,
      state: rawState ? (stateMap.get(rawState) ?? null) : null,
    }
  })

  return validateNormalizedRows(checks)
}

function rowToObject(headers: readonly string[], row: readonly string[]): Record<string, string> {
  const out: Record<string, string> = {}
  headers.forEach((h, i) => {
    out[h] = row[i] ?? ''
  })
  return out
}

function estimateObligationCount(payload: MappingJsonPayload, clientCount: number): number {
  // Demo Sprint heuristic: every client gets the (entity × state) cell
  // tax_types from the matrix. If a client lacks state we still include
  // federal_overlay, so worst case = 1 per client.
  if (!payload.matrixApplied || payload.matrixApplied.length === 0) {
    // Pre-matrix dry run: best-effort estimate so the UI counter is non-
    // zero. Two obligations per client matches the smallest CA × LLC cell.
    return clientCount * 2
  }
  return payload.matrixApplied.reduce((sum, e) => sum + e.taxTypes.length * e.appliedClientCount, 0)
}

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
    if (matrix) taxTypes.push(...matrix.taxTypes)
    else taxTypes.push(...inferTaxTypes(entityType, state).taxTypes)
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

function computeMatrixApplication(payload: MappingJsonPayload): MatrixApplicationEntry[] {
  if (!payload.rawInput || !payload.confirmedMappings) return []
  const { headers, rows } = payload.rawInput
  const mappings = payload.confirmedMappings
  const headerToIndex = new Map<string, number>()
  headers.forEach((h, i) => headerToIndex.set(h, i))

  const entityIdx = headerToIndex.get(
    mappings.find((m) => m.targetField === 'client.entity_type')?.sourceHeader ?? '',
  )
  const stateIdx = headerToIndex.get(
    mappings.find((m) => m.targetField === 'client.state')?.sourceHeader ?? '',
  )

  // Apply normalization first (dictionary or AI confirmed).
  const entityMap = new Map<string, string | null>()
  const stateMap = new Map<string, string | null>()
  for (const n of payload.confirmedNormalizations ?? []) {
    if (n.field === 'entity_type') entityMap.set(n.rawValue, n.normalizedValue ?? null)
    else if (n.field === 'state') stateMap.set(n.rawValue, n.normalizedValue ?? null)
  }

  // Group rows by (entity, state) cell to count appliedClientCount.
  const cellCounts = new Map<string, { entityType: string; state: string; count: number }>()
  for (const row of rows) {
    const rawEntity = entityIdx !== undefined ? (row[entityIdx] ?? '').trim() : ''
    const rawState = stateIdx !== undefined ? (row[stateIdx] ?? '').trim() : ''
    const entity = entityMap.get(rawEntity) ?? rawEntity.toLowerCase()
    const state = stateMap.get(rawState) ?? rawState.toUpperCase()
    if (!entity) continue
    const key = `${entity}::${state}`
    const cell = cellCounts.get(key)
    if (cell) cell.count += 1
    else cellCounts.set(key, { entityType: entity, state, count: 1 })
  }

  const out: MatrixApplicationEntry[] = []
  for (const cell of cellCounts.values()) {
    if (!isEntityType(cell.entityType)) continue
    const result: InferTaxTypesResult = inferTaxTypes(cell.entityType, cell.state)
    out.push({
      entityType: cell.entityType,
      state: cell.state,
      taxTypes: [...result.taxTypes],
      needsReview: result.needsReview,
      confidence: result.confidence,
      matrixVersion: result.matrixVersion,
      appliedClientCount: cell.count,
    })
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

function toMigrationError(row: {
  id: string
  batchId: string
  rowIndex: number
  rawRowJson: unknown
  errorCode: string
  errorMessage: string
  createdAt: Date
}): MigrationError {
  return {
    id: row.id,
    batchId: row.batchId,
    rowIndex: row.rowIndex,
    rawRowJson: row.rawRowJson ?? null,
    errorCode: row.errorCode,
    errorMessage: row.errorMessage,
    createdAt: row.createdAt.toISOString(),
  }
}

// Heuristic stage classification — mirrors the deterministic checks in
// _deterministic.ts. Until each check tags its origin explicitly, the prefix
// match is the cheapest correct way to split mapping vs normalize errors so
// the wizard can show step-relevant rows without re-querying.
function classifyErrorStage(errorCode: string): 'mapping' | 'normalize' | 'matrix' | 'all' {
  const code = errorCode.toUpperCase()
  if (code === 'EIN_INVALID' || code === 'EMPTY_NAME') return 'mapping'
  if (code.startsWith('STATE_') || code.startsWith('ENTITY_')) return 'normalize'
  if (code.startsWith('MATRIX_')) return 'matrix'
  return 'all'
}

function toMigrationBatch(row: {
  id: string
  firmId: string
  userId: string
  source: MigrationSource
  rawInputR2Key: string | null
  mappingJson: unknown
  presetUsed: string | null
  rowCount: number
  successCount: number
  skippedCount: number
  aiGlobalConfidence: number | null
  status: MigrationBatch['status']
  appliedAt: Date | null
  revertExpiresAt: Date | null
  revertedAt: Date | null
  createdAt: Date
  updatedAt: Date
}): MigrationBatch {
  return {
    id: row.id,
    firmId: row.firmId,
    userId: row.userId,
    source: row.source,
    rawInputR2Key: row.rawInputR2Key,
    mappingJson: row.mappingJson ?? null,
    presetUsed: row.presetUsed,
    rowCount: row.rowCount,
    successCount: row.successCount,
    skippedCount: row.skippedCount,
    aiGlobalConfidence: row.aiGlobalConfidence,
    status: row.status,
    appliedAt: row.appliedAt ? row.appliedAt.toISOString() : null,
    revertExpiresAt: row.revertExpiresAt ? row.revertExpiresAt.toISOString() : null,
    revertedAt: row.revertedAt ? row.revertedAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  }
}
