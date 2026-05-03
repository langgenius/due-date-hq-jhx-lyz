import type { Locator, Page } from '@playwright/test'

export class WorkloadPage {
  readonly upgradeHeading: Locator
  readonly ownerWorkloadHeading: Locator
  readonly upgradePlanLink: Locator
  readonly openWorkboardLink: Locator

  constructor(readonly page: Page) {
    this.upgradeHeading = page.getByText('Team workload is available on Pro and above', {
      exact: true,
    })
    this.ownerWorkloadHeading = page.getByText('Owner workload', { exact: true })
    this.upgradePlanLink = page.getByRole('link', { name: 'Upgrade plan' })
    this.openWorkboardLink = page.getByRole('link', { name: 'Open Workboard' })
  }

  async goto(path = '/workload') {
    await this.page.goto(path)
  }

  rowFor(ownerLabel: string) {
    return this.page.getByRole('row').filter({ hasText: ownerLabel }).first()
  }
}
