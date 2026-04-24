import { and, desc, eq } from 'drizzle-orm'
import type { Db } from '../client'
import {
  migrationBatch,
  migrationError,
  migrationMapping,
  migrationNormalization,
  type MigrationBatch,
  type MigrationBatchStatus,
  type MigrationError,
  type MigrationMapping,
  type MigrationNormalization,
  type MigrationSource,
  type NewMigrationError,
  type NewMigrationMapping,
  type NewMigrationNormalization,
} from '../schema/migration'

// migration_batch has 17 columns → 5/batch.
const BATCH_COLS = 17
const BATCH_WRITE_SIZE = Math.floor(100 / BATCH_COLS) // = 5
// migration_mapping has 9 columns → 11/batch.
const MAPPING_COLS = 9
const MAPPING_BATCH_SIZE = Math.floor(100 / MAPPING_COLS) // = 11
// migration_normalization has 9 columns → 11/batch.
const NORM_BATCH_SIZE = Math.floor(100 / 9) // = 11
// migration_error has 7 columns → 14/batch.
const ERROR_BATCH_SIZE = Math.floor(100 / 7) // = 14

export interface CreateBatchInput {
  id?: string
  userId: string
  source: MigrationSource
  rawInputR2Key?: string | null
  presetUsed?: string | null
  rowCount?: number
}

export interface UpdateBatchPatch {
  status?: MigrationBatchStatus
  mappingJson?: unknown
  presetUsed?: string | null
  rowCount?: number
  successCount?: number
  skippedCount?: number
  aiGlobalConfidence?: number | null
  appliedAt?: Date
  revertExpiresAt?: Date
  revertedAt?: Date
}

export function makeMigrationRepo(db: Db, firmId: string) {
  async function assertBatchInFirm(batchId: string): Promise<void> {
    const rows = await db
      .select({ id: migrationBatch.id })
      .from(migrationBatch)
      .where(and(eq(migrationBatch.firmId, firmId), eq(migrationBatch.id, batchId)))
      .limit(1)

    if (!rows[0]) {
      throw new Error(`Migration batch ${batchId} not found for current firm`)
    }
  }

  return {
    firmId,

    async createBatch(input: CreateBatchInput): Promise<{ id: string }> {
      const id = input.id ?? crypto.randomUUID()
      await db.insert(migrationBatch).values({
        id,
        firmId,
        userId: input.userId,
        source: input.source,
        rawInputR2Key: input.rawInputR2Key ?? null,
        presetUsed: input.presetUsed ?? null,
        rowCount: input.rowCount ?? 0,
      })
      return { id }
    },

    async updateBatch(id: string, patch: UpdateBatchPatch): Promise<void> {
      await db
        .update(migrationBatch)
        .set(patch)
        .where(and(eq(migrationBatch.firmId, firmId), eq(migrationBatch.id, id)))
    },

    async getBatch(id: string): Promise<MigrationBatch | undefined> {
      const rows = await db
        .select()
        .from(migrationBatch)
        .where(and(eq(migrationBatch.firmId, firmId), eq(migrationBatch.id, id)))
        .limit(1)
      return rows[0]
    },

    /**
     * Return the single active draft batch for this firm (0 or 1 due to
     * the partial unique index uq_mb_firm_draft). Used by the wizard to
     * resume or by the concurrency guard to refuse a second opener
     * (PRD §3.6.6).
     */
    async getActiveDraftBatch(): Promise<MigrationBatch | undefined> {
      const rows = await db
        .select()
        .from(migrationBatch)
        .where(and(eq(migrationBatch.firmId, firmId), eq(migrationBatch.status, 'draft')))
        .orderBy(desc(migrationBatch.createdAt))
        .limit(1)
      return rows[0]
    },

    async listByFirm(opts: { limit?: number } = {}): Promise<MigrationBatch[]> {
      const q = db
        .select()
        .from(migrationBatch)
        .where(eq(migrationBatch.firmId, firmId))
        .orderBy(desc(migrationBatch.createdAt))
      return opts.limit ? await q.limit(opts.limit) : await q
    },

    async listMappings(batchId: string): Promise<MigrationMapping[]> {
      const rows = await db
        .select()
        .from(migrationMapping)
        .innerJoin(migrationBatch, eq(migrationMapping.batchId, migrationBatch.id))
        .where(and(eq(migrationBatch.firmId, firmId), eq(migrationMapping.batchId, batchId)))

      return rows.map((row) => row.migration_mapping)
    },

    async listNormalizations(batchId: string): Promise<MigrationNormalization[]> {
      const rows = await db
        .select()
        .from(migrationNormalization)
        .innerJoin(migrationBatch, eq(migrationNormalization.batchId, migrationBatch.id))
        .where(and(eq(migrationBatch.firmId, firmId), eq(migrationNormalization.batchId, batchId)))

      return rows.map((row) => row.migration_normalization)
    },

    async listErrors(batchId: string): Promise<MigrationError[]> {
      const rows = await db
        .select()
        .from(migrationError)
        .innerJoin(migrationBatch, eq(migrationError.batchId, migrationBatch.id))
        .where(and(eq(migrationBatch.firmId, firmId), eq(migrationError.batchId, batchId)))

      return rows.map((row) => row.migration_error)
    },

    async createMappings(
      batchId: string,
      mappings: Array<Omit<NewMigrationMapping, 'id' | 'batchId' | 'createdAt'>>,
    ): Promise<number> {
      if (mappings.length === 0) return 0
      await assertBatchInFirm(batchId)
      const rows = mappings.map((m) => ({
        id: crypto.randomUUID(),
        batchId,
        ...m,
      }))
      const writes = []
      for (let i = 0; i < rows.length; i += MAPPING_BATCH_SIZE) {
        writes.push(db.insert(migrationMapping).values(rows.slice(i, i + MAPPING_BATCH_SIZE)))
      }
      await Promise.all(writes)
      return rows.length
    },

    async createNormalizations(
      batchId: string,
      normalizations: Array<Omit<NewMigrationNormalization, 'id' | 'batchId' | 'createdAt'>>,
    ): Promise<number> {
      if (normalizations.length === 0) return 0
      await assertBatchInFirm(batchId)
      const rows = normalizations.map((n) => ({
        id: crypto.randomUUID(),
        batchId,
        ...n,
      }))
      const writes = []
      for (let i = 0; i < rows.length; i += NORM_BATCH_SIZE) {
        writes.push(db.insert(migrationNormalization).values(rows.slice(i, i + NORM_BATCH_SIZE)))
      }
      await Promise.all(writes)
      return rows.length
    },

    async createErrors(
      batchId: string,
      errors: Array<Omit<NewMigrationError, 'id' | 'batchId' | 'createdAt'>>,
    ): Promise<number> {
      if (errors.length === 0) return 0
      await assertBatchInFirm(batchId)
      const rows = errors.map((e) => ({
        id: crypto.randomUUID(),
        batchId,
        ...e,
      }))
      const writes = []
      for (let i = 0; i < rows.length; i += ERROR_BATCH_SIZE) {
        writes.push(db.insert(migrationError).values(rows.slice(i, i + ERROR_BATCH_SIZE)))
      }
      await Promise.all(writes)
      return rows.length
    },
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _batchWriteSizeNotExported = BATCH_WRITE_SIZE

export type MigrationRepo = ReturnType<typeof makeMigrationRepo>
