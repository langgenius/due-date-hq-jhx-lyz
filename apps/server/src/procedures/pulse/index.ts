import { ORPCError } from '@orpc/server'
import {
  ErrorCodes,
  type PulseAffectedClient,
  type PulseAlertPublic,
  type PulseSourceHealth,
} from '@duedatehq/contracts'
import { livePulseAdapters } from '@duedatehq/ingest/adapters'
import { enqueueDashboardBriefRefresh } from '../../jobs/dashboard-brief/enqueue'
import { requireTenant, type RpcContext } from '../_context'
import { requireCurrentFirmRole } from '../_permissions'
import { os } from '../_root'

interface PulseAlertRow {
  id: string
  pulseId: string
  status: PulseAlertPublic['status']
  title: string
  source: string
  sourceUrl: string
  summary: string
  publishedAt: Date
  matchedCount: number
  needsReviewCount: number
  confidence: number
  isSample: boolean
}

const SOURCE_LABELS: Record<string, string> = {
  'irs.disaster': 'IRS Disaster Relief',
  'irs.newsroom': 'IRS Newsroom',
  'irs.guidance': 'IRS Guidance',
  'ca.ftb.newsroom': 'CA FTB Newsroom',
  'ca.ftb.tax_news': 'CA FTB Tax News',
  'ca.cdtfa.news': 'CA CDTFA News',
  'tx.cpa.rss': 'TX Comptroller RSS',
  'fl.dor.tips': 'FL DOR Tax Tips',
  'wa.dor.news': 'WA DOR News',
  'wa.dor.whats_new': 'WA DOR What’s New',
  'fema.declarations': 'FEMA declarations',
  'ny.dtf.press': 'NY DTF Press',
}

interface PulseAffectedClientRow {
  obligationId: string
  clientId: string
  clientName: string
  state: string | null
  county: string | null
  entityType: PulseAffectedClient['entityType']
  taxType: string
  currentDueDate: Date
  newDueDate: Date
  status: PulseAffectedClient['status']
  matchStatus: PulseAffectedClient['matchStatus']
  reason: string | null
}

type PulseRepoErrorShape = Error & {
  code: 'not_found' | 'conflict' | 'revert_expired' | 'no_eligible'
}

function pulseRepoErrorCode(error: unknown): PulseRepoErrorShape['code'] | null {
  if (!(error instanceof Error) || !('code' in error)) return null
  const { code } = error
  if (
    code === 'not_found' ||
    code === 'conflict' ||
    code === 'revert_expired' ||
    code === 'no_eligible'
  ) {
    return code
  }
  return null
}

function toDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function toAlertPublic(row: PulseAlertRow): PulseAlertPublic {
  return {
    id: row.id,
    pulseId: row.pulseId,
    status: row.status,
    title: row.title,
    source: row.source,
    sourceUrl: row.sourceUrl,
    summary: row.summary,
    publishedAt: row.publishedAt.toISOString(),
    matchedCount: row.matchedCount,
    needsReviewCount: row.needsReviewCount,
    confidence: row.confidence,
    isSample: row.isSample,
  }
}

function toAffectedClientPublic(row: PulseAffectedClientRow): PulseAffectedClient {
  return {
    obligationId: row.obligationId,
    clientId: row.clientId,
    clientName: row.clientName,
    state: row.state,
    county: row.county,
    entityType: row.entityType,
    taxType: row.taxType,
    currentDueDate: toDateOnly(row.currentDueDate),
    newDueDate: toDateOnly(row.newDueDate),
    status: row.status,
    matchStatus: row.matchStatus,
    reason: row.reason,
  }
}

function toIsoOrNull(date: Date | null): string | null {
  return date ? date.toISOString() : null
}

async function withPulseMutationLock<T>(
  context: RpcContext,
  input: { firmId: string; alertId: string; action: 'apply' | 'revert' },
  run: () => Promise<T>,
): Promise<T> {
  const key = `pulse:lock:${input.firmId}:${input.alertId}:${input.action}`
  if (await context.env.CACHE.get(key)) {
    throw new ORPCError('CONFLICT', { message: ErrorCodes.PULSE_APPLY_CONFLICT })
  }
  await context.env.CACHE.put(key, String(Date.now()), { expirationTtl: 60 })
  try {
    return await run()
  } finally {
    await context.env.CACHE.delete(key).catch(() => undefined)
  }
}

function mapPulseError(error: unknown): never {
  const code = pulseRepoErrorCode(error)
  if (code) {
    if (code === 'not_found') {
      throw new ORPCError('NOT_FOUND', { message: ErrorCodes.PULSE_NOT_FOUND })
    }
    if (code === 'conflict') {
      throw new ORPCError('CONFLICT', { message: ErrorCodes.PULSE_APPLY_CONFLICT })
    }
    if (code === 'revert_expired') {
      throw new ORPCError('CONFLICT', { message: ErrorCodes.PULSE_REVERT_EXPIRED })
    }
    if (code === 'no_eligible') {
      throw new ORPCError('BAD_REQUEST', { message: ErrorCodes.PULSE_NO_ELIGIBLE_OBLIGATIONS })
    }
  }
  throw error
}

const listAlerts = os.pulse.listAlerts.handler(async ({ input, context }) => {
  const { scoped } = requireTenant(context)
  const opts = input?.limit === undefined ? {} : { limit: input.limit }
  const alerts = await scoped.pulse.listAlerts(opts)
  return { alerts: alerts.map(toAlertPublic) }
})

