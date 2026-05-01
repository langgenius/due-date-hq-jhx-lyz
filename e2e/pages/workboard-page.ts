import type { Locator, Page } from '@playwright/test'

export class WorkboardPage {
  readonly heading: Locator
  readonly searchInput: Locator
  readonly resetButton: Locator
  readonly sortSelect: Locator
  readonly statusFilterTrigger: Locator

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Obligation queue' })
    this.searchInput = page.getByLabel('Search obligations')
    this.resetButton = page.getByRole('button', { name: 'Reset' })
    this.sortSelect = page.getByRole('combobox').first()
    this.statusFilterTrigger = page.getByRole('button', { name: /^Status(?:\s+\d+)?$/ })
  }

  async goto(path = '/workboard') {
    await this.page.goto(path)
  }

  async openStatusFilter() {
    await this.statusFilterTrigger.click()
  }

  statusFilterOption(name: string) {
    return this.page.getByRole('menuitemcheckbox', {
      name: new RegExp(`^${escapeRegex(name)}(?:\\s+\\d+)?$`),
    })
  }

  async selectStatusFilter(name: string) {
    await this.openStatusFilter()
    await this.statusFilterOption(name).click()
    await this.page.keyboard.press('Escape')
  }

  statusSelectFor(clientName: string) {
    return this.page.getByLabel(`Change status for ${clientName}`)
  }

  statusChangeOption(name: string) {
    return this.page.getByRole('menuitemradio', { name })
  }

  rowFor(clientName: string) {
    return this.page.getByRole('row', { name: new RegExp(clientName) })
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
