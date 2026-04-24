import type { Db } from './client'
import { auditEvent, type NewAuditEvent } from './schema/audit'

/**
 * Audit writer — append-only. INSERT-only by construction (docs/dev-file/06 §6.1,
 * docs/dev-file/03-Data-Model.md §2.5):
 *
 *   - No `update(...)` / `delete(...)` methods.
 *   - Every row gets a server-generated `id` + server clock `createdAt`
 *     (ignores any caller-supplied values for those fields).
 *
 * D1 bound-param budget = 100 (docs/dev-file/03 §3 + d1-drizzle-schema skill).
 * `auditEvent` inserts 12 columns → 12 × n ≤ 100 → n ≤ 8 per batch.
 */

export interface AuditEventInput {
  firmId: string
  actorId: string | null
  entityType: string
  entityId: string
  action: string
  before?: unknown
  after?: unknown
  reason?: string
  ipHash?: string
  userAgentHash?: string
}

const COLS_PER_AUDIT_ROW = 12
const AUDIT_BATCH_SIZE = Math.floor(100 / COLS_PER_AUDIT_ROW) // = 8

function toRow(input: AuditEventInput): NewAuditEvent {
  return {
    id: crypto.randomUUID(),
    firmId: input.firmId,
    actorId: input.actorId,
    entityType: input.entityType,
    entityId: input.entityId,
    action: input.action,
    beforeJson: input.before ?? null,
    afterJson: input.after ?? null,
    reason: input.reason ?? null,
    ipHash: input.ipHash ?? null,
    userAgentHash: input.userAgentHash ?? null,
  }
}

export function createAuditWriter(db: Db) {
  return {
    async write(event: AuditEventInput): Promise<{ id: string }> {
      const row = toRow(event)
      await db.insert(auditEvent).values(row)
      return { id: row.id }
    },

    /**
     * Write many audit rows in D1-safe batches. Each batch is a single
     * INSERT statement with multi-row VALUES; Drizzle + D1 preserve row
     * order per statement.
     */
    async writeBatch(events: AuditEventInput[]): Promise<{ ids: string[] }> {
      if (events.length === 0) return { ids: [] }
      const rows = events.map(toRow)
      const writes = []
      for (let i = 0; i < rows.length; i += AUDIT_BATCH_SIZE) {
        writes.push(db.insert(auditEvent).values(rows.slice(i, i + AUDIT_BATCH_SIZE)))
      }
      await Promise.all(writes)
      return { ids: rows.map((r) => r.id) }
    },
  }
}

export type AuditWriter = ReturnType<typeof createAuditWriter>
