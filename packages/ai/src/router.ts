import {
  planAiTier,
  type AiPlanTier,
  type AiTaskKind,
  type BillingPlan,
} from '@duedatehq/core/plan-entitlements'
import type { PromptName } from './prompter'

export interface AiModelRoutingEnv {
  AI_GATEWAY_MODEL?: string
  AI_GATEWAY_MODEL_BASIC?: string
  AI_GATEWAY_MODEL_PRACTICE?: string
  AI_GATEWAY_MODEL_ENTERPRISE?: string
}

export interface AiRoutingInput {
  plan?: BillingPlan
  taskKind?: AiTaskKind
  firmId?: string
}

export function taskKindForPrompt(prompt: PromptName): AiTaskKind {
  if (
    prompt === 'mapper@v1' ||
    prompt === 'normalizer-entity@v1' ||
    prompt === 'normalizer-tax-types@v1'
  ) {
    return 'migration'
  }
  if (prompt === 'brief@v1') return 'brief'
  if (prompt === 'pulse-extract@v1') return 'pulse'
  if (prompt === 'readiness-checklist@v1') return 'readiness'
  return 'insight'
}

export function aiTierForPlan(plan: BillingPlan | undefined): AiPlanTier {
  return plan ? planAiTier(plan) : 'practice'
}

export function modelForAiTier(env: AiModelRoutingEnv, tier: AiPlanTier): string | undefined {
  if (tier === 'basic') return env.AI_GATEWAY_MODEL_BASIC ?? env.AI_GATEWAY_MODEL
  if (tier === 'enterprise') {
    return env.AI_GATEWAY_MODEL_ENTERPRISE ?? env.AI_GATEWAY_MODEL_PRACTICE ?? env.AI_GATEWAY_MODEL
  }
  return env.AI_GATEWAY_MODEL_PRACTICE ?? env.AI_GATEWAY_MODEL
}
