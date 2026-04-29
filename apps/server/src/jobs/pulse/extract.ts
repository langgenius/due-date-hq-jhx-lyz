import { createAI } from '@duedatehq/ai'
import { createDb, makePulseOpsRepo } from '@duedatehq/db'
import type { Env } from '../../env'

function dateFromIsoDate(value: string): Date {
  return new Date(`${value}T00:00:00.000Z`)
}

export async function extractPulseSnapshot(
  env: Pick<
    Env,
    | 'AI_GATEWAY_ACCOUNT_ID'
    | 'AI_GATEWAY_SLUG'
    | 'AI_GATEWAY_API_KEY'
    | 'AI_GATEWAY_PROVIDER'
    | 'AI_GATEWAY_PROVIDER_API_KEY'
    | 'AI_GATEWAY_MODEL'
    | 'DB'
    | 'R2_PULSE'
  >,
  snapshotId: string,
): Promise<{ pulseId: string | null; status: 'created' | 'failed' | 'missing' }> {
  const db = createDb(env.DB)
  const repo = makePulseOpsRepo(db)
  const snapshot = await repo.getSourceSnapshot(snapshotId)
  if (!snapshot) return { pulseId: null, status: 'missing' }

  await repo.updateSourceSnapshotStatus(snapshotId, { parseStatus: 'extracting' })
  const raw = await env.R2_PULSE.get(snapshot.rawR2Key)
  if (!raw) {
    await repo.updateSourceSnapshotStatus(snapshotId, {
      parseStatus: 'failed',
      failureReason: 'Raw Pulse snapshot is missing from R2.',
    })
    return { pulseId: null, status: 'failed' }
  }

  const rawText = await raw.text()
  const ai = createAI(env)
  const result = await ai.extractPulse({
    sourceId: snapshot.sourceId,
    title: snapshot.title,
    officialSourceUrl: snapshot.officialSourceUrl,
    rawText,
  })

  if (!result.result) {
    await repo.updateSourceSnapshotStatus(snapshotId, {
      parseStatus: 'failed',
      failureReason: result.refusal?.message ?? 'Pulse extract failed.',
    })
    return { pulseId: null, status: 'failed' }
  }

  const created = await repo.createPendingPulseFromExtract({
    snapshotId,
    source: snapshot.sourceId,
    sourceUrl: snapshot.officialSourceUrl,
    rawR2Key: snapshot.rawR2Key,
    publishedAt: snapshot.publishedAt,
    aiSummary: result.result.summary,
    verbatimQuote: result.result.sourceExcerpt,
    parsedJurisdiction: result.result.jurisdiction,
    parsedCounties: result.result.counties,
    parsedForms: result.result.forms,
    parsedEntityTypes: result.result.entityTypes,
    parsedOriginalDueDate: dateFromIsoDate(result.result.originalDueDate),
    parsedNewDueDate: dateFromIsoDate(result.result.newDueDate),
    parsedEffectiveFrom: result.result.effectiveFrom
      ? dateFromIsoDate(result.result.effectiveFrom)
      : null,
    confidence: result.result.confidence,
    requiresHumanReview: true,
    isSample: false,
  })

  return { pulseId: created.pulseId, status: 'created' }
}
