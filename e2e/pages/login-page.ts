import type { Locator, Page } from '@playwright/test'

export class LoginPage {
  readonly heading: Locator
  readonly googleButton: Locator
  readonly microsoftButton: Locator
  readonly languageButton: Locator
  readonly footerStatus: Locator

  constructor(readonly page: Page) {
    this.heading = page.getByRole('heading', {
      name: /Welcome back to the workbench|欢迎回到工作台/,
    })

    this.googleButton = page.getByRole('button', {
      name: /Continue with Google|使用 Google 继续/,
    })

    this.microsoftButton = page.getByRole('button', {
      name: /Continue with Microsoft|使用 Microsoft 继续/,
    })

    this.languageButton = page.getByRole('button', {
      name: /Language|语言/,
    })

    this.footerStatus = page.getByText(/All systems operational|所有系统运行正常/)
  }

  async goto(path = '/login') {
    await this.page.goto(path)
  }
}
