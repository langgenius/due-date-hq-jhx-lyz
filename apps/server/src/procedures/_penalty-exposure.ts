import {
  estimateAccruedPenalty,
  estimateProjectedExposure,
  type PenaltyEngineResult,
} from '@duedatehq/core/penalty'
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
  const result = estimateProjectedExposure({
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

export function calculateAccruedPenalty(
  client: ClientPenaltyFacts,
  obligation: ObligationPenaltyFacts,
  asOfDate: string | Date,
) {
  const result = estimateAccruedPenalty(
    {
      jurisdiction: client.state,
      taxType: obligation.taxType,
      entityType: client.entityType,
      dueDate: obligation.currentDueDate,
      asOfDate,
      estimatedTaxLiabilityCents: client.estimatedTaxLiabilityCents ?? null,
      equityOwnerCount: client.equityOwnerCount ?? null,
    },
    { asOfDate },
  )
  return {
    accruedPenaltyCents: result.estimatedExposureCents,
    accruedPenaltyStatus: result.status,
    accruedPenaltyBreakdown: result.breakdown,
    penaltyAsOfDate: asOfDate instanceof Date ? asOfDate.toISOString().slice(0, 10) : asOfDate,
  }
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

export async function recalculateFirmProjectedExposure(
  scoped: ScopedRepo,
  now = new Date(),
): Promise<number> {
  const clients = await scoped.clients.listByFirm()
  const counts = await Promise.all(
    clients.map((client) => recalculateClientExposure(scoped, client.id, now)),
  )
  return counts.reduce((sum, count) => sum + count, 0)
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
