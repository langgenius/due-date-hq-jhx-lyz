import type { Locator, Page } from '@playwright/test'

export class ObligationQueuePage {
  readonly heading: Locator
  readonly searchInput: Locator
  readonly resetButton: Locator
  readonly sortSelect: Locator
  readonly statusFilterTrigger: Locator
  readonly savedViewsButton: Locator
  readonly calendarSyncLink: Locator
  readonly columnsButton: Locator
  readonly compactTab: Locator
  readonly comfortableTab: Locator

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', { name: 'Obligations' })
    this.searchInput = page.getByLabel('Search obligations')
    this.resetButton = page.getByRole('button', { name: 'Reset' })
    this.sortSelect = page.getByRole('combobox').first()
    this.statusFilterTrigger = page.getByRole('button', { name: /^Status(?:\s+\d+)?$/ })
    this.savedViewsButton = page.getByRole('button', { name: 'Saved views' })
    this.calendarSyncLink = page.getByRole('link', { name: 'Calendar sync' })
    this.columnsButton = page.getByRole('button', { name: 'Columns' })
    this.compactTab = page.getByRole('tab', { name: 'Compact' })
    this.comfortableTab = page.getByRole('tab', { name: 'Comfortable' })
  }

  async goto(path = '/obligations') {
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

  selectRow(clientName: string) {
    return this.page.getByLabel(`Select ${clientName}`)
  }

  savedViewMenuItem(name: string) {
    return this.page.getByRole('menuitem', { name })
  }

  columnVisibilityOption(name: string) {
    return this.page.getByRole('menuitemcheckbox', { name })
  }

  rowFor(clientName: string) {
    const escapedName = escapeRegex(clientName)
    return this.page
      .getByRole('row', { name: new RegExp(escapedName) })
      .or(this.page.getByRole('button', { name: new RegExp(`Obligation detail: ${escapedName}`) }))
      .or(this.page.getByRole('button', { name: new RegExp(`Open obligations: ${escapedName}`) }))
  }

  async openDetailFor(clientName: string) {
    await this.rowFor(clientName).click({ position: { x: 96, y: 12 }, force: true })
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
