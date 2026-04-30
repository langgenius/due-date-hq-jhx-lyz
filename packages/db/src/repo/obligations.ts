import { and, asc, eq, inArray } from 'drizzle-orm'
import type { Db } from '../client'
import { client } from '../schema/clients'
import {
  obligationInstance,
  type ExposureStatus,
  type ObligationInstance,
  type ObligationStatus,
} from '../schema/obligations'
import { listActiveOverlayDueDates } from './overlay'

const COLS_PER_OI_ROW = 17
const OI_BATCH_SIZE = Math.floor(100 / COLS_PER_OI_ROW) // = 5
const CLIENT_ASSERT_BATCH_SIZE = 90

export interface ObligationCreateInput {
  id?: string
  clientId: string
  taxType: string
  taxYear?: number | null
  baseDueDate: Date
  currentDueDate?: Date
  status?: ObligationStatus
  migrationBatchId?: string | null
  estimatedTaxDueCents?: number | null
  estimatedExposureCents?: number | null
  exposureStatus?: ExposureStatus
  penaltyBreakdownJson?: unknown
  penaltyFormulaVersion?: string | null
  exposureCalculatedAt?: Date | null
}

export function makeObligationsRepo(db: Db, firmId: string) {
  async function applyOverlayDueDates<T extends { id: string; currentDueDate: Date }>(
    rows: T[],
  ): Promise<T[]> {
    const overlayDueDates = await listActiveOverlayDueDates(
      db,
      firmId,
      rows.map((row) => row.id),
    )
    return rows.map((row) => ({
      ...row,
      currentDueDate: overlayDueDates.get(row.id) ?? row.currentDueDate,
    }))
  }

  async function assertClientsInFirm(clientIds: string[]): Promise<void> {
    const uniqueIds = Array.from(new Set(clientIds))
    if (uniqueIds.length === 0) return

    const checks = []
    for (let i = 0; i < uniqueIds.length; i += CLIENT_ASSERT_BATCH_SIZE) {
      const chunk = uniqueIds.slice(i, i + CLIENT_ASSERT_BATCH_SIZE)
      checks.push(
        db
          .select({ id: client.id })
          .from(client)
          .where(and(eq(client.firmId, firmId), inArray(client.id, chunk))),
      )
    }

    const resultSets = await Promise.all(checks)
    const found = new Set<string>()
    for (const rows of resultSets) {
      for (const row of rows) found.add(row.id)
    }

    const missing = uniqueIds.filter((id) => !found.has(id))
    if (missing.length > 0) {
      throw new Error(
        `Cannot create obligations for clients outside the current firm: ${missing.join(', ')}`,
      )
    }
  }

  return {
    firmId,

    async createBatch(inputs: ObligationCreateInput[]): Promise<{ ids: string[] }> {
      if (inputs.length === 0) return { ids: [] }
      await assertClientsInFirm(inputs.map((input) => input.clientId))
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
        estimatedTaxDueCents: i.estimatedTaxDueCents ?? null,
        estimatedExposureCents: i.estimatedExposureCents ?? null,
        exposureStatus: i.exposureStatus ?? ('needs_input' as const),
        penaltyBreakdownJson: i.penaltyBreakdownJson ?? null,
        penaltyFormulaVersion: i.penaltyFormulaVersion ?? null,
        exposureCalculatedAt: i.exposureCalculatedAt ?? null,
      }))
      const writes = []
      for (let i = 0; i < rows.length; i += OI_BATCH_SIZE) {
        writes.push(db.insert(obligationInstance).values(rows.slice(i, i + OI_BATCH_SIZE)))
      }
      await Promise.all(writes)
      return { ids: rows.map((r) => r.id) }
    },

    async findById(id: string): Promise<ObligationInstance | undefined> {
      const rows = await db
        .select()
        .from(obligationInstance)
        .where(and(eq(obligationInstance.firmId, firmId), eq(obligationInstance.id, id)))
        .limit(1)
      const [row] = await applyOverlayDueDates(rows)
      return row
    },

    async listByClient(clientId: string): Promise<ObligationInstance[]> {
      const rows = await db
        .select()
        .from(obligationInstance)
        .where(
          and(eq(obligationInstance.firmId, firmId), eq(obligationInstance.clientId, clientId)),
        )
        .orderBy(asc(obligationInstance.currentDueDate))
      return (await applyOverlayDueDates(rows)).toSorted(
        (a, b) => a.currentDueDate.getTime() - b.currentDueDate.getTime(),
      )
    },

    async listByBatch(batchId: string): Promise<ObligationInstance[]> {
      const rows = await db
        .select()
        .from(obligationInstance)
        .where(
          and(
            eq(obligationInstance.firmId, firmId),
            eq(obligationInstance.migrationBatchId, batchId),
          ),
        )
      return applyOverlayDueDates(rows)
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

    async updateExposure(
      id: string,
      patch: {
        estimatedTaxDueCents: number | null
        estimatedExposureCents: number | null
        exposureStatus: ExposureStatus
        penaltyBreakdownJson: unknown
        penaltyFormulaVersion: string | null
        exposureCalculatedAt: Date | null
      },
    ): Promise<void> {
      await db
        .update(obligationInstance)
        .set(patch)
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
