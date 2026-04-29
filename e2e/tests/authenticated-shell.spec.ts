import { expect, test } from '../fixtures/test'

// Feature: Authenticated app shell
// PRD: S1 protected workbench entry
// AC: E2E-AUTH-SHELL, E2E-AUTH-GUEST-REDIRECT, E2E-AUTH-COMMANDS

test.skip(
  Boolean(process.env.E2E_BASE_URL),
  'local e2e auth seed is not available on external targets',
)

test('AC: E2E-AUTH-GUEST-REDIRECT sends signed-in guests to their target', async ({
  authenticatedPage,
  workboardPage,
}) => {
  await authenticatedPage.goto('/login?redirectTo=/workboard')

  await expect(authenticatedPage).toHaveURL(/\/workboard$/)
  await expect(workboardPage.heading).toBeVisible()
})

test('AC: E2E-AUTH-SHELL renders the protected dashboard shell', async ({
  appShellPage,
  authenticatedPage,
}) => {
  await appShellPage.goto()

  await expect(authenticatedPage).toHaveURL(/\/$/)
  await expect(appShellPage.primaryNavigation).toBeVisible()
  await expect(appShellPage.dashboardLink).toHaveAttribute('aria-current', 'page')
  await expect(authenticatedPage.getByText('Risk pulse')).toBeVisible()
  await expect(authenticatedPage.getByText('Today queue')).toBeVisible()
  await expect(appShellPage.importClientsButton).toBeVisible()
})

test('AC: E2E-AUTH-COMMANDS navigates and opens implemented actions', async ({
  appShellPage,
  authenticatedPage,
  migrationWizardPage,
}) => {
  await appShellPage.goto()

  await appShellPage.openCommandPalette()
  await expect(appShellPage.commandDialog).toBeVisible()
  await Promise.all(
    [
      'Dashboard',
      'Workboard',
      'Alerts',
      'Team workload',
      'Clients',
      'Firm profile',
      'Rules',
      'Members',
      'Billing',
      'Audit log',
    ].map((label) => expect(appShellPage.commandItem(label)).toBeVisible()),
  )
  await appShellPage.commandItem('Rules').click()

  await expect(authenticatedPage).toHaveURL(/\/rules$/)
  await expect(authenticatedPage.getByRole('tab', { name: /Coverage/ })).toHaveAttribute(
    'aria-selected',
    'true',
  )

  await appShellPage.openCommandPalette()
  await expect(appShellPage.commandDialog).toBeVisible()
  await appShellPage.commandItem('Import clients').click()

  await expect(migrationWizardPage.dialog).toBeVisible()
  await expect(migrationWizardPage.pasteClientData).toBeVisible()
})
