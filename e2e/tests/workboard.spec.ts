import { expect, test } from '../fixtures/test'

// Feature: Workboard obligation queue
// PRD: S1 protected workboard entry
// AC: E2E-WORKBOARD-FILTERS, E2E-WORKBOARD-STATUS

test.skip(
  Boolean(process.env.E2E_BASE_URL),
  'local e2e auth seed is not available on external targets',
)

test.describe('seeded workboard', () => {
  test.use({ authSeed: 'workboard' })

  test('AC: E2E-WORKBOARD-FILTERS searches, filters, and sorts real queue rows', async ({
    authenticatedPage,
    workboardPage,
  }) => {
    await workboardPage.goto()

    await expect(workboardPage.heading).toBeVisible()
    await expect(authenticatedPage.getByText('Arbor & Vale LLC')).toBeVisible()
    await expect(authenticatedPage.getByText('Northstar Dental Group')).toBeVisible()

    await workboardPage.searchInput.fill('Arbor')
    await expect(authenticatedPage).toHaveURL(/\/workboard\?q=Arbor$/)
    await expect(authenticatedPage.getByText('Arbor & Vale LLC')).toBeVisible()
    await expect(authenticatedPage.getByText('Northstar Dental Group')).toBeHidden()

    await workboardPage.resetButton.click()
    await workboardPage.statusFilter('In review').click()
    await expect(authenticatedPage).toHaveURL(/\/workboard\?status=review$/)
    await expect(authenticatedPage.getByText('Northstar Dental Group')).toBeVisible()
    await expect(authenticatedPage.getByText('Arbor & Vale LLC')).toBeHidden()

    await workboardPage.resetButton.click()
    await workboardPage.sortSelect.click()
    await authenticatedPage.getByRole('option', { name: 'Due date — latest first' }).click()
    await expect(authenticatedPage).toHaveURL(/\/workboard\?sort=due_desc$/)
  })

  test('AC: E2E-WORKBOARD-STATUS updates status through oRPC and audit toast', async ({
    authenticatedPage,
    workboardPage,
  }) => {
    await workboardPage.goto()

    await workboardPage.statusSelectFor('Arbor & Vale LLC').click()
    await authenticatedPage.getByRole('option', { name: 'Done' }).click()

    await expect(authenticatedPage.getByText('Status updated')).toBeVisible()
    await expect(authenticatedPage.getByText(/Audit [a-f0-9-]{8}/)).toBeVisible()
    await expect(
      workboardPage.rowFor('Arbor & Vale LLC').getByText('Done', { exact: true }),
    ).toBeVisible()
  })
})
