import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AI } from '@duedatehq/ai'
import { MigrationService } from './_service'

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

function buildScopedRepo(firmId: string) {
  const batches = new Map<string, MigrationBatchRow>()
  const audits: Array<{ action: string; firmId: string; entityId: string }> = []
  const evidences: Array<{ sourceType: string; firmId: string }> = []
  const mappings: Array<{ batchId: string; sourceHeader: string; targetField: string }> = []
  const normalizations: Array<{ batchId: string; field: string; rawValue: string }> = []
  const errors: Array<{ batchId: string; rowIndex: number; errorCode: string }> = []

  return {
    state: { batches, audits, evidences, mappings, normalizations, errors },
    repo: {
      firmId,
      clients: {} as never,
      obligations: {} as never,
      pulse: {},
      migration: {
        firmId,
        async createBatch(input: {
          id?: string
          userId: string
          source: MigrationBatchRow['source']
          presetUsed?: string | null
        }) {
          const id = input.id ?? crypto.randomUUID()
          const now = new Date()
          const row: MigrationBatchRow = {
            id,
            firmId,
            userId: input.userId,
            source: input.source,
            rawInputR2Key: null,
            mappingJson: null,
            presetUsed: input.presetUsed ?? null,
            rowCount: 0,
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
        async createMappings(
          batchId: string,
          rows: Array<{ sourceHeader: string; targetField: string }>,
        ) {
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
          rows: Array<{ field: string; rawValue: string }>,
        ) {
          const b = batches.get(batchId)
          if (!b || b.firmId !== firmId) throw new Error('cross firm')
          for (const row of rows)
            normalizations.push({ batchId, field: row.field, rawValue: row.rawValue })
          return rows.length
        },
        async createErrors(batchId: string, rows: Array<{ rowIndex: number; errorCode: string }>) {
          const b = batches.get(batchId)
          if (!b || b.firmId !== firmId) throw new Error('cross firm')
          for (const row of rows)
            errors.push({ batchId, rowIndex: row.rowIndex, errorCode: row.errorCode })
          return rows.length
        },
        async listMappings() {
          return []
        },
        async listNormalizations() {
          return []
        },
        async listErrors() {
          return []
        },
        async listByFirm() {
          return Array.from(batches.values()).filter((b) => b.firmId === firmId)
        },
      } as never,
      evidence: {
        firmId,
        async write(input: { sourceType: string }) {
          evidences.push({ sourceType: input.sourceType, firmId })
          return { id: 'evidence-' + evidences.length }
        },
        async writeBatch(inputs: Array<{ sourceType: string }>) {
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
      } as never,
      audit: {
        firmId,
        async write(event: { action: string; entityId: string }) {
          audits.push({ action: event.action, firmId, entityId: event.entityId })
          return { id: 'audit-' + audits.length }
        },
        async writeBatch(events: Array<{ action: string; entityId: string }>) {
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
      } as never,
    } as never,
  }
}

function buildAi(overrides?: Partial<AI>): AI {
  const ai: AI = {
    runPrompt: vi.fn(async () => ({
      result: null,
      refusal: { code: 'AI_UNAVAILABLE', message: 'no key' },
      trace: {
        promptVersion: 'mapper@v1',
        model: 'unknown',
        latencyMs: 0,
        guardResult: 'ai_unavailable',
      },
      model: null,
      confidence: null,
      cost: null,
    })),
    runStreaming: vi.fn(async () => ({
      result: null,
      refusal: { code: 'AI_UNAVAILABLE', message: 'no key' },
      trace: {
        promptVersion: 'mapper@v1',
        model: 'unknown',
        latencyMs: 0,
        guardResult: 'ai_unavailable',
      },
      model: null,
      confidence: null,
      cost: null,
    })),
    ...overrides,
  } as never
  return ai
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
      runPrompt: vi.fn(async () => ({
        result: {
          mappings: [
            { source: 'Client Name', target: 'client.name', confidence: 0.99 },
            { source: 'SSN', target: 'client.ein', confidence: 0.9 },
          ],
        },
        refusal: null,
        trace: {
          promptVersion: 'mapper@v1',
          model: 'gpt-4o-mini',
          latencyMs: 5,
          guardResult: 'ok',
        },
        model: 'gpt-4o-mini',
        confidence: 0.95,
        cost: 0.0001,
      })) as never,
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
      runPrompt: vi.fn(async () => ({
        result: {
          mappings: [
            { source: 'Client Name', target: 'client.name', confidence: 0.99 },
            { source: 'Tax ID', target: 'client.ein', confidence: 0.96 },
          ],
        },
        refusal: null,
        trace: {
          promptVersion: 'mapper@v1',
          model: 'gpt-4o-mini',
          latencyMs: 5,
          guardResult: 'ok',
        },
        model: 'gpt-4o-mini',
        confidence: 0.97,
        cost: 0.0001,
      })) as never,
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
      runPrompt: vi.fn(async () => ({
        result: {
          mappings: [
            { source: 'Client Name', target: 'client.name', confidence: 0.99 },
            { source: 'Tax ID', target: 'client.ein', confidence: 0.96 },
            { source: 'State', target: 'client.state', confidence: 0.97 },
            { source: 'Entity Type', target: 'client.entity_type', confidence: 0.94 },
          ],
        },
        refusal: null,
        trace: {
          promptVersion: 'mapper@v1',
          model: 'gpt-4o-mini',
          latencyMs: 5,
          guardResult: 'ok',
        },
        model: 'gpt-4o-mini',
        confidence: 0.97,
        cost: 0.0001,
      })) as never,
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
})

beforeEach(() => {
  vi.clearAllMocks()
})
