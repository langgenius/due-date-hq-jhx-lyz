import type { Db } from './client'
import { evidenceLink, type NewEvidenceLink } from './schema/audit'

/**
 * Evidence writer (PRD §5.5 · docs/dev-file/03-Data-Model.md §2.5).
 *
 * Evidence rows are append-oriented: we append a new row per decision,
 * never overwrite. `verified_at` / `verified_by` can be updated later by
 * the ops verification workflow (Phase 1); that path goes through a
 * different writer that we do not implement in Demo Sprint.
 *
 * Invariant: exactly one of `obligationInstanceId` or `aiOutputId` must
 * be set. Not enforced at the DB level (D1 lacks CHECK on nullable FKs)
 * so we enforce here.
 *
 * D1 bound-param budget: evidenceLink has 17 columns → n ≤ 5 per batch.
 */

export interface EvidenceInput {
  firmId: string
  obligationInstanceId?: string | null
  aiOutputId?: string | null
  sourceType: string
  sourceId?: string | null
  sourceUrl?: string | null
  verbatimQuote?: string | null
  rawValue?: string | null
  normalizedValue?: string | null
  confidence?: number | null
  model?: string | null
  matrixVersion?: string | null
  verifiedAt?: Date | null
  verifiedBy?: string | null
  appliedAt?: Date
  appliedBy?: string | null
}

const COLS_PER_EVIDENCE_ROW = 17
const EVIDENCE_BATCH_SIZE = Math.floor(100 / COLS_PER_EVIDENCE_ROW) // = 5

function toRow(input: EvidenceInput): NewEvidenceLink {
  const oi = input.obligationInstanceId ?? null
  const ai = input.aiOutputId ?? null
  const bothNull = oi === null && ai === null
  const bothSet = oi !== null && ai !== null
  if (bothNull || bothSet) {
    throw new Error(
      'EvidenceInput invariant violated: exactly one of obligationInstanceId or aiOutputId must be set',
    )
  }
  return {
    id: crypto.randomUUID(),
    firmId: input.firmId,
    obligationInstanceId: oi,
    aiOutputId: ai,
    sourceType: input.sourceType,
    sourceId: input.sourceId ?? null,
    sourceUrl: input.sourceUrl ?? null,
    verbatimQuote: input.verbatimQuote ?? null,
    rawValue: input.rawValue ?? null,
    normalizedValue: input.normalizedValue ?? null,
    confidence: input.confidence ?? null,
    model: input.model ?? null,
    matrixVersion: input.matrixVersion ?? null,
    verifiedAt: input.verifiedAt ?? null,
    verifiedBy: input.verifiedBy ?? null,
    appliedAt: input.appliedAt ?? new Date(),
    appliedBy: input.appliedBy ?? null,
  }
}

export function createEvidenceWriter(db: Db) {
  return {
    async write(input: EvidenceInput): Promise<{ id: string }> {
      const row = toRow(input)
      await db.insert(evidenceLink).values(row)
      return { id: row.id }
    },

    async writeBatch(inputs: EvidenceInput[]): Promise<{ ids: string[] }> {
      if (inputs.length === 0) return { ids: [] }
      const rows = inputs.map(toRow)
      const writes = []
      for (let i = 0; i < rows.length; i += EVIDENCE_BATCH_SIZE) {
        writes.push(db.insert(evidenceLink).values(rows.slice(i, i + EVIDENCE_BATCH_SIZE)))
      }
      await Promise.all(writes)
      return { ids: rows.map((r) => r.id) }
    },
  }
}

export type EvidenceWriter = ReturnType<typeof createEvidenceWriter>
