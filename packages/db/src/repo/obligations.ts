import { and, asc, eq, inArray } from 'drizzle-orm'
import type { Db } from '../client'
import {
  obligationInstance,
  type ObligationInstance,
  type ObligationStatus,
} from '../schema/obligations'

const COLS_PER_OI_ROW = 11
const OI_BATCH_SIZE = Math.floor(100 / COLS_PER_OI_ROW) // = 9

export interface ObligationCreateInput {
  id?: string
  clientId: string
  taxType: string
  taxYear?: number | null
  baseDueDate: Date
  currentDueDate?: Date
  status?: ObligationStatus
  migrationBatchId?: string | null
}

export function makeObligationsRepo(db: Db, firmId: string) {
  return {
    firmId,

    async createBatch(inputs: ObligationCreateInput[]): Promise<{ ids: string[] }> {
      if (inputs.length === 0) return { ids: [] }
      const rows = inputs.map((i) => ({
        id: i.id ?? crypto.randomUUID(),
        firmId,
        clientId: i.clientId,
        taxType: i.taxType,
        taxYear: i.taxYear ?? null,
        baseDueDate: i.baseDueDate,
        currentDueDate: i.currentDueDate ?? i.baseDueDate,
        status: i.status ?? ('pending' as const),
        migrationBatchId: i.migrationBatchId ?? null,
      }))
      const writes = []
      for (let i = 0; i < rows.length; i += OI_BATCH_SIZE) {
        writes.push(db.insert(obligationInstance).values(rows.slice(i, i + OI_BATCH_SIZE)))
      }
      await Promise.all(writes)
      return { ids: rows.map((r) => r.id) }
    },

    async listByClient(clientId: string): Promise<ObligationInstance[]> {
      return db
        .select()
        .from(obligationInstance)
        .where(
          and(eq(obligationInstance.firmId, firmId), eq(obligationInstance.clientId, clientId)),
        )
        .orderBy(asc(obligationInstance.currentDueDate))
    },

    async listByBatch(batchId: string): Promise<ObligationInstance[]> {
      return db
        .select()
        .from(obligationInstance)
        .where(
          and(
            eq(obligationInstance.firmId, firmId),
            eq(obligationInstance.migrationBatchId, batchId),
          ),
        )
    },

    /**
     * Update current_due_date. Caller is responsible for writing the
     * `obligation.due_date.updated` audit event + evidence_link in the
     * same outer transaction (Pulse apply path does this in one D1 batch).
     */
    async updateDueDate(id: string, newDate: Date): Promise<void> {
      await db
        .update(obligationInstance)
        .set({ currentDueDate: newDate })
        .where(and(eq(obligationInstance.firmId, firmId), eq(obligationInstance.id, id)))
    },

    async updateStatus(id: string, status: ObligationStatus): Promise<void> {
      await db
        .update(obligationInstance)
        .set({ status })
        .where(and(eq(obligationInstance.firmId, firmId), eq(obligationInstance.id, id)))
    },

    /**
     * 24h revert helper — deletes every obligation row owned by this batch.
     * ON DELETE CASCADE at the client FK takes care of child obligations
     * when the client itself is deleted, but migration revert wants to
     * delete obligations explicitly so clients are left in place if they
     * were manually created before the batch (edge case — batch clients
     * are created exclusively by Migration, so this is defensive).
     */
    async deleteByBatch(batchId: string): Promise<number> {
      const toDelete = await db
        .select({ id: obligationInstance.id })
        .from(obligationInstance)
        .where(
          and(
            eq(obligationInstance.firmId, firmId),
            eq(obligationInstance.migrationBatchId, batchId),
          ),
        )
      if (toDelete.length === 0) return 0
      const ids = toDelete.map((r) => r.id)
      await db
        .delete(obligationInstance)
        .where(and(eq(obligationInstance.firmId, firmId), inArray(obligationInstance.id, ids)))
      return ids.length
    },
  }
}

export type ObligationsRepo = ReturnType<typeof makeObligationsRepo>
