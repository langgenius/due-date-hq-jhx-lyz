import type { EvidencePublic } from '@duedatehq/contracts'
import { requireTenant } from '../_context'
import { os } from '../_root'

interface EvidenceRow {
  id: string
  obligationInstanceId: string | null
  aiOutputId: string | null
  sourceType: string
  sourceId: string | null
  sourceUrl: string | null
  verbatimQuote: string | null
  rawValue: string | null
  normalizedValue: string | null
  confidence: number | null
  model: string | null
  appliedAt: Date
}

function toEvidencePublic(row: EvidenceRow): EvidencePublic {
  return {
    id: row.id,
    obligationInstanceId: row.obligationInstanceId,
    aiOutputId: row.aiOutputId,
    sourceType: row.sourceType,
    sourceId: row.sourceId,
    sourceUrl: row.sourceUrl,
    verbatimQuote: row.verbatimQuote,
    rawValue: row.rawValue,
    normalizedValue: row.normalizedValue,
    confidence: row.confidence,
    model: row.model,
    appliedAt: row.appliedAt.toISOString(),
  }
}

const listByObligation = os.evidence.listByObligation.handler(async ({ input, context }) => {
  const { scoped } = requireTenant(context)
  const rows = await scoped.evidence.listByObligation(input.obligationId)
  return { evidence: rows.map(toEvidencePublic) }
})

export const evidenceHandlers = { listByObligation }
