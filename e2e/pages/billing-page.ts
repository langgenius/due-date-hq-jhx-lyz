import type { Locator, Page } from '@playwright/test'

export class BillingPage {
  readonly checkoutHeading: Locator
  readonly billingHeading: Locator
  readonly successHeading: Locator
  readonly cancelHeading: Locator
  readonly continueToSecureCheckoutButton: Locator
  readonly manageBillingButton: Locator
  readonly ownerPermissionAlert: Locator
  readonly subscriptionActiveHeading: Locator
  readonly stillWaitingHeading: Locator
  readonly restartCheckoutLink: Locator
  readonly firmPlanLink: Locator

  constructor(readonly page: Page) {
    this.checkoutHeading = page.getByRole('heading', { name: 'Confirm checkout', level: 1 })
    this.billingHeading = page.getByRole('heading', { name: 'Billing', level: 1 })
    this.successHeading = page.getByRole('heading', { name: 'Payment confirmation', level: 1 })
    this.cancelHeading = page.getByRole('heading', { name: 'Checkout canceled', level: 1 })
    this.continueToSecureCheckoutButton = page.getByRole('button', {
      name: 'Continue to secure checkout',
    })
    this.manageBillingButton = page.getByRole('button', { name: 'Manage billing' })
    this.ownerPermissionAlert = page.getByRole('alert').filter({
      hasText: 'Owner permission required',
    })
    this.subscriptionActiveHeading = page.getByRole('heading', { name: 'Subscription active' })
    this.stillWaitingHeading = page.getByRole('alert').filter({
      hasText: 'Still waiting on confirmation',
    })
    this.restartCheckoutLink = page.getByRole('link', { name: 'Restart checkout' })
    this.firmPlanLink = page.getByRole('link', { name: /Upgrade to Firm/ })
  }

  async gotoCheckout(path = '/billing/checkout?plan=firm&interval=monthly') {
    await this.page.goto(path)
  }

  async gotoBilling() {
    await this.page.goto('/billing')
  }

  async gotoSuccess(path = '/billing/success?plan=firm&interval=monthly') {
    await this.page.goto(path)
  }

  async gotoCancel(path = '/billing/cancel?plan=firm&interval=monthly') {
    await this.page.goto(path)
  }
}
