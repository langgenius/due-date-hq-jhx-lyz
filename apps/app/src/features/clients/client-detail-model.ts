import type {
  ClientPublic,
  ObligationInstancePublic,
  PulseAffectedClient,
  PulseDetail,
} from '@duedatehq/contracts'

const OPEN_OBLIGATION_STATUSES = new Set<ObligationInstancePublic['status']>([
  'pending',
  'in_progress',
  'extended',
  'waiting_on_client',
  'review',
])

export type ClientWorkPlanSummary = {
  openCount: number
  overdueOpenCount: number
  needsReviewCount: number
  projectedExposureCents: number
  exposureNeedsInputCount: number
  estimatedTaxDueCents: number
  paymentTrackCount: number
  nextDueDate: string | null
}

export type ClientPulseMatch = {
  alertId: string
  title: string
  source: string
  sourceUrl: string
  publishedAt: string
  confidence: number
  status: PulseAffectedClient['matchStatus']
  taxType: string
  currentDueDate: string
  newDueDate: string
  reason: string | null
}

export type ClientContactPlan = {
  primaryContact: string | null
  internalOwner: string | null
  missing: Array<'primary_contact' | 'internal_owner' | 'fallback_contact'>
}

export function buildClientWorkPlanSummary(
  obligations: readonly ObligationInstancePublic[],
  asOfDate: string,
): ClientWorkPlanSummary {
  const open = obligations.filter((obligation) => OPEN_OBLIGATION_STATUSES.has(obligation.status))
  const nextDueDate =
    open
      .map((obligation) => obligation.currentDueDate)
      .toSorted((left, right) => left.localeCompare(right))[0] ?? null

  return {
    openCount: open.length,
    overdueOpenCount: open.filter((obligation) => obligation.currentDueDate < asOfDate).length,
    needsReviewCount: open.filter(
      (obligation) => obligation.status === 'review' || obligation.readiness === 'needs_review',
    ).length,
    projectedExposureCents: open.reduce(
      (total, obligation) => total + (obligation.estimatedExposureCents ?? 0),
      0,
    ),
    exposureNeedsInputCount: open.filter(
      (obligation) => obligation.exposureStatus === 'needs_input',
    ).length,
    estimatedTaxDueCents: open.reduce(
      (total, obligation) => total + (obligation.estimatedTaxDueCents ?? 0),
      0,
    ),
    paymentTrackCount: open.filter(
      (obligation) =>
        obligation.estimatedTaxDueCents !== null || obligation.estimatedExposureCents !== null,
    ).length,
    nextDueDate,
  }
}

export function buildClientPulseMatches(
  details: readonly PulseDetail[],
  clientId: string,
): ClientPulseMatch[] {
  return details
    .flatMap((detail) =>
      detail.affectedClients
        .filter((row) => row.clientId === clientId)
        .map((row) => ({
          alertId: detail.alert.id,
          title: detail.alert.title,
          source: detail.alert.source,
          sourceUrl: detail.alert.sourceUrl,
          publishedAt: detail.alert.publishedAt,
          confidence: detail.alert.confidence,
          status: row.matchStatus,
          taxType: row.taxType,
          currentDueDate: row.currentDueDate,
          newDueDate: row.newDueDate,
          reason: row.reason,
        })),
    )
    .toSorted((left, right) => right.publishedAt.localeCompare(left.publishedAt))
}

export function buildClientContactPlan(client: ClientPublic): ClientContactPlan {
  const missing: ClientContactPlan['missing'] = []
  if (!client.email) missing.push('primary_contact')
  if (!client.assigneeName) missing.push('internal_owner')
  missing.push('fallback_contact')

  return {
    primaryContact: client.email,
    internalOwner: client.assigneeName,
    missing,
  }
}
