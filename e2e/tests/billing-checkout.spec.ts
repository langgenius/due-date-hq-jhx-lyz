import type { APIRequestContext, Page } from '@playwright/test'
import { seedBillingSubscription as seedE2EBillingSubscription } from '../fixtures/billing'
import { expect, test } from '../fixtures/test'

// Feature: Billing checkout
// PRD: Pricing + Stripe payment loop
// AC: E2E-BILLING-CHECKOUT-PAYLOAD, E2E-BILLING-CHECKOUT-EXISTING-SUBSCRIPTION, E2E-BILLING-OWNER-ONLY

test.skip(
  Boolean(process.env.E2E_BASE_URL),
  'local e2e auth seed is not available on external targets',
)

test('AC: E2E-BILLING-CHECKOUT-PAYLOAD starts organization checkout with stable payload', async ({
  authenticatedPage,
  authSession,
  billingPage,
}) => {
  const checkout = await interceptCheckout(authenticatedPage)

  await billingPage.gotoCheckout()
  await expect(billingPage.checkoutHeading).toBeVisible({ timeout: 10_000 })
  await expect(billingPage.continueToSecureCheckoutButton).toBeEnabled()

  await billingPage.continueToSecureCheckoutButton.click()

  const payload = await checkout.nextPayload()
  expect(payload).toMatchObject({
    plan: 'pro',
    annual: false,
    referenceId: authSession.firmId,
    customerType: 'organization',
    seats: 3,
    disableRedirect: true,
  })
  expect(payload).not.toHaveProperty('subscriptionId')
  expectCallbackUrl(payload.successUrl, '/billing/success')
  expectCallbackUrl(payload.cancelUrl, '/billing/cancel')
  expectCallbackUrl(payload.returnUrl, '/billing')
  await expect(authenticatedPage).toHaveURL(/\/billing\/success\?plan=pro&interval=monthly$/)
})

test('AC: E2E-BILLING-CHECKOUT-PAYLOAD supports Team checkout', async ({
  authenticatedPage,
  authSession,
  billingPage,
}) => {
  const checkout = await interceptCheckout(authenticatedPage, {
    redirectPath: '/billing/success?plan=team&interval=monthly',
  })

  await billingPage.gotoCheckout('/billing/checkout?plan=team&interval=monthly')
  await expect(billingPage.checkoutHeading).toBeVisible({ timeout: 10_000 })
  await billingPage.continueToSecureCheckoutButton.click()

  const payload = await checkout.nextPayload()
  expect(payload).toMatchObject({
    plan: 'team',
    annual: false,
    referenceId: authSession.firmId,
    customerType: 'organization',
    seats: 10,
    disableRedirect: true,
  })
  await expect(authenticatedPage).toHaveURL(/\/billing\/success\?plan=team&interval=monthly$/)
})

test('AC: E2E-BILLING-CHECKOUT-EXISTING-SUBSCRIPTION includes subscriptionId on plan changes', async ({
  authenticatedPage,
  authSession,
  request,
  billingPage,
}) => {
  const seeded = await seedBillingSubscription(request, authSession.firmId, 'firm')
  const checkout = await interceptCheckout(authenticatedPage, {
    redirectPath: '/billing/success?plan=pro&interval=yearly',
  })

  await billingPage.gotoCheckout('/billing/checkout?plan=pro&interval=yearly')
  await expect(billingPage.checkoutHeading).toBeVisible({ timeout: 10_000 })

  await billingPage.continueToSecureCheckoutButton.click()

  const payload = await checkout.nextPayload()
  expect(payload).toMatchObject({
    plan: 'pro',
    annual: true,
    referenceId: authSession.firmId,
    subscriptionId: seeded.subscription.stripeSubscriptionId,
    customerType: 'organization',
    seats: 3,
    disableRedirect: true,
  })
  expectCallbackUrl(payload.successUrl, '/billing/success')
  expectCallbackUrl(payload.cancelUrl, '/billing/cancel')
  expectCallbackUrl(payload.returnUrl, '/billing')
})

test('AC: E2E-BILLING-CHECKOUT-CONFIG blocks missing yearly Stripe prices', async ({
  authenticatedPage,
  billingPage,
}) => {
  await authenticatedPage.route('**/rpc/firms/billingCheckoutConfig', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        json: {
          stripeConfigured: true,
          plans: {
            solo: { monthly: true, yearly: true },
            pro: { monthly: true, yearly: true },
            team: { monthly: true, yearly: false },
          },
        },
      }),
    })
  })
  await authenticatedPage.route('**/api/auth/subscription/upgrade', async () => {
    throw new Error('Missing yearly price must not call subscription.upgrade')
  })

  await billingPage.gotoCheckout('/billing/checkout?plan=team&interval=yearly')

  await expect(billingPage.checkoutHeading).toBeVisible({ timeout: 10_000 })
  await expect(
    authenticatedPage.getByRole('alert').filter({ hasText: 'Checkout is not configured' }),
  ).toBeVisible()
  await expect(billingPage.continueToSecureCheckoutButton).toBeDisabled()
})

test.describe('coordinator checkout', () => {
  test.use({ authRole: 'coordinator' })

  test('AC: E2E-BILLING-OWNER-ONLY blocks checkout before any Stripe request', async ({
    authenticatedPage,
    billingPage,
  }) => {
    await authenticatedPage.route('**/api/auth/subscription/upgrade', async () => {
      throw new Error('Coordinator checkout must not call subscription.upgrade')
    })

    await billingPage.gotoCheckout()

    await expect(billingPage.checkoutHeading).toBeVisible({ timeout: 10_000 })
    await expect(billingPage.ownerPermissionAlert).toBeVisible()
    await expect(billingPage.continueToSecureCheckoutButton).toBeDisabled()
  })
})

async function interceptCheckout(
  page: Page,
  options: { redirectPath?: string } = {},
): Promise<{ nextPayload(): Promise<Record<string, unknown>> }> {
  const payloads: Record<string, unknown>[] = []
  const redirectPath = options.redirectPath ?? '/billing/success?plan=pro&interval=monthly'

  await page.route('**/api/auth/subscription/upgrade', async (route) => {
    const payload: unknown = route.request().postDataJSON()
    assertJsonObject(payload)
    payloads.push(payload)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: redirectPath, redirect: false }),
    })
  })

  return {
    async nextPayload() {
      await expect.poll(() => payloads.length).toBeGreaterThan(0)
      return payloads.shift() ?? {}
    },
  }
}

async function seedBillingSubscription(
  request: APIRequestContext,
  firmId: string,
  plan: 'solo' | 'pro' | 'team' | 'firm' = 'pro',
): Promise<{
  subscription: { stripeSubscriptionId: string }
}> {
  return seedE2EBillingSubscription(request, { firmId, plan })
}

function expectCallbackUrl(value: unknown, pathname: string): void {
  expect(typeof value).toBe('string')
  const url = new URL(String(value))
  expect(url.pathname).toBe(pathname)
  if (pathname.startsWith('/billing/')) {
    expect(url.searchParams.get('plan')).toMatch(/^(solo|pro|team|firm)$/)
    expect(url.searchParams.get('interval')).toMatch(/^(monthly|yearly)$/)
  }
}

function assertJsonObject(value: unknown): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Expected a JSON object.')
  }
}
