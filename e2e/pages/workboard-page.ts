import type { Locator, Page } from '@playwright/test'

export class WorkboardPage {
  readonly heading: Locator
  readonly searchInput: Locator
  readonly resetButton: Locator
  readonly sortSelect: Locator

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Obligation queue' })
    this.searchInput = page.getByLabel('Search obligations')
    this.resetButton = page.getByRole('button', { name: 'Reset' })
    this.sortSelect = page.getByRole('combobox').first()
  }

  async goto(path = '/workboard') {
    await this.page.goto(path)
  }

  statusFilter(name: string) {
    return this.page.getByRole('button', { name })
  }

  statusSelectFor(clientName: string) {
    return this.page.getByLabel(`Change status for ${clientName}`)
  }

  rowFor(clientName: string) {
    return this.page.getByRole('row', { name: new RegExp(clientName) })
  }
}
