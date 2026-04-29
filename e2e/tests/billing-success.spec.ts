import type { Page } from '@playwright/test'
import { seedBillingSubscription } from '../fixtures/billing'
import { expect, test } from '../fixtures/test'

// Feature: Billing success and settings
// PRD: Pricing + Stripe payment loop
// AC: E2E-BILLING-WEBHOOK-STATE, E2E-BILLING-SETTINGS-PORTAL, E2E-BILLING-CANCEL-RECOVERY

test.skip(
  Boolean(process.env.E2E_BASE_URL),
  'local e2e auth seed is not available on external targets',
)

test('AC: E2E-BILLING-WEBHOOK-STATE shows activation only after subscription state exists', async ({
  request,
  authSession,
  billingPage,
}) => {
  await billingPage.gotoSuccess()

  await expect(billingPage.successHeading).toBeVisible()
  await expect(billingPage.stillWaitingHeading).toBeVisible()

  await seedBillingSubscription(request, { firmId: authSession.firmId })
  await billingPage.gotoSuccess()

  await expect(billingPage.subscriptionActiveHeading).toBeVisible()
  await expect(billingPage.page.getByText('firm', { exact: true })).toBeVisible()
})

test('AC: E2E-BILLING-SETTINGS-PORTAL reads webhook-backed state and opens portal by contract', async ({
  request,
  authSession,
  authenticatedPage,
  billingPage,
}) => {
  await seedBillingSubscription(request, { firmId: authSession.firmId })
  const portal = await interceptBillingPortal(authenticatedPage)

  await billingPage.gotoSettings()

  await expect(billingPage.settingsHeading).toBeVisible()
  await expect(authenticatedPage.getByRole('group', { name: 'Plan: firm' })).toBeVisible()
  await expect(authenticatedPage.getByRole('group', { name: 'Seat limit: 5' })).toBeVisible()
  await expect(billingPage.manageBillingButton).toBeEnabled()

  await billingPage.manageBillingButton.click()

  const payload = await portal.nextPayload()
  expect(payload).toMatchObject({
    referenceId: authSession.firmId,
    customerType: 'organization',
    disableRedirect: true,
  })
  const returnUrl = new URL(String(payload.returnUrl))
  expect(returnUrl.pathname).toBe('/settings/billing')
})

test('AC: E2E-BILLING-CANCEL-RECOVERY keeps selected plan available after cancel', async ({
  billingPage,
}) => {
  await billingPage.gotoCancel()

  await expect(billingPage.cancelHeading).toBeVisible()
  await expect(billingPage.restartCheckoutLink).toHaveAttribute(
    'href',
    '/billing/checkout?plan=firm&interval=monthly',
  )
})

async function interceptBillingPortal(
  page: Page,
): Promise<{ nextPayload(): Promise<Record<string, unknown>> }> {
  const payloads: Record<string, unknown>[] = []

  await page.route('**/api/auth/subscription/billing-portal', async (route) => {
    const payload: unknown = route.request().postDataJSON()
    assertJsonObject(payload)
    payloads.push(payload)
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ url: '/settings/billing?portal=returned', redirect: false }),
    })
  })

  return {
    async nextPayload() {
      await expect.poll(() => payloads.length).toBeGreaterThan(0)
      return payloads.shift() ?? {}
    },
  }
}

function assertJsonObject(value: unknown): asserts value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Expected a JSON object.')
  }
}
