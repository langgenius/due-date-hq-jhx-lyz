import type { Locator, Page } from '@playwright/test'

export class MigrationWizardPage {
  readonly dialog: Locator
  readonly pasteClientData: Locator
  readonly closeButton: Locator
  readonly discardDialog: Locator

  constructor(readonly page: Page) {
    this.dialog = page.getByRole('dialog', { name: /Import clients · Step/ })
    this.pasteClientData = page.getByLabel('Paste client data')
    this.closeButton = page.getByRole('button', { name: 'Close wizard' })
    this.discardDialog = page.getByRole('alertdialog', { name: 'Discard import?' })
  }

  async pasteRows(rows: string) {
    await this.pasteClientData.fill(rows)
  }
}
