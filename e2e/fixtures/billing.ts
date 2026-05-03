import type { APIRequestContext } from '@playwright/test'

export type E2EBillingPlan = 'solo' | 'pro' | 'team' | 'firm'
export type E2EBillingInterval = 'month' | 'year'

export async function seedBillingSubscription(
  request: APIRequestContext,
  input: {
    firmId: string
    plan?: E2EBillingPlan
    interval?: E2EBillingInterval
    status?: 'active' | 'trialing' | 'past_due' | 'paused'
  },
): Promise<{
  subscription: { stripeSubscriptionId: string }
}> {
  const response = await request.post('/api/e2e/billing/subscription', {
    data: {
      firmId: input.firmId,
      plan: input.plan ?? 'pro',
      status: input.status ?? 'active',
      interval: input.interval ?? 'month',
    },
    headers: process.env.E2E_SEED_TOKEN
      ? { Authorization: `Bearer ${process.env.E2E_SEED_TOKEN}` }
      : {},
  })
  if (!response.ok()) {
    throw new Error(
      `Could not seed billing subscription: ${response.status()} ${await response.text()}`,
    )
  }
  const body: unknown = await response.json()
  assertJsonObject(body)
  const subscription = body.subscription
  assertJsonObject(subscription)
  if (typeof subscription.stripeSubscriptionId !== 'string') {
    throw new Error('Invalid e2e billing subscription response.')
  }
  return { subscription: { stripeSubscriptionId: subscription.stripeSubscriptionId } }
}

function assertJsonObject(value: unknown): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Expected a JSON object.')
  }
}
