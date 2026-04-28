import { expect, test } from '../fixtures/test'

// Feature: Marketing pricing to billing checkout
// PRD: Pricing + Stripe payment loop
// AC: E2E-BILLING-PRICING-DEEPLINK, E2E-BILLING-PRICING-LOCALE

const appBaseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:8787'
const marketingBaseURL = process.env.E2E_MARKETING_BASE_URL ?? 'http://127.0.0.1:4321'

test.skip(
  Boolean(process.env.E2E_BASE_URL) && !process.env.E2E_MARKETING_BASE_URL,
  'external app targets must provide E2E_MARKETING_BASE_URL for marketing pricing coverage',
)

test('AC: E2E-BILLING-PRICING-DEEPLINK sends Firm CTA to protected checkout', async ({ page }) => {
  await page.goto(`${marketingBaseURL}/pricing`)

  const firmCta = page.locator('[data-event="marketing.pricing.checkout"]')
  await expect(firmCta).toHaveAttribute('href', checkoutHrefPattern())

  await firmCta.click()
  await page.waitForURL('**/login?**')

  const url = new URL(page.url())
  expect(url.origin).toBe(new URL(appBaseURL).origin)
  expect(url.pathname).toBe('/login')
  expect(url.searchParams.get('redirectTo')).toBe('/billing/checkout?plan=firm&interval=monthly')
})

test('AC: E2E-BILLING-PRICING-LOCALE preserves zh-CN handoff before auth redirect', async ({
  page,
}) => {
  await page.goto(`${marketingBaseURL}/zh-CN/pricing`)

  const firmCta = page.locator('[data-event="marketing.pricing.checkout"]')
  await expect(firmCta).toHaveAttribute('href', checkoutHrefPattern('zh-CN'))

  await firmCta.click()
  await page.waitForURL('**/login?**')

  const url = new URL(page.url())
  expect(url.origin).toBe(new URL(appBaseURL).origin)
  expect(url.pathname).toBe('/login')
  expect(url.searchParams.get('redirectTo')).toBe('/billing/checkout?plan=firm&interval=monthly')
  await expect(page.evaluate(() => window.localStorage.getItem('lng'))).resolves.toBe('zh-CN')
})

function checkoutHrefPattern(locale?: 'zh-CN'): RegExp {
  const escapedOrigin = escapeRegExp(new URL(appBaseURL).origin)
  const localePart = locale ? '&lng=zh-CN' : ''
  return new RegExp(`^${escapedOrigin}/billing/checkout\\?plan=firm&interval=monthly${localePart}$`)
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
