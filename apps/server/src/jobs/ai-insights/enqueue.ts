import type { AiInsightKind } from '@duedatehq/ports/ai-insights'
import type { Env } from '../../env'
import {
  AI_INSIGHT_MESSAGE_TYPE,
  aiInsightIdempotencyKey,
  type AiInsightRefreshMessage,
  type AiInsightRefreshReason,
} from './message'

const DEBOUNCE_TTL_SECONDS = 5 * 60

function subjectTypeForKind(kind: AiInsightKind): AiInsightRefreshMessage['subjectType'] {
  return kind === 'client_risk_summary' ? 'client' : 'obligation'
}

function debounceKey(input: { firmId: string; kind: AiInsightKind; subjectId: string }): string {
  return ['ai-insight', 'debounce', input.firmId, input.kind, input.subjectId].join(':')
}

export async function enqueueAiInsightRefresh(
  env: Env,
  input: {
    firmId: string
    kind: AiInsightKind
    subjectId: string
    asOfDate?: string
    reason: AiInsightRefreshReason
    bypassDebounce?: boolean
  },
): Promise<boolean> {
  const key = debounceKey(input)
  if (!input.bypassDebounce) {
    const existing = await env.CACHE.get(key)
    if (existing) return true
    await env.CACHE.put(key, '1', { expirationTtl: DEBOUNCE_TTL_SECONDS })
  }

  const message: AiInsightRefreshMessage = {
    type: AI_INSIGHT_MESSAGE_TYPE,
    firmId: input.firmId,
    kind: input.kind,
    subjectType: subjectTypeForKind(input.kind),
    subjectId: input.subjectId,
    reason: input.reason,
    idempotencyKey: aiInsightIdempotencyKey(input),
    requestedAt: new Date().toISOString(),
  }
  if (input.asOfDate) message.asOfDate = input.asOfDate
  await env.DASHBOARD_QUEUE.send(message)
  return true
}
