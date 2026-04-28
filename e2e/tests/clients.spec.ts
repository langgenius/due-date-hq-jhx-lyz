import { expect, test } from '../fixtures/test'

// Feature: Clients management
// PRD: P1 client directory
// AC: E2E-CLIENTS-NAV, E2E-CLIENTS-CREATE

test.skip(
  Boolean(process.env.E2E_BASE_URL),
  'local e2e auth seed is not available on external targets',
)

test('AC: E2E-CLIENTS-NAV opens the Clients directory from the shell', async ({
  appShellPage,
  authenticatedPage,
  clientsPage,
}) => {
  await appShellPage.goto()
  await appShellPage.clientsLink.click()

  await expect(authenticatedPage).toHaveURL(/\/clients$/)
  await expect(appShellPage.clientsLink).toHaveAttribute('aria-current', 'page')
  await expect(clientsPage.directoryTitle).toBeVisible()
  await expect(clientsPage.searchInput).toBeVisible()
})

test('AC: E2E-CLIENTS-CREATE creates a manual client through oRPC', async ({
  authenticatedPage,
  clientsPage,
}) => {
  const clientName = 'E2E Harbor Advisory LLC'

  await clientsPage.goto()
  await clientsPage.createClient({
    name: clientName,
    ein: '23-4567890',
    state: 'CA',
    county: 'Alameda',
    email: 'harbor@example.com',
    owner: 'E2E Owner',
  })

  await expect(authenticatedPage.getByText('Client created')).toBeVisible()
  await expect(clientsPage.rowFor(clientName)).toBeVisible()
  await expect(clientsPage.rowFor(clientName)).toContainText('23-4567890')
  await expect(clientsPage.rowFor(clientName)).toContainText('E2E Owner')
})
