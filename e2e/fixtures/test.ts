import {
  test as base,
  expect,
  type APIRequestContext,
  type Cookie,
  type Page,
} from '@playwright/test'

import { AppShellPage } from '../pages/app-shell-page'
import { LoginPage } from '../pages/login-page'
import { MigrationWizardPage } from '../pages/migration-wizard-page'
import { RulesConsolePage } from '../pages/rules-console-page'
import { WorkboardPage } from '../pages/workboard-page'

type AuthSeedMode = 'empty' | 'workboard'

type E2EAuthSession = {
  user: {
    id: string
    name: string
    email: string
  }
  firmId: string
  cookie: Cookie
  seeded: {
    workboardRows: Array<{
      clientName: string
      status: string
    }>
  }
}

type DueDateFixtures = {
  loginPage: LoginPage
  authSeed: AuthSeedMode
  authSession: E2EAuthSession
  authenticatedPage: Page
  appShellPage: AppShellPage
  migrationWizardPage: MigrationWizardPage
  rulesConsolePage: RulesConsolePage
  workboardPage: WorkboardPage
}

export const test = base.extend<DueDateFixtures>({
  authSeed: ['empty', { option: true }],

  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page))
  },

  appShellPage: async ({ authenticatedPage }, use) => {
    await use(new AppShellPage(authenticatedPage))
  },

  migrationWizardPage: async ({ authenticatedPage }, use) => {
    await use(new MigrationWizardPage(authenticatedPage))
  },

  rulesConsolePage: async ({ authenticatedPage }, use) => {
    await use(new RulesConsolePage(authenticatedPage))
  },

  workboardPage: async ({ authenticatedPage }, use) => {
    await use(new WorkboardPage(authenticatedPage))
  },

  authSession: async ({ request, authSeed }, use, testInfo) => {
    if (process.env.E2E_BASE_URL) {
      throw new Error('authenticatedPage only supports the local development e2e target.')
    }

    await use(
      await createAuthSession(request, {
        seed: authSeed,
        testId: testInfo.titlePath.join(' '),
      }),
    )
  },

  authenticatedPage: async ({ page, authSession }, use) => {
    await page.context().addCookies([authSession.cookie])
    await use(page)
  },
})

export { expect }

function parseAuthSession(value: unknown): E2EAuthSession {
  if (!isRecord(value)) throw new Error('Invalid e2e auth session response.')
  const user = value.user
  const cookie = value.cookie
  const seeded = value.seeded
  if (!isRecord(user) || !isRecord(cookie) || !isRecord(seeded)) {
    throw new Error('Invalid e2e auth session response.')
  }
  if (
    typeof user.id !== 'string' ||
    typeof user.name !== 'string' ||
    typeof user.email !== 'string' ||
    typeof value.firmId !== 'string' ||
    typeof cookie.name !== 'string' ||
    typeof cookie.value !== 'string' ||
    typeof cookie.domain !== 'string' ||
    typeof cookie.path !== 'string' ||
    typeof cookie.httpOnly !== 'boolean' ||
    typeof cookie.secure !== 'boolean' ||
    cookie.sameSite !== 'Lax' ||
    typeof cookie.expires !== 'number' ||
    !Array.isArray(seeded.workboardRows)
  ) {
    throw new Error('Invalid e2e auth session response.')
  }

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    firmId: value.firmId,
    cookie: {
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path,
      httpOnly: cookie.httpOnly,
      secure: cookie.secure,
      sameSite: cookie.sameSite,
      expires: cookie.expires,
    },
    seeded: {
      workboardRows: seeded.workboardRows.filter(isWorkboardSeedRow),
    },
  }
}

async function createAuthSession(
  request: APIRequestContext,
  data: { seed: AuthSeedMode; testId: string },
): Promise<E2EAuthSession> {
  return tryCreateAuthSession(request, data, 0)
}

async function tryCreateAuthSession(
  request: APIRequestContext,
  data: { seed: AuthSeedMode; testId: string },
  attempt: number,
): Promise<E2EAuthSession> {
  const response = await request.post('/api/e2e/session', { data })
  if (response.ok()) {
    const body: unknown = await response.json()
    return parseAuthSession(body)
  }

  const lastStatus = response.status()
  const lastBody = await response.text()
  if (attempt >= 3) {
    throw new Error(`Could not create e2e auth session: ${lastStatus} ${lastBody}`)
  }

  await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)))
  return tryCreateAuthSession(request, data, attempt + 1)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isWorkboardSeedRow(value: unknown): value is { clientName: string; status: string } {
  return isRecord(value) && typeof value.clientName === 'string' && typeof value.status === 'string'
}
