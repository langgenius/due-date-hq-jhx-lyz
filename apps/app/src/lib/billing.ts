import { createSerializer, parseAsStringLiteral, type inferParserType } from 'nuqs'
import type { FirmPublic } from '@duedatehq/contracts'

export const BILLING_PLANS = ['firm', 'pro'] as const
export const BILLING_INTERVALS = ['monthly', 'yearly'] as const

export type BillingPlan = (typeof BILLING_PLANS)[number]
export type BillingInterval = (typeof BILLING_INTERVALS)[number]

export const billingSearchParamsParsers = {
  plan: parseAsStringLiteral(BILLING_PLANS).withDefault('firm'),
  interval: parseAsStringLiteral(BILLING_INTERVALS).withDefault('monthly'),
} as const

export const serializeBillingQuery = createSerializer(billingSearchParamsParsers)

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
  return value === 'firm' || value === 'pro'
}

export function isBillingInterval(value: string | null): value is BillingInterval {
  return value === 'monthly' || value === 'yearly'
}

export function parseBillingPlan(value: string | null): BillingPlan {
  return isBillingPlan(value) ? value : 'firm'
}

export function parseBillingInterval(value: string | null): BillingInterval {
  return isBillingInterval(value) ? value : 'monthly'
}

export function billingPlanHref(plan: BillingPlan, interval: BillingInterval): string {
  return serializeBillingQuery('/billing/checkout', { plan, interval })
}

export function settingsBillingChangeHref(plan: BillingPlan, interval: BillingInterval): string {
  return `/settings/billing?changePlan=${plan}&interval=${interval}`
}

export function isFirmOwner(firm: FirmPublic | null | undefined): boolean {
  return firm?.role === 'owner'
}

export function paidPlanActive(firm: FirmPublic | null | undefined): boolean {
  return firm?.plan === 'firm' || firm?.plan === 'pro'
}
