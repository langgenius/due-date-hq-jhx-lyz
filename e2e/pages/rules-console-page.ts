import type { Locator, Page } from '@playwright/test'

export class RulesConsolePage {
  readonly coverageTab: Locator
  readonly sourcesTab: Locator
  readonly libraryTab: Locator
  readonly previewTab: Locator

  constructor(readonly page: Page) {
    this.coverageTab = page.getByRole('tab', { name: /Coverage/ })
    this.sourcesTab = page.getByRole('tab', { name: /Sources/ })
    this.libraryTab = page.getByRole('tab', { name: /Rule Library/ })
    this.previewTab = page.getByRole('tab', { name: /Obligation Preview/ })
  }

  async goto() {
    await this.page.goto('/rules')
  }
}
