export const PLAN_IDS = ['solo', 'pro', 'team', 'firm'] as const
export const AI_PLAN_TIERS = ['basic', 'practice', 'enterprise'] as const
export const AI_TASK_KINDS = ['migration', 'brief', 'pulse', 'insight', 'readiness'] as const

export type BillingPlan = (typeof PLAN_IDS)[number]
export type AiPlanTier = (typeof AI_PLAN_TIERS)[number]
export type AiTaskKind = (typeof AI_TASK_KINDS)[number]

export type PlanFeatureKey =
  | 'sharedDeadlineOperations'
  | 'teamManagerOperations'
  | 'productionPulse'
  | 'priorityPulseMatching'
  | 'auditExport'
  | 'productionMigrationAi'
  | 'guidedMigrationReview'
  | 'multiplePractices'
  | 'apiAccess'
  | 'sso'
  | 'customCoverage'
  | 'customAi'

export interface PlanEntitlements {
  plan: BillingPlan
  label: 'Solo' | 'Pro' | 'Team' | 'Enterprise'
  seatLimit: number
  activePracticeLimit: number | null
  aiTier: AiPlanTier
  aiDailyRunLimit: number
  features: Record<PlanFeatureKey, boolean>
}

function features(enabled: readonly PlanFeatureKey[]): Record<PlanFeatureKey, boolean> {
  const enabledSet = new Set(enabled)
  return {
    sharedDeadlineOperations: enabledSet.has('sharedDeadlineOperations'),
    teamManagerOperations: enabledSet.has('teamManagerOperations'),
    productionPulse: enabledSet.has('productionPulse'),
    priorityPulseMatching: enabledSet.has('priorityPulseMatching'),
    auditExport: enabledSet.has('auditExport'),
    productionMigrationAi: enabledSet.has('productionMigrationAi'),
    guidedMigrationReview: enabledSet.has('guidedMigrationReview'),
    multiplePractices: enabledSet.has('multiplePractices'),
    apiAccess: enabledSet.has('apiAccess'),
    sso: enabledSet.has('sso'),
    customCoverage: enabledSet.has('customCoverage'),
    customAi: enabledSet.has('customAi'),
  }
}

export const PLAN_ENTITLEMENTS = {
  solo: {
    plan: 'solo',
    label: 'Solo',
    seatLimit: 1,
    activePracticeLimit: 1,
    aiTier: 'basic',
    aiDailyRunLimit: 5,
    features: features([]),
  },
  pro: {
    plan: 'pro',
    label: 'Pro',
    seatLimit: 3,
    activePracticeLimit: 1,
    aiTier: 'practice',
    aiDailyRunLimit: 50,
    features: features(['sharedDeadlineOperations', 'productionPulse', 'productionMigrationAi']),
  },
  team: {
    plan: 'team',
    label: 'Team',
    seatLimit: 10,
    activePracticeLimit: 1,
    aiTier: 'practice',
    aiDailyRunLimit: 150,
    features: features([
      'sharedDeadlineOperations',
      'teamManagerOperations',
      'productionPulse',
      'priorityPulseMatching',
      'auditExport',
      'productionMigrationAi',
      'guidedMigrationReview',
    ]),
  },
  firm: {
    plan: 'firm',
    label: 'Enterprise',
    seatLimit: 10,
    activePracticeLimit: null,
    aiTier: 'enterprise',
    aiDailyRunLimit: 500,
    features: features([
      'sharedDeadlineOperations',
      'teamManagerOperations',
      'productionPulse',
      'priorityPulseMatching',
      'auditExport',
      'productionMigrationAi',
      'guidedMigrationReview',
      'multiplePractices',
      'apiAccess',
      'sso',
      'customCoverage',
      'customAi',
    ]),
  },
} as const satisfies Record<BillingPlan, PlanEntitlements>

export function isBillingPlan(value: string | null | undefined): value is BillingPlan {
  return value === 'solo' || value === 'pro' || value === 'team' || value === 'firm'
}

export function getPlanEntitlements(plan: BillingPlan): PlanEntitlements {
  return PLAN_ENTITLEMENTS[plan]
}

export function planSeatLimit(plan: BillingPlan): number {
  return getPlanEntitlements(plan).seatLimit
}

export function planAiTier(plan: BillingPlan): AiPlanTier {
  return getPlanEntitlements(plan).aiTier
}

export function planAiDailyRunLimit(plan: BillingPlan): number {
  return getPlanEntitlements(plan).aiDailyRunLimit
}

export function activePracticeLimitForPlan(plan: BillingPlan): number | null {
  return getPlanEntitlements(plan).activePracticeLimit
}

export function planHasFeature(plan: BillingPlan, feature: PlanFeatureKey): boolean {
  return getPlanEntitlements(plan).features[feature]
}
