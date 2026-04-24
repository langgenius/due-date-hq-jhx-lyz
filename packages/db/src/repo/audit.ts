import { and, desc, eq } from 'drizzle-orm'
import { createAuditWriter, type AuditEventInput } from '../audit-writer'
import type { Db } from '../client'
import { auditEvent, type AuditEvent } from '../schema/audit'

export function makeAuditRepo(db: Db, firmId: string) {
  const writer = createAuditWriter(db)

  return {
    firmId,

    async write(event: Omit<AuditEventInput, 'firmId'>): Promise<{ id: string }> {
      return writer.write({ ...event, firmId })
    },

    async writeBatch(events: Array<Omit<AuditEventInput, 'firmId'>>): Promise<{ ids: string[] }> {
      return writer.writeBatch(events.map((event) => ({ ...event, firmId })))
    },

    async listByFirm(
      opts: { action?: string; actorId?: string; limit?: number } = {},
    ): Promise<AuditEvent[]> {
      const filters = [eq(auditEvent.firmId, firmId)]
      if (opts.action) filters.push(eq(auditEvent.action, opts.action))
      if (opts.actorId) filters.push(eq(auditEvent.actorId, opts.actorId))

      const q = db
        .select()
        .from(auditEvent)
        .where(and(...filters))
        .orderBy(desc(auditEvent.createdAt))

      return opts.limit ? await q.limit(opts.limit) : await q
    },
  }
}

export type AuditRepo = ReturnType<typeof makeAuditRepo>
