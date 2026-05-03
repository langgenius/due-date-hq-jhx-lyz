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
  firmCreatedAt?: Date | string
  migrationOnboardingCompleted?: boolean
  now?: Date
}

export type AiBudgetResult =
  | { allowed: true; used: number; limit: number; key: string | null }
  | { allowed: false; used: number; limit: number; key: string }

const DAY_TTL_SECONDS = 36 * 60 * 60
const MS_PER_DAY = 24 * 60 * 60 * 1000

export const SOLO_MIGRATION_ONBOARDING_DAYS = 7
export const SOLO_MIGRATION_ONBOARDING_DAILY_LIMIT = 30
export const SOLO_MIGRATION_STANDARD_DAILY_LIMIT = 15

function dayKey(now: Date): string {
  return now.toISOString().slice(0, 10)
}

function parseDate(value: Date | string | undefined): Date | null {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function aiBudgetLimit(
  input: Pick<
    AiBudgetInput,
    'firmCreatedAt' | 'migrationOnboardingCompleted' | 'now' | 'plan' | 'taskKind'
  >,
): number {
  const plan = input.plan ?? 'pro'
  if (plan === 'solo' && input.taskKind === 'migration') {
    const createdAt = parseDate(input.firmCreatedAt)
    const ageMs = createdAt ? (input.now ?? new Date()).getTime() - createdAt.getTime() : null
    const hasOnboardingCredit =
      input.migrationOnboardingCompleted !== true &&
      ageMs !== null &&
      ageMs >= 0 &&
      ageMs < SOLO_MIGRATION_ONBOARDING_DAYS * MS_PER_DAY

    return hasOnboardingCredit
      ? SOLO_MIGRATION_ONBOARDING_DAILY_LIMIT
      : SOLO_MIGRATION_STANDARD_DAILY_LIMIT
  }

  return planAiDailyRunLimit(plan)
}

export async function consumeAiBudget(input: AiBudgetInput): Promise<AiBudgetResult> {
  const limit = aiBudgetLimit(input)
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
