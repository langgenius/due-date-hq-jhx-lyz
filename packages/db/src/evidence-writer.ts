import type { Db } from './client'

// EvidenceLink writer (PRD §5.5 · §6.2). Invoked by procedures and AI orchestrator.
export function createEvidenceWriter(_db: Db) {
  return {
    write(_link: { firmId: string; targetId: string; sourceType: string; sourceUrl: string }) {
      // intentional placeholder
    },
  }
}
export type EvidenceWriter = ReturnType<typeof createEvidenceWriter>