const listHistory = os.pulse.listHistory.handler(async ({ input, context }) => {
  const { scoped } = requireTenant(context)
  const alerts = await scoped.pulse.listHistory({
    ...(input?.limit === undefined ? {} : { limit: input.limit }),
    ...(input?.status === undefined ? {} : { status: input.status }),
  })
  return { alerts: alerts.map(toAlertPublic) }
})

const listSourceHealth = os.pulse.listSourceHealth.handler(async ({ context }) => {
  const { scoped } = requireTenant(context)
  const persisted = new Map(
    (await scoped.pulse.listSourceStates()).map((row) => [row.sourceId, row]),
  )
  const sources: PulseSourceHealth[] = livePulseAdapters.map((adapter) => {
    const state = persisted.get(adapter.id)
    return {
      sourceId: adapter.id,
      label: SOURCE_LABELS[adapter.id] ?? adapter.id,
      tier: adapter.tier,
      jurisdiction: adapter.jurisdiction,
      enabled: state?.enabled ?? true,
      healthStatus: state?.healthStatus ?? 'degraded',
      lastCheckedAt: toIsoOrNull(state?.lastCheckedAt ?? null),
      lastSuccessAt: toIsoOrNull(state?.lastSuccessAt ?? null),
      nextCheckAt: toIsoOrNull(state?.nextCheckAt ?? null),
      consecutiveFailures: state?.consecutiveFailures ?? 0,
    }
  })
  return { sources }
})

const getDetail = os.pulse.getDetail.handler(async ({ input, context }) => {
  const { scoped } = requireTenant(context)
  try {
    const detail = await scoped.pulse.getDetail(input.alertId)
    return {
      alert: toAlertPublic(detail.alert),
      jurisdiction: detail.jurisdiction,
      counties: detail.counties,
      forms: detail.forms,
      entityTypes: detail.entityTypes,
      originalDueDate: toDateOnly(detail.originalDueDate),
      newDueDate: toDateOnly(detail.newDueDate),
      effectiveFrom: detail.effectiveFrom ? toDateOnly(detail.effectiveFrom) : null,
      sourceExcerpt: detail.sourceExcerpt,
      reviewedAt: detail.reviewedAt ? detail.reviewedAt.toISOString() : null,
      affectedClients: detail.affectedClients.map(toAffectedClientPublic),
    }
  } catch (error) {
    return mapPulseError(error)
  }
})

const apply = os.pulse.apply.handler(async ({ input, context }) => {
  const { userId } = await requireCurrentFirmRole(context, ['owner', 'manager'])
  const { scoped, tenant } = requireTenant(context)
  try {
    const result = await withPulseMutationLock(
      context,
      { firmId: tenant.firmId, alertId: input.alertId, action: 'apply' },
      () =>
        scoped.pulse.apply({
          alertId: input.alertId,
          obligationIds: input.obligationIds,
          confirmedObligationIds: input.confirmedObligationIds ?? [],
          userId,
        }),
    )
    const output = {
      alert: toAlertPublic(result.alert),
      appliedCount: result.appliedCount,
      auditIds: result.auditIds,
      evidenceIds: result.evidenceIds,
      applicationIds: result.applicationIds,
      emailOutboxId: result.emailOutboxId,
      revertExpiresAt: result.revertExpiresAt.toISOString(),
    }
    await enqueueDashboardBriefRefresh(context.env, {
      firmId: tenant.firmId,
      reason: 'pulse_apply',
    }).catch(() => false)
    return output
  } catch (error) {
    return mapPulseError(error)
  }
})

const dismiss = os.pulse.dismiss.handler(async ({ input, context }) => {
  const { userId } = await requireCurrentFirmRole(context, ['owner', 'manager'])
  const { scoped, tenant } = requireTenant(context)
  try {
    const result = await scoped.pulse.dismiss({ alertId: input.alertId, userId })
    await enqueueDashboardBriefRefresh(context.env, {
      firmId: tenant.firmId,
      reason: 'pulse_dismiss',
    }).catch(() => false)
    return { alert: toAlertPublic(result.alert), auditId: result.auditId }
  } catch (error) {
    return mapPulseError(error)
  }
})

const snooze = os.pulse.snooze.handler(async ({ input, context }) => {
  const { userId } = await requireCurrentFirmRole(context, ['owner', 'manager'])
  const { scoped, tenant } = requireTenant(context)
  try {
    const result = await scoped.pulse.snooze({
      alertId: input.alertId,
      userId,
      until: new Date(input.until),
    })
    await enqueueDashboardBriefRefresh(context.env, {
      firmId: tenant.firmId,
      reason: 'pulse_dismiss',
    }).catch(() => false)
    return { alert: toAlertPublic(result.alert), auditId: result.auditId }
  } catch (error) {
    return mapPulseError(error)
  }
})

const revert = os.pulse.revert.handler(async ({ input, context }) => {
  const { userId } = await requireCurrentFirmRole(context, ['owner', 'manager'])
  const { scoped, tenant } = requireTenant(context)
  try {
    const result = await withPulseMutationLock(
      context,
      { firmId: tenant.firmId, alertId: input.alertId, action: 'revert' },
      () => scoped.pulse.revert({ alertId: input.alertId, userId }),
    )
    const output = {
      alert: toAlertPublic(result.alert),
      revertedCount: result.revertedCount,
      auditIds: result.auditIds,
      evidenceIds: result.evidenceIds,
    }
    await enqueueDashboardBriefRefresh(context.env, {
      firmId: tenant.firmId,
      reason: 'pulse_revert',
    }).catch(() => false)
    return output
  } catch (error) {
    return mapPulseError(error)
  }
})

export const pulseHandlers = {
  listAlerts,
  listHistory,
  listSourceHealth,
  getDetail,
  apply,
  dismiss,
  snooze,
  revert,
}
