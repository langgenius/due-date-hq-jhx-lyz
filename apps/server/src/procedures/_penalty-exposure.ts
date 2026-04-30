import { estimatePenaltyExposure, type PenaltyEngineResult } from '@duedatehq/core/penalty'
import type { ScopedRepo } from '@duedatehq/ports/scoped'

interface ClientPenaltyFacts {
  id: string
  entityType?: string | null
  state?: string | null
  estimatedTaxLiabilityCents?: number | null
  equityOwnerCount?: number | null
}

interface ObligationPenaltyFacts {
  id: string
  taxType: string
  currentDueDate: Date
}

export function calculateObligationExposure(
  client: ClientPenaltyFacts,
  obligation: ObligationPenaltyFacts,
  now = new Date(),
): ReturnType<typeof toExposurePatch> {
  const result = estimatePenaltyExposure({
    jurisdiction: client.state,
    taxType: obligation.taxType,
    entityType: client.entityType,
    dueDate: obligation.currentDueDate,
    asOfDate: now,
    estimatedTaxLiabilityCents: client.estimatedTaxLiabilityCents ?? null,
    equityOwnerCount: client.equityOwnerCount ?? null,
  })
  return toExposurePatch(result, now)
}

export async function recalculateClientExposure(
  scoped: ScopedRepo,
  clientId: string,
  now = new Date(),
): Promise<number> {
  const client = await scoped.clients.findById(clientId)
  if (!client) return 0
  const obligations = await scoped.obligations.listByClient(clientId)
  await Promise.all(
    obligations.map((obligation) =>
      scoped.obligations.updateExposure(
        obligation.id,
        calculateObligationExposure(client, obligation, now),
      ),
    ),
  )
  return obligations.length
}

export async function recalculateObligationExposure(
  scoped: ScopedRepo,
  obligationId: string,
  now = new Date(),
): Promise<void> {
  const obligation = await scoped.obligations.findById(obligationId)
  if (!obligation) return
  const client = await scoped.clients.findById(obligation.clientId)
  if (!client) return
  await scoped.obligations.updateExposure(
    obligation.id,
    calculateObligationExposure(client, obligation, now),
  )
}

function toExposurePatch(result: PenaltyEngineResult, now: Date) {
  return {
    estimatedTaxDueCents: result.estimatedTaxDueCents,
    estimatedExposureCents: result.estimatedExposureCents,
    exposureStatus: result.status,
    penaltyBreakdownJson: result.breakdown,
    penaltyFormulaVersion: result.formulaVersion,
    exposureCalculatedAt: now,
  }
}
