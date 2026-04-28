import type { Locator, Page } from '@playwright/test'

export class ClientsPage {
  readonly directoryTitle: Locator
  readonly searchInput: Locator
  readonly newClientButton: Locator
  readonly createDialog: Locator
  readonly createClientButton: Locator

  constructor(readonly page: Page) {
    this.directoryTitle = page.getByText('Client directory', { exact: true })
    this.searchInput = page.getByPlaceholder('Search clients')
    this.newClientButton = page.getByRole('button', { name: 'New client' })
    this.createDialog = page.getByRole('dialog', { name: 'Create client' })
    this.createClientButton = this.createDialog.getByRole('button', { name: 'Create client' })
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
    if (input.owner) await this.createDialog.getByLabel('Owner').fill(input.owner)
    await this.createClientButton.click()
  }

  rowFor(clientName: string) {
    return this.page.getByRole('row', { name: new RegExp(clientName) })
  }
}
