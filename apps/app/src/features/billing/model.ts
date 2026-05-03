import { parseAsStringLiteral, type inferParserType } from 'nuqs'
import type { FirmPublic } from '@duedatehq/contracts'

export const BILLING_PLANS = ['solo', 'pro', 'team', 'firm'] as const
export const SELF_SERVE_BILLING_PLANS = ['solo', 'pro', 'team'] as const
export const BILLING_INTERVALS = ['monthly', 'yearly'] as const
export const SELF_SERVE_BILLING_PLAN = 'pro' as const

export type BillingPlan = (typeof BILLING_PLANS)[number]
export type SelfServeBillingPlan = (typeof SELF_SERVE_BILLING_PLANS)[number]
export type BillingInterval = (typeof BILLING_INTERVALS)[number]

export const billingSearchParamsParsers = {
  plan: parseAsStringLiteral(BILLING_PLANS).withDefault(SELF_SERVE_BILLING_PLAN),
  interval: parseAsStringLiteral(BILLING_INTERVALS).withDefault('monthly'),
} as const

export type BillingSearchParams = inferParserType<typeof billingSearchParamsParsers>

export interface BillingPlanInfo {
  id: BillingPlan
  label: string
  monthly: string
  yearly: string
  seatLimit: number
  badge: string
  description: string
  bullets: string[]
  selfServe: boolean
}

export function isBillingPlan(value: string | null): value is BillingPlan {
  return value === 'solo' || value === 'pro' || value === 'team' || value === 'firm'
}

export function isBillingInterval(value: string | null): value is BillingInterval {
  return value === 'monthly' || value === 'yearly'
}

export function parseBillingPlan(value: string | null): BillingPlan {
  return isBillingPlan(value) ? value : SELF_SERVE_BILLING_PLAN
}

export function parseBillingInterval(value: string | null): BillingInterval {
  return isBillingInterval(value) ? value : 'monthly'
}

export function serializeBillingQuery(
  path: string,
  params: Pick<BillingSearchParams, 'plan' | 'interval'>,
): string {
  const url = new URL(path, 'https://duedatehq.local')
  url.searchParams.set('plan', params.plan)
  url.searchParams.set('interval', params.interval)
  return `${url.pathname}${url.search}${url.hash}`
}

export function billingPlanHref(plan: BillingPlan, interval: BillingInterval): string {
  return serializeBillingQuery('/billing/checkout', { plan, interval })
}

export function isSelfServeBillingPlan(plan: BillingPlan): plan is SelfServeBillingPlan {
  return (SELF_SERVE_BILLING_PLANS as readonly BillingPlan[]).includes(plan)
}

export function isFirmOwner(firm: FirmPublic | null | undefined): boolean {
  return firm?.role === 'owner'
}

export function paidPlanActive(firm: FirmPublic | null | undefined): boolean {
  return firm?.plan === 'firm' || firm?.plan === 'team' || firm?.plan === 'pro'
}

export function ownedActiveFirms(firms: ReadonlyArray<FirmPublic>): FirmPublic[] {
  return firms.filter(
    (firm) => firm.role === 'owner' && firm.status === 'active' && firm.deletedAt === null,
  )
}

export function activeFirmEntitlementLimit(firms: ReadonlyArray<FirmPublic>): number | null {
  const owned = ownedActiveFirms(firms)
  return owned.some((firm) => firm.plan === 'firm') ? null : 1
}

export function canCreateAdditionalFirm(firms: ReadonlyArray<FirmPublic>): boolean {
  const owned = ownedActiveFirms(firms)
  const limit = activeFirmEntitlementLimit(firms)
  return limit === null || owned.length < limit
}
