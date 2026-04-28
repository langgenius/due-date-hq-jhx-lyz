import { test as base, expect } from '@playwright/test'

import { LoginPage } from '../pages/login-page'

type DueDateFixtures = {
  loginPage: LoginPage
}

export const test = base.extend<DueDateFixtures>({
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },
})

export { expect }
