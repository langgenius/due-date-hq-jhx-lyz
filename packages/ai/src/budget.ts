import {
  planAiDailyRunLimit,
  type AiTaskKind,
  type BillingPlan,
} from '@duedatehq/core/plan-entitlements'

export interface AiBudgetKv {
  get(key: string): Promise<string | null>
  put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>
}

export interface AiBudgetInput {
  kv?: AiBudgetKv
  firmId?: string
  plan?: BillingPlan
  taskKind: AiTaskKind
  now?: Date
}

export type AiBudgetResult =
  | { allowed: true; used: number; limit: number; key: string | null }
  | { allowed: false; used: number; limit: number; key: string }

const DAY_TTL_SECONDS = 36 * 60 * 60

function dayKey(now: Date): string {
  return now.toISOString().slice(0, 10)
}

export async function consumeAiBudget(input: AiBudgetInput): Promise<AiBudgetResult> {
  const limit = planAiDailyRunLimit(input.plan ?? 'pro')
  if (!input.kv || !input.firmId) {
    return { allowed: true, used: 0, limit, key: null }
  }

  const key = `ai-budget:${input.firmId}:${dayKey(input.now ?? new Date())}:${input.taskKind}`
  const used = Number.parseInt((await input.kv.get(key)) ?? '0', 10)
  const current = Number.isFinite(used) ? used : 0
  if (current >= limit) {
    return { allowed: false, used: current, limit, key }
  }

  const next = current + 1
  await input.kv.put(key, String(next), { expirationTtl: DAY_TTL_SECONDS })
  return { allowed: true, used: next, limit, key }
}
