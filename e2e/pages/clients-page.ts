import type { Locator, Page } from '@playwright/test'

export class ClientsPage {
  readonly directoryTitle: Locator
  readonly searchInput: Locator
  readonly entityFilter: Locator
  readonly stateFilter: Locator
  readonly newClientButton: Locator
  readonly createDialog: Locator
  readonly createClientButton: Locator
  readonly factProfileDialog: Locator
  readonly filteredEmptyState: Locator

  constructor(readonly page: Page) {
    this.directoryTitle = page.getByRole('heading', { name: 'Client facts' })
    this.searchInput = page.getByPlaceholder('Search clients')
    this.entityFilter = page.getByRole('combobox', { name: 'Entity filter' })
    this.stateFilter = page.getByRole('combobox', { name: 'State filter' })
    this.newClientButton = page.getByRole('button', { name: 'New client' })
    this.createDialog = page.getByRole('dialog', { name: 'Create client' })
    this.createClientButton = this.createDialog.getByRole('button', { name: 'Create client' })
    this.factProfileDialog = page.getByRole('dialog', { name: 'Fact profile' })
    this.filteredEmptyState = page.getByText('No clients match these filters')
  }

  async goto(path = '/clients') {
    await this.page.goto(path)
  }

  async createClient(input: {
    name: string
    ein: string
    state: string
    county?: string
    email?: string
    owner?: string
  }) {
    await this.newClientButton.click()
    await this.createDialog.getByLabel('Client name').fill(input.name)
    await this.createDialog.getByLabel('EIN').fill(input.ein)
    await this.createDialog.getByLabel('State').fill(input.state)
    if (input.county) await this.createDialog.getByLabel('County').fill(input.county)
    if (input.email) await this.createDialog.getByLabel('Email').fill(input.email)
    if (input.owner) {
      await this.createDialog.getByRole('combobox', { name: 'Owner' }).click()
      await this.page
        .getByRole('option', { name: new RegExp(`^${escapeRegExp(input.owner)}`) })
        .click()
    }
    await this.createClientButton.click()
  }

  async selectEntityFilter(entity: string) {
    await this.entityFilter.click()
    await this.page.getByRole('option', { name: entity }).click()
  }

  async selectStateFilter(state: string) {
    await this.stateFilter.click()
    await this.page.getByRole('option', { name: state }).click()
  }

  metricCard(label: string) {
    return this.page
      .locator('section')
      .first()
      .locator('[data-slot="card"]')
      .filter({
        has: this.page.getByText(label, { exact: true }),
      })
  }

  rowFor(clientName: string) {
    return this.page.getByRole('button', {
      name: new RegExp(`Open fact profile for ${escapeRegExp(clientName)}`),
    })
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
