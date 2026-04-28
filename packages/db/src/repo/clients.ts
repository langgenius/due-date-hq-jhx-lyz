import { and, desc, eq, inArray, isNull } from 'drizzle-orm'
import type { Db } from '../client'
import { client, type Client, type ClientEntityType } from '../schema/clients'

/**
 * ClientsRepo — tenant-scoped CRUD for `client` rows.
 * HARD INVARIANT: every query below carries `WHERE firm_id = :firmId`.
 * Procedures never call this constructor directly; they call
 * `scoped(db, firmId).clients` (packages/db/src/scoped.ts).
 *
 * D1 100-param budget: `client` inserts 14 cols → 7 rows per batch INSERT.
 */

const COLS_PER_CLIENT_ROW = 14
const CLIENT_BATCH_SIZE = Math.floor(100 / COLS_PER_CLIENT_ROW) // = 7

export interface ClientCreateInput {
  id?: string
  name: string
  ein?: string | null
  state?: string | null
  county?: string | null
  entityType: ClientEntityType
  email?: string | null
  notes?: string | null
  assigneeName?: string | null
  migrationBatchId?: string | null
}

export function makeClientsRepo(db: Db, firmId: string) {
  return {
    firmId,

    async create(input: ClientCreateInput): Promise<{ id: string }> {
      const id = input.id ?? crypto.randomUUID()
      await db.insert(client).values({
        id,
        firmId,
        name: input.name,
        ein: input.ein ?? null,
        state: input.state ?? null,
        county: input.county ?? null,
        entityType: input.entityType,
        email: input.email ?? null,
        notes: input.notes ?? null,
        assigneeName: input.assigneeName ?? null,
        migrationBatchId: input.migrationBatchId ?? null,
      })
      return { id }
    },

    async createBatch(inputs: ClientCreateInput[]): Promise<{ ids: string[] }> {
      if (inputs.length === 0) return { ids: [] }
      const rows = inputs.map((i) => ({
        id: i.id ?? crypto.randomUUID(),
        firmId,
        name: i.name,
        ein: i.ein ?? null,
        state: i.state ?? null,
        county: i.county ?? null,
        entityType: i.entityType,
        email: i.email ?? null,
        notes: i.notes ?? null,
        assigneeName: i.assigneeName ?? null,
        migrationBatchId: i.migrationBatchId ?? null,
      }))
      const writes = []
      for (let i = 0; i < rows.length; i += CLIENT_BATCH_SIZE) {
        writes.push(db.insert(client).values(rows.slice(i, i + CLIENT_BATCH_SIZE)))
      }
      await Promise.all(writes)
      return { ids: rows.map((r) => r.id) }
    },

    async findById(id: string): Promise<Client | undefined> {
      const rows = await db
        .select()
        .from(client)
        .where(and(eq(client.firmId, firmId), eq(client.id, id), isNull(client.deletedAt)))
        .limit(1)
      return rows[0]
    },

    async listByFirm(opts: { includeDeleted?: boolean; limit?: number } = {}): Promise<Client[]> {
      const where = opts.includeDeleted
        ? eq(client.firmId, firmId)
        : and(eq(client.firmId, firmId), isNull(client.deletedAt))
      const q = db.select().from(client).where(where).orderBy(desc(client.createdAt))
      return opts.limit ? await q.limit(opts.limit) : await q
    },

    async listByBatch(batchId: string): Promise<Client[]> {
      return db
        .select()
        .from(client)
        .where(and(eq(client.firmId, firmId), eq(client.migrationBatchId, batchId)))
    },

    async softDelete(id: string): Promise<void> {
      await db
        .update(client)
        .set({ deletedAt: new Date() })
        .where(and(eq(client.firmId, firmId), eq(client.id, id)))
    },

    /**
     * 24h full-batch revert helper (Owner/Manager; caller enforces the RBAC
     * gate + writes `migration.reverted` audit + `migration_revert`
     * evidence_link before calling).
     *
     * Returns the count of client rows removed; `ON DELETE CASCADE` from
     * obligation_instance takes care of the children.
     */
    async deleteByBatch(batchId: string): Promise<number> {
      const toDelete = await db
        .select({ id: client.id })
        .from(client)
        .where(and(eq(client.firmId, firmId), eq(client.migrationBatchId, batchId)))
      if (toDelete.length === 0) return 0
      const ids = toDelete.map((r) => r.id)
      await db.delete(client).where(and(eq(client.firmId, firmId), inArray(client.id, ids)))
      return ids.length
    },
  }
}

export type ClientsRepo = ReturnType<typeof makeClientsRepo>
