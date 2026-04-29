import type { Locator, Page } from '@playwright/test'

export class AuditPage {
  readonly heading: Locator
  readonly searchInput: Locator
  readonly actionInput: Locator
  readonly entityTypeInput: Locator
  readonly resetButton: Locator
  readonly detailDrawer: Locator

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Audit log', level: 1 })
    this.searchInput = page.getByLabel('Search audit events')
    this.actionInput = page.getByLabel('Exact action')
    this.entityTypeInput = page.getByLabel('Entity type')
    this.resetButton = page.getByRole('button', { name: 'Reset' })
    this.detailDrawer = page.getByRole('dialog', { name: 'Audit detail' })
  }

  async goto(path = '/audit') {
    await this.page.goto(path)
  }

  eventRowFor(action: string) {
    return this.page
      .getByRole('button', { name: 'View audit detail' })
      .filter({ hasText: action })
      .first()
  }
}
