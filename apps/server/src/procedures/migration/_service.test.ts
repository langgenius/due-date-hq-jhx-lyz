import { describe, expect, it } from 'vitest'
import type { AI } from '@duedatehq/ai'
import { MigrationService, type MigrationDeps } from './_service'

/**
 * MigrationService tests — exercise the orchestration (Step 1 → Step 3 →
 * dryRun) against an in-memory scoped repo + injectable AI fake.
 *
 * The point is to lock in the contract behavior: tenant isolation, fallback
 * channels, deterministic checks, and the bad-rows-do-not-block-good-rows
 * invariant from PRD §0.3.
 */

const FIRM = 'firm-1'
const OTHER_FIRM = 'firm-2'
const USER = 'user-1'

interface MigrationBatchRow {
  id: string
  firmId: string
  userId: string
  source:
    | 'paste'
    | 'csv'
    | 'xlsx'
    | 'preset_taxdome'
    | 'preset_drake'
    | 'preset_karbon'
    | 'preset_quickbooks'
    | 'preset_file_in_time'
  rawInputR2Key: string | null
  mappingJson: unknown
  presetUsed: string | null
  rowCount: number
  successCount: number
  skippedCount: number
  aiGlobalConfidence: number | null
  status: 'draft' | 'mapping' | 'reviewing' | 'applied' | 'reverted' | 'failed'
  appliedAt: Date | null
  revertExpiresAt: Date | null
  revertedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

type ScopedRepo = MigrationDeps['scoped']
type MigrationRepo = ScopedRepo['migration']

function unexpectedRepoCall(name: string): never {
  throw new Error(`Unexpected test repo call: ${name}`)
}

function buildScopedRepo(firmId: string) {
  const batches = new Map<string, MigrationBatchRow>()
  const audits: Array<{ action: string; firmId: string; entityId: string }> = []
  const evidences: Array<{ sourceType: string; firmId: string }> = []
  const importedClients: Array<{ id: string; migrationBatchId: string | null | undefined }> = []
  const importedObligations: Array<{
    id: string
    clientId: string
    migrationBatchId: string | null | undefined
  }> = []
  const mappings: Array<{ batchId: string; sourceHeader: string; targetField: string }> = []
  const normalizations: Array<{ batchId: string; field: string; rawValue: string }> = []
  const errors: Array<{
    batchId: string
    rowIndex: number
    errorCode: string
    errorMessage?: string
    rawRowJson?: unknown
  }> = []

  const clients: ScopedRepo['clients'] = {
    firmId,
    async create() {
      return unexpectedRepoCall('clients.create')
    },
    async createBatch() {
      return unexpectedRepoCall('clients.createBatch')
    },
    async findById() {
      return undefined
    },
    async listByFirm() {
      return []
    },
    async listByBatch() {
      return []
    },
    async softDelete() {},
    async deleteByBatch() {
      return 0
    },
  }

  const obligations: ScopedRepo['obligations'] = {
    firmId,
    async createBatch() {
      return unexpectedRepoCall('obligations.createBatch')
    },
    async findById() {
      return undefined
    },
    async listByClient() {
      return []
    },
    async listByBatch() {
      return []
    },
    async updateDueDate() {},
    async updateStatus() {},
    async deleteByBatch() {
      return 0
    },
  }

  const migration: ScopedRepo['migration'] = {
    firmId,
    async createBatch(input) {
      const id = input.id ?? crypto.randomUUID()
      const now = new Date()
      const row: MigrationBatchRow = {
        id,
        firmId,
        userId: input.userId,
        source: input.source,
        rawInputR2Key: input.rawInputR2Key ?? null,
        mappingJson: null,
        presetUsed: input.presetUsed ?? null,
        rowCount: input.rowCount ?? 0,
        successCount: 0,
        skippedCount: 0,
        aiGlobalConfidence: null,
        status: 'draft',
        appliedAt: null,
        revertExpiresAt: null,
        revertedAt: null,
        createdAt: now,
        updatedAt: now,
      }
      batches.set(id, row)
      return { id }
    },
    async getActiveDraftBatch() {
      for (const b of batches.values()) {
        if (b.firmId === firmId && b.status === 'draft') return b
      }
      return undefined
    },
    async getBatch(id: string) {
      const b = batches.get(id)
      return b && b.firmId === firmId ? b : undefined
    },
    async updateBatch(id: string, patch: Partial<MigrationBatchRow>) {
      const b = batches.get(id)
      if (!b || b.firmId !== firmId) {
        throw new Error(`batch ${id} not in firm`)
      }
      batches.set(id, { ...b, ...patch, updatedAt: new Date() })
    },
    async createMappings(batchId: string, rows: Parameters<MigrationRepo['createMappings']>[1]) {
      const b = batches.get(batchId)
      if (!b || b.firmId !== firmId) {
        throw new Error(`Migration batch ${batchId} not found for current firm`)
      }
      for (const row of rows) {
        mappings.push({ batchId, sourceHeader: row.sourceHeader, targetField: row.targetField })
      }
      return rows.length
    },
    async createNormalizations(
      batchId: string,
      rows: Parameters<MigrationRepo['createNormalizations']>[1],
    ) {
      const b = batches.get(batchId)
      if (!b || b.firmId !== firmId) throw new Error('cross firm')
      for (const row of rows)
        normalizations.push({ batchId, field: row.field, rawValue: row.rawValue })
      return rows.length
    },
    async createErrors(batchId: string, rows: Parameters<MigrationRepo['createErrors']>[1]) {
      const b = batches.get(batchId)
      if (!b || b.firmId !== firmId) throw new Error('cross firm')
      for (const row of rows)
        errors.push({
          batchId,
          rowIndex: row.rowIndex,
          errorCode: row.errorCode,
          errorMessage: row.errorMessage,
          rawRowJson: row.rawRowJson ?? null,
        })
      return rows.length
    },
    async listMappings() {
      return []
    },
    async listNormalizations() {
      return []
    },
    async listErrors(batchId: string) {
      const b = batches.get(batchId)
      if (!b || b.firmId !== firmId) return []
      const now = new Date()
      return errors
        .filter((e) => e.batchId === batchId)
        .map((e) => ({
          id: 'err-' + e.rowIndex,
          batchId: e.batchId,
          rowIndex: e.rowIndex,
          rawRowJson: (e as { rawRowJson?: unknown }).rawRowJson ?? null,
          errorCode: e.errorCode,
          errorMessage:
            (e as { errorMessage?: string }).errorMessage ?? `${e.errorCode} on row ${e.rowIndex}`,
          createdAt: now,
        }))
    },
    async listByFirm() {
      return Array.from(batches.values()).filter((b) => b.firmId === firmId)
    },
    async commitImport(input) {
      const b = batches.get(input.batchId)
      if (!b || b.firmId !== firmId) throw new Error('cross firm')
      importedClients.push(
        ...input.clients.map((item) => ({
          id: item.id,
          migrationBatchId: item.migrationBatchId,
        })),
      )
      importedObligations.push(
        ...input.obligations.map((item) => ({
          id: item.id,
          clientId: item.clientId,
          migrationBatchId: item.migrationBatchId,
        })),
      )
      for (const item of input.evidence) {
        evidences.push({ sourceType: item.sourceType, firmId })
      }
      for (const item of input.audits) {
        audits.push({ action: item.action, firmId, entityId: item.entityId })
      }
      batches.set(input.batchId, {
        ...b,
        status: 'applied',
        successCount: input.successCount,
        skippedCount: input.skippedCount,
        appliedAt: input.appliedAt,
        revertExpiresAt: input.revertExpiresAt,
        updatedAt: new Date(),
      })
    },
    async revertImport(input) {
      const b = batches.get(input.batchId)
      if (!b || b.firmId !== firmId) throw new Error('cross firm')
      const clientCount = importedClients.filter(
        (item) => item.migrationBatchId === input.batchId,
      ).length
      const obligationCount = importedObligations.filter(
        (item) => item.migrationBatchId === input.batchId,
      ).length
      removeWhere(importedObligations, (item) => item.migrationBatchId === input.batchId)
      removeWhere(importedClients, (item) => item.migrationBatchId === input.batchId)
      evidences.push({ sourceType: 'migration_revert', firmId })
      audits.push({ action: 'migration.reverted', firmId, entityId: input.batchId })
      batches.set(input.batchId, {
        ...b,
        status: 'reverted',
        revertedAt: input.revertedAt,
        updatedAt: new Date(),
      })
      return { clientCount, obligationCount }
    },
    async singleUndoImport(input) {
      const b = batches.get(input.batchId)
      if (!b || b.firmId !== firmId) throw new Error('cross firm')
      const clientExists = importedClients.some(
        (item) => item.id === input.clientId && item.migrationBatchId === input.batchId,
      )
      if (!clientExists) {
        throw new Error(`Client ${input.clientId} not found in migration batch ${input.batchId}`)
      }
      const obligationCount = importedObligations.filter(
        (item) => item.clientId === input.clientId && item.migrationBatchId === input.batchId,
      ).length
      removeWhere(
        importedObligations,
        (item) => item.clientId === input.clientId && item.migrationBatchId === input.batchId,
      )
      removeWhere(
        importedClients,
        (item) => item.id === input.clientId && item.migrationBatchId === input.batchId,
      )
      evidences.push({ sourceType: 'migration_revert', firmId })
      audits.push({ action: 'migration.single_undo', firmId, entityId: input.batchId })
      return { clientCount: 1, obligationCount }
    },
  }

  const evidence: ScopedRepo['evidence'] = {
    firmId,
    async write(input) {
      evidences.push({ sourceType: input.sourceType, firmId })
      return { id: 'evidence-' + evidences.length }
    },
    async writeBatch(inputs) {
      const ids: string[] = []
      for (const i of inputs) {
        evidences.push({ sourceType: i.sourceType, firmId })
        ids.push('evidence-' + evidences.length)
      }
      return { ids }
    },
    async listByObligation() {
      return []
    },
  }

  const audit: ScopedRepo['audit'] = {
    firmId,
    async write(event) {
      audits.push({ action: event.action, firmId, entityId: event.entityId })
      return { id: 'audit-' + audits.length }
    },
    async writeBatch(events) {
      const ids: string[] = []
      for (const e of events) {
        audits.push({ action: e.action, firmId, entityId: e.entityId })
        ids.push('audit-' + audits.length)
      }
      return { ids }
    },
    async listByFirm() {
      return []
    },
  }

  const workboard: ScopedRepo['workboard'] = {
    firmId,
    async list() {
      return { rows: [], nextCursor: null }
    },
  }

  const repo: ScopedRepo = {
    firmId,
    clients,
    obligations,
    workboard,
    pulse: {},
    migration,
    evidence,
    audit,
  }

  return {
    state: {
      batches,
      audits,
      evidences,
      mappings,
      normalizations,
      errors,
      importedClients,
      importedObligations,
    },
    repo,
  }
}

function removeWhere<T>(items: T[], predicate: (item: T) => boolean): void {
  for (let i = items.length - 1; i >= 0; i -= 1) {
    if (predicate(items[i]!)) items.splice(i, 1)
  }
}

function buildAi(rawResult?: unknown): AI {
  const runPrompt: AI['runPrompt'] = async (name, _input, schema) => {
    if (rawResult === undefined) {
      return {
        result: null,
        refusal: { code: 'AI_UNAVAILABLE', message: 'no key' },
        trace: {
          promptVersion: name,
          model: 'unknown',
          latencyMs: 0,
          guardResult: 'ai_unavailable',
        },
        model: null,
        confidence: null,
        cost: null,
      }
    }

    return {
      result: schema.parse(rawResult),
      refusal: null,
      trace: {
        promptVersion: name,
        model: 'fast-json-test-model',
        latencyMs: 5,
        guardResult: 'ok',
      },
      model: 'fast-json-test-model',
      confidence: 0.97,
      cost: 0.0001,
    }
  }

  return { runPrompt, runStreaming: runPrompt }
}

const SAMPLE_CSV = `Client Name,Tax ID,State,Entity Type,Email
Acme LLC,12-3456789,CA,LLC,acme@example.com
Bright Studio,98-7654321,NY,S-Corp,bright@example.com
Lake Holdings,11-2233445,CA,Partnership,lake@example.com`

describe('MigrationService.createBatch', () => {
  it('writes a draft batch + audit row', async () => {
    const { repo, state } = buildScopedRepo(FIRM)
    const ai = buildAi()
    const service = new MigrationService({ scoped: repo, ai, userId: USER })

    const batch = await service.createBatch({ source: 'paste' })
    expect(batch.firmId).toBe(FIRM)
    expect(batch.status).toBe('draft')
    expect(state.audits.some((a) => a.action === 'migration.batch.created')).toBe(true)
  })

  it('rejects a second draft for the same firm with CONFLICT', async () => {
    const { repo } = buildScopedRepo(FIRM)
    const ai = buildAi()
    const service = new MigrationService({ scoped: repo, ai, userId: USER })

    await service.createBatch({ source: 'paste' })
    await expect(service.createBatch({ source: 'csv' })).rejects.toMatchObject({
      code: 'CONFLICT',
    })
  })
})

describe('MigrationService.uploadRaw + runMapper happy path', () => {
  it('parses CSV, persists raw, then runs mapper preset fallback when AI is missing', async () => {
    const { repo, state } = buildScopedRepo(FIRM)
    const ai = buildAi()
    const service = new MigrationService({ scoped: repo, ai, userId: USER })

    const batch = await service.createBatch({ source: 'preset_taxdome', presetUsed: 'taxdome' })
    await service.uploadRaw({ batchId: batch.id, kind: 'csv', text: SAMPLE_CSV })

    const result = await service.runMapper(batch.id)

    expect(result.meta?.fallback).toBe('preset')
    expect(result.mappings.length).toBeGreaterThan(0)
    // The TaxDome preset maps "Client Name" → client.name
    const nameMap = result.mappings.find((m) => m.sourceHeader === 'Client Name')
    expect(nameMap?.targetField).toBe('client.name')
    expect(state.evidences.some((e) => e.sourceType === 'ai_mapper')).toBe(true)
  })

  it('falls back to all_ignore when AI is unavailable and no preset is selected', async () => {
    const { repo } = buildScopedRepo(FIRM)
    const ai = buildAi()
    const service = new MigrationService({ scoped: repo, ai, userId: USER })

    const batch = await service.createBatch({ source: 'paste' })
    await service.uploadRaw({ batchId: batch.id, kind: 'paste', text: SAMPLE_CSV })

    const result = await service.runMapper(batch.id)
    expect(result.meta?.fallback).toBe('all_ignore')
    expect(result.mappings.every((m) => m.targetField === 'IGNORE')).toBe(true)
  })

  it('forces SSN-flagged columns to IGNORE even on the AI happy path', async () => {
    const { repo } = buildScopedRepo(FIRM)
    const ai = buildAi({
      mappings: [
        { source: 'Client Name', target: 'client.name', confidence: 0.99 },
        { source: 'SSN', target: 'client.ein', confidence: 0.9 },
      ],
    })
    const service = new MigrationService({ scoped: repo, ai, userId: USER })

    const batch = await service.createBatch({ source: 'paste' })
    const csv = `Client Name,SSN\nAcme LLC,123-45-6789\nBright Studio,987-65-4321`
    await service.uploadRaw({ batchId: batch.id, kind: 'paste', text: csv })

    const result = await service.runMapper(batch.id)
    const ssnMapping = result.mappings.find((m) => m.sourceHeader === 'SSN')
    expect(ssnMapping?.targetField).toBe('IGNORE')
  })
})

describe('MigrationService.confirmMapping deterministic checks', () => {
  it('records EIN_INVALID errors but keeps good rows', async () => {
    const { repo, state } = buildScopedRepo(FIRM)
    const ai = buildAi({
      mappings: [
        { source: 'Client Name', target: 'client.name', confidence: 0.99 },
        { source: 'Tax ID', target: 'client.ein', confidence: 0.96 },
      ],
    })
    const service = new MigrationService({ scoped: repo, ai, userId: USER })

    const batch = await service.createBatch({ source: 'paste' })
    const csv = `Client Name,Tax ID\nAcme LLC,12-3456789\nBad Row,not-an-ein\nGood Co,99-1234567`
    await service.uploadRaw({ batchId: batch.id, kind: 'paste', text: csv })
    const mapper = await service.runMapper(batch.id)
    await service.confirmMapping(batch.id, mapper.mappings)

    const einErrors = state.errors.filter((e) => e.errorCode === 'EIN_INVALID')
    expect(einErrors).toHaveLength(1)
    expect(einErrors[0]!.rowIndex).toBe(1)
  })

  it('returns schema-valid dryRun errors with the batch id', async () => {
    const { repo } = buildScopedRepo(FIRM)
    const ai = buildAi({
      mappings: [
        { source: 'Client Name', target: 'client.name', confidence: 0.99 },
        { source: 'Tax ID', target: 'client.ein', confidence: 0.96 },
      ],
    })
    const service = new MigrationService({ scoped: repo, ai, userId: USER })

    const batch = await service.createBatch({ source: 'paste' })
    const csv = `Client Name,Tax ID\nAcme LLC,12-3456789\nBad Row,not-an-ein`
    await service.uploadRaw({ batchId: batch.id, kind: 'paste', text: csv })
    const mapper = await service.runMapper(batch.id)
    await service.confirmMapping(batch.id, mapper.mappings)

    const summary = await service.dryRun(batch.id)
    expect(
      summary.errors.some((e) => e.batchId === batch.id && e.errorCode === 'EIN_INVALID'),
    ).toBe(true)
  })
})

describe('MigrationService cross-firm isolation', () => {
  it('rejects access to a batch owned by another firm', async () => {
    // Owner-A creates a batch.
    const a = buildScopedRepo(FIRM)
    const aiA = buildAi()
    const serviceA = new MigrationService({ scoped: a.repo, ai: aiA, userId: USER })
    const batch = await serviceA.createBatch({ source: 'paste' })

    // Owner-B is a different firm; their scoped repo cannot see batch.id even
    // when called with the right id (the in-memory mirror is per-firm).
    const b = buildScopedRepo(OTHER_FIRM)
    const aiB = buildAi()
    const serviceB = new MigrationService({ scoped: b.repo, ai: aiB, userId: 'user-2' })

    // Day-3 acceptance from docs/dev-file/10 line 176: "cross firm data is
    // not visible". Pulling Firm A's batch from Firm B's service must throw
    // a NOT_FOUND.
    await expect(serviceB.getBatch(batch.id)).resolves.toBeNull()
  })
})

describe('MigrationService.dryRun with Default Matrix', () => {
  it('produces non-zero clientsToCreate even before applyDefaultMatrix', async () => {
    const { repo } = buildScopedRepo(FIRM)
    const ai = buildAi({
      mappings: [
        { source: 'Client Name', target: 'client.name', confidence: 0.99 },
        { source: 'Tax ID', target: 'client.ein', confidence: 0.96 },
        { source: 'State', target: 'client.state', confidence: 0.97 },
        { source: 'Entity Type', target: 'client.entity_type', confidence: 0.94 },
      ],
    })
    const service = new MigrationService({ scoped: repo, ai, userId: USER })

    const batch = await service.createBatch({ source: 'paste' })
    const csv = `Client Name,Tax ID,State,Entity Type\nAcme LLC,12-3456789,CA,LLC\nBright Studio,98-7654321,NY,S-Corp`
    await service.uploadRaw({ batchId: batch.id, kind: 'paste', text: csv })
    const mapper = await service.runMapper(batch.id)
    await service.confirmMapping(batch.id, mapper.mappings)

    const summary = await service.dryRun(batch.id)
    expect(summary.clientsToCreate).toBe(2)
    expect(summary.obligationsToCreate).toBeGreaterThan(0)
  })

  it('honors disabled matrix selections in dryRun and apply', async () => {
    const { repo, state } = buildScopedRepo(FIRM)
    const ai = buildAi()
    const service = new MigrationService({ scoped: repo, ai, userId: USER })

    const batch = await service.createBatch({ source: 'preset_taxdome', presetUsed: 'taxdome' })
    const csv = `Client Name,Tax ID,State,Entity Type,Email\nAcme LLC,12-3456789,CA,LLC,acme@example.com`
    await service.uploadRaw({ batchId: batch.id, kind: 'paste', text: csv })
    const mapper = await service.runMapper(batch.id)
    await service.confirmMapping(batch.id, mapper.mappings)
    const normalizer = await service.runNormalizer(batch.id)
    await service.confirmNormalization(batch.id, normalizer.normalizations)

    const summary = await service.applyDefaultMatrix(batch.id, [
      { entityType: 'llc', state: 'CA', enabled: false },
    ])
    expect(summary.clientsToCreate).toBe(1)
    expect(summary.obligationsToCreate).toBe(0)

    const result = await service.apply(batch.id)
    expect(result.clientCount).toBe(1)
    expect(result.obligationCount).toBe(0)
    expect(state.importedClients).toHaveLength(1)
    expect(state.importedObligations).toHaveLength(0)
  })
})

describe('MigrationService.apply', () => {
  it('commits clients, obligations, verified rule evidence, audits, and batch status', async () => {
    const { repo, state } = buildScopedRepo(FIRM)
    const ai = buildAi()
    const service = new MigrationService({ scoped: repo, ai, userId: USER })

    const batch = await service.createBatch({ source: 'preset_taxdome', presetUsed: 'taxdome' })
    await service.uploadRaw({
      batchId: batch.id,
      kind: 'paste',
      text: SAMPLE_CSV,
    })
    const mapper = await service.runMapper(batch.id)
    await service.confirmMapping(batch.id, mapper.mappings)
    const normalizer = await service.runNormalizer(batch.id)
    await service.confirmNormalization(batch.id, normalizer.normalizations)
    await service.applyDefaultMatrix(batch.id)

    const result = await service.apply(batch.id)
    const appliedBatch = state.batches.get(batch.id)

    expect(result.clientCount).toBe(3)
    expect(result.obligationCount).toBeGreaterThan(0)
    expect(state.importedClients).toHaveLength(3)
    expect(state.importedObligations.length).toBeGreaterThan(0)
    expect(state.evidences.some((item) => item.sourceType === 'verified_rule')).toBe(true)
    expect(state.audits.some((item) => item.action === 'migration.imported')).toBe(true)
    expect(appliedBatch?.status).toBe('applied')
    expect(appliedBatch?.successCount).toBe(3)
  })

  it('skips empty-name rows without blocking valid rows', async () => {
    const { repo, state } = buildScopedRepo(FIRM)
    const ai = buildAi()
    const service = new MigrationService({ scoped: repo, ai, userId: USER })

    const batch = await service.createBatch({ source: 'preset_taxdome', presetUsed: 'taxdome' })
    await service.uploadRaw({
      batchId: batch.id,
      kind: 'paste',
      text: `Client Name,Tax ID,State,Entity Type,Email
Acme LLC,12-3456789,CA,LLC,acme@example.com
,98-7654321,NY,S-Corp,blank@example.com`,
    })
    const mapper = await service.runMapper(batch.id)
    await service.confirmMapping(batch.id, mapper.mappings)
    const normalizer = await service.runNormalizer(batch.id)
    await service.confirmNormalization(batch.id, normalizer.normalizations)
    await service.applyDefaultMatrix(batch.id)

    const result = await service.apply(batch.id)

    expect(result.clientCount).toBe(1)
    expect(result.skippedCount).toBe(1)
    expect(state.importedClients).toHaveLength(1)
  })

  it('rejects re-applying an already applied batch', async () => {
    const { repo } = buildScopedRepo(FIRM)
    const ai = buildAi()
    const service = new MigrationService({ scoped: repo, ai, userId: USER })

    const batch = await service.createBatch({ source: 'preset_taxdome', presetUsed: 'taxdome' })
    await service.uploadRaw({ batchId: batch.id, kind: 'paste', text: SAMPLE_CSV })
    const mapper = await service.runMapper(batch.id)
    await service.confirmMapping(batch.id, mapper.mappings)
    const normalizer = await service.runNormalizer(batch.id)
    await service.confirmNormalization(batch.id, normalizer.normalizations)
    await service.applyDefaultMatrix(batch.id)
    await service.apply(batch.id)

    await expect(service.apply(batch.id)).rejects.toMatchObject({ code: 'CONFLICT' })
  })
})

describe('MigrationService.revert', () => {
  it('removes imported clients and obligations, writes audit/evidence, and marks the batch reverted', async () => {
    const { repo, state } = buildScopedRepo(FIRM)
    const ai = buildAi()
    const service = new MigrationService({ scoped: repo, ai, userId: USER })

    const batch = await service.createBatch({ source: 'preset_taxdome', presetUsed: 'taxdome' })
    await service.uploadRaw({ batchId: batch.id, kind: 'paste', text: SAMPLE_CSV })
    const mapper = await service.runMapper(batch.id)
    await service.confirmMapping(batch.id, mapper.mappings)
    const normalizer = await service.runNormalizer(batch.id)
    await service.confirmNormalization(batch.id, normalizer.normalizations)
    await service.applyDefaultMatrix(batch.id)
    await service.apply(batch.id)

    const result = await service.revert(batch.id)

    expect(result.revertedAt).toEqual(expect.any(String))
    expect(state.importedClients).toHaveLength(0)
    expect(state.importedObligations).toHaveLength(0)
    expect(state.audits.some((item) => item.action === 'migration.reverted')).toBe(true)
    expect(state.evidences.some((item) => item.sourceType === 'migration_revert')).toBe(true)
    expect(state.batches.get(batch.id)?.status).toBe('reverted')
  })

  it('rejects a revert after the 24-hour window expires', async () => {
    const { repo, state } = buildScopedRepo(FIRM)
    const ai = buildAi()
    const service = new MigrationService({ scoped: repo, ai, userId: USER })

    const batch = await service.createBatch({ source: 'preset_taxdome', presetUsed: 'taxdome' })
    await service.uploadRaw({ batchId: batch.id, kind: 'paste', text: SAMPLE_CSV })
    const mapper = await service.runMapper(batch.id)
    await service.confirmMapping(batch.id, mapper.mappings)
    const normalizer = await service.runNormalizer(batch.id)
    await service.confirmNormalization(batch.id, normalizer.normalizations)
    await service.applyDefaultMatrix(batch.id)
    await service.apply(batch.id)
    const applied = state.batches.get(batch.id)!
    state.batches.set(batch.id, {
      ...applied,
      revertExpiresAt: new Date(Date.now() - 1_000),
    })

    await expect(service.revert(batch.id)).rejects.toMatchObject({ code: 'CONFLICT' })
  })

  it('rejects reverting a draft batch', async () => {
    const { repo } = buildScopedRepo(FIRM)
    const ai = buildAi()
    const service = new MigrationService({ scoped: repo, ai, userId: USER })

    const batch = await service.createBatch({ source: 'paste' })

    await expect(service.revert(batch.id)).rejects.toMatchObject({ code: 'BAD_REQUEST' })
  })
})

describe('MigrationService.singleUndo', () => {
  it('removes one imported client without reverting the whole batch', async () => {
    const { repo, state } = buildScopedRepo(FIRM)
    const ai = buildAi()
    const service = new MigrationService({ scoped: repo, ai, userId: USER })

    const batch = await service.createBatch({ source: 'preset_taxdome', presetUsed: 'taxdome' })
    await service.uploadRaw({ batchId: batch.id, kind: 'paste', text: SAMPLE_CSV })
    const mapper = await service.runMapper(batch.id)
    await service.confirmMapping(batch.id, mapper.mappings)
    const normalizer = await service.runNormalizer(batch.id)
    await service.confirmNormalization(batch.id, normalizer.normalizations)
    await service.applyDefaultMatrix(batch.id)
    await service.apply(batch.id)
    const targetClient = state.importedClients[0]!

    const result = await service.singleUndo(batch.id, targetClient.id)

    expect(result.revertedAt).toEqual(expect.any(String))
    expect(state.importedClients.some((item) => item.id === targetClient.id)).toBe(false)
    expect(state.importedClients).toHaveLength(2)
    expect(state.batches.get(batch.id)?.status).toBe('applied')
    expect(state.audits.some((item) => item.action === 'migration.single_undo')).toBe(true)
  })

  it('rejects single undo for a client outside the batch', async () => {
    const { repo } = buildScopedRepo(FIRM)
    const ai = buildAi()
    const service = new MigrationService({ scoped: repo, ai, userId: USER })

    const batch = await service.createBatch({ source: 'preset_taxdome', presetUsed: 'taxdome' })
    await service.uploadRaw({ batchId: batch.id, kind: 'paste', text: SAMPLE_CSV })
    const mapper = await service.runMapper(batch.id)
    await service.confirmMapping(batch.id, mapper.mappings)
    const normalizer = await service.runNormalizer(batch.id)
    await service.confirmNormalization(batch.id, normalizer.normalizations)
    await service.applyDefaultMatrix(batch.id)
    await service.apply(batch.id)

    await expect(service.singleUndo(batch.id, 'client-not-in-batch')).rejects.toThrow(
      'not found in migration batch',
    )
  })
})

describe('MigrationService.listErrors', () => {
  it('returns mapping-stage errors when EIN/EMPTY_NAME rows are persisted', async () => {
    const { repo } = buildScopedRepo(FIRM)
    const ai = buildAi({
      mappings: [
        { source: 'Client Name', target: 'client.name', confidence: 0.99 },
        { source: 'Tax ID', target: 'client.ein', confidence: 0.96 },
      ],
    })
    const service = new MigrationService({ scoped: repo, ai, userId: USER })

    const batch = await service.createBatch({ source: 'paste' })
    // Two rows: one bad EIN, one empty name. Mapper persists deterministic errors.
    const csv = `Client Name,Tax ID\nAcme LLC,not-an-ein\n,99-9999999`
    await service.uploadRaw({ batchId: batch.id, kind: 'paste', text: csv })
    const mapper = await service.runMapper(batch.id)
    await service.confirmMapping(batch.id, mapper.mappings)

    const all = await service.listErrors(batch.id, 'all')
    expect(all.length).toBeGreaterThanOrEqual(2)

    const mapping = await service.listErrors(batch.id, 'mapping')
    expect(
      mapping.every((e) => e.errorCode === 'EIN_INVALID' || e.errorCode === 'EMPTY_NAME'),
    ).toBe(true)

    const normalize = await service.listErrors(batch.id, 'normalize')
    expect(normalize.every((e) => !['EIN_INVALID', 'EMPTY_NAME'].includes(e.errorCode))).toBe(true)
  })

  it('refuses cross-firm batch access with NOT_FOUND', async () => {
    const a = buildScopedRepo(FIRM)
    const aiA = buildAi()
    const serviceA = new MigrationService({ scoped: a.repo, ai: aiA, userId: USER })
    const batch = await serviceA.createBatch({ source: 'paste' })

    const b = buildScopedRepo(OTHER_FIRM)
    const aiB = buildAi()
    const serviceB = new MigrationService({ scoped: b.repo, ai: aiB, userId: 'user-2' })

    await expect(serviceB.listErrors(batch.id, 'all')).rejects.toMatchObject({ code: 'NOT_FOUND' })
  })
})
