import type { Locator, Page } from '@playwright/test'

export class AppShellPage {
  readonly primaryNavigation: Locator
  readonly dashboardLink: Locator
  readonly workboardLink: Locator
  readonly clientsLink: Locator
  readonly rulesLink: Locator
  readonly importClientsButton: Locator
  readonly commandDialog: Locator
  readonly commandPaletteHeading: Locator

  constructor(readonly page: Page) {
    this.primaryNavigation = page.getByRole('navigation', { name: 'Primary navigation' })
    this.dashboardLink = page.getByRole('link', { name: /Dashboard/ })
    this.workboardLink = page.getByRole('link', { name: /Workboard/ })
    this.clientsLink = page.getByRole('link', { name: 'Clients' })
    this.rulesLink = page.getByRole('link', { name: 'Rules' })
    this.importClientsButton = page
      .getByRole('button', { name: /^(Import clients|Run migration)$/ })
      .first()
    this.commandDialog = page.getByRole('dialog', { name: 'Command palette' })
    this.commandPaletteHeading = this.commandDialog.getByRole('heading', {
      name: 'Command palette',
    })
  }

  async goto(path = '/') {
    await this.page.goto(path)
  }

  async openCommandPalette() {
    if (await this.tryOpenCommandPalette('Meta+K')) return
    await this.tryOpenCommandPalette('Control+K')
  }

  commandItem(name: string) {
    return this.commandDialog.getByText(name, { exact: true })
  }

  private async tryOpenCommandPalette(shortcut: string) {
    if (await this.commandDialog.isVisible()) return true
    await this.page.keyboard.press(shortcut)

    try {
      await this.commandDialog.waitFor({ state: 'visible', timeout: 1_000 })
      return true
    } catch {
      return this.commandDialog.isVisible()
    }
  }
}
