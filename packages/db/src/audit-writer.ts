import type { Db } from './client'

// Append-only audit log writer. Action enum must never drop values (docs/dev-file/06 §6.1).
// Signature will expand in Phase 0; keep it stable for call sites that already wire it through.
export function createAuditWriter(_db: Db) {
  return {
    write(_event: { action: string; firmId: string; actorId: string | null; payload?: unknown }) {
      // intentional placeholder
    },
  }
}
export type AuditWriter = ReturnType<typeof createAuditWriter>
