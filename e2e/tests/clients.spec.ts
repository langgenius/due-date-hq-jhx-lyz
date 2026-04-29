import { expect, test } from '../fixtures/test'

// Feature: Clients management
// PRD: P1 client directory
// AC: E2E-CLIENTS-NAV, E2E-CLIENTS-CREATE, E2E-CLIENTS-FACTS-SEED,
// E2E-CLIENTS-FILTERS, E2E-CLIENTS-FACT-PROFILE

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
  await expect(clientsPage.entityFilter).toContainText('All entities')
  await expect(clientsPage.stateFilter).toContainText('All states')
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
  await expect(clientsPage.rowFor(clientName)).toContainText('E2E Owner')
  await clientsPage.rowFor(clientName).click()
  await expect(authenticatedPage.getByRole('dialog', { name: 'Fact profile' })).toBeVisible()
  await expect(authenticatedPage.getByText('23-4567890')).toBeVisible()
})

test.describe('seeded client facts', () => {
  test.use({ authSeed: 'workboard' })

  test('AC: E2E-CLIENTS-FACTS-SEED summarizes ready seeded clients', async ({ clientsPage }) => {
    await clientsPage.goto()

    await expect(clientsPage.metricCard('Ready for rules')).toContainText('4')
    await expect(clientsPage.metricCard('Needs facts')).toContainText('0')
    await expect(clientsPage.metricCard('Imported')).toContainText('0')
    await expect(clientsPage.metricCard('Imported')).toContainText('4 manual records')
    await expect(clientsPage.metricCard('States covered')).toContainText('3')

    await expect(clientsPage.rowFor('Arbor & Vale LLC')).toContainText('Ready for rules')
    await expect(clientsPage.rowFor('Arbor & Vale LLC')).toContainText('LLC')
    await expect(clientsPage.rowFor('Arbor & Vale LLC')).toContainText('CA / Los Angeles')
    await expect(clientsPage.rowFor('Arbor & Vale LLC')).toContainText('Manual')
    await expect(clientsPage.rowFor('Arbor & Vale LLC')).toContainText('M. Chen')
    await expect(clientsPage.rowFor('Unassigned Foundry LLC')).toContainText('Unassigned')
  })

  test('AC: E2E-CLIENTS-FILTERS persists entity, state, search, and empty results', async ({
    authenticatedPage,
    clientsPage,
  }) => {
    await clientsPage.goto()

    await clientsPage.selectEntityFilter('S corp')
    await expect(authenticatedPage).toHaveURL(/\/clients\?entity=s_corp$/)
    await expect(clientsPage.rowFor('Northstar Dental Group')).toBeVisible()
    await expect(clientsPage.rowFor('Arbor & Vale LLC')).toBeHidden()

    await clientsPage.selectStateFilter('NY')
    await expect(authenticatedPage).toHaveURL(/entity=s_corp/)
    await expect(authenticatedPage).toHaveURL(/state=NY/)
    await expect(clientsPage.rowFor('Northstar Dental Group')).toBeVisible()

    await clientsPage.searchInput.fill('northstar')
    await expect(authenticatedPage).toHaveURL(/q=northstar/)
    await expect(clientsPage.rowFor('Northstar Dental Group')).toBeVisible()

    await clientsPage.searchInput.fill('No matching firm')
    await expect(clientsPage.filteredEmptyState).toBeVisible()
    await expect(
      authenticatedPage.getByText('Clear search or filters to return to the full firm directory.'),
    ).toBeVisible()
  })

  test('AC: E2E-CLIENTS-FACT-PROFILE opens seeded client facts from the table', async ({
    authenticatedPage,
    clientsPage,
  }) => {
    await clientsPage.goto()

    await clientsPage.rowFor('Unassigned Foundry LLC').click()

    await expect(clientsPage.factProfileDialog).toBeVisible()
    await expect(clientsPage.factProfileDialog.getByText('Unassigned Foundry LLC')).toBeVisible()
    await expect(clientsPage.factProfileDialog.getByText('LLC', { exact: true })).toBeVisible()
    await expect(clientsPage.factProfileDialog.getByText('Manual')).toBeVisible()
    await expect(clientsPage.factProfileDialog.getByText('Ready for rules')).toBeVisible()
    await expect(clientsPage.factProfileDialog.getByText('CA / San Diego')).toBeVisible()
    await expect(clientsPage.factProfileDialog.getByText('37-2222222')).toBeVisible()
    await expect(clientsPage.factProfileDialog.getByText('Fact readiness')).toBeVisible()
    await expect(clientsPage.factProfileDialog.getByText('State jurisdiction')).toBeVisible()
    await expect(clientsPage.factProfileDialog.getByText('Entity type')).toBeVisible()
    await expect(authenticatedPage).toHaveURL(/\/clients\?client=/)
  })
})
