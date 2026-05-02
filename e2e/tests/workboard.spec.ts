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

  test('AC: E2E-DASHBOARD-TRIAGE syncs tabs to URL and opens matching Workboard view', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/')

    await expect(authenticatedPage.getByText('Triage queue')).toBeVisible()
    await expect(authenticatedPage.getByRole('tab', { name: /This Week/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    await authenticatedPage.getByRole('tab', { name: /This Month/ }).click()
    await expect(authenticatedPage).toHaveURL(/\/\?triage=this_month$/)
    await expect(authenticatedPage.getByRole('tab', { name: /This Month/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )

    await authenticatedPage.getByRole('button', { name: 'Open full Workboard' }).click()
    await expect(authenticatedPage).toHaveURL(/\/workboard\?daysMin=8&daysMax=30$/)
  })

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
    await expect(authenticatedPage).toHaveURL(/\/workboard$/)
    await workboardPage.openStatusFilter()
    await workboardPage.statusFilterOption('In review').click()
    await expect(authenticatedPage).toHaveURL(/\/workboard\?status=review$/)
    await expect(authenticatedPage.getByText('Northstar Dental Group')).toBeVisible()
    await expect(authenticatedPage.getByText('Arbor & Vale LLC')).toBeHidden()
    await expect(workboardPage.statusFilterOption('In review')).toBeVisible()
    await authenticatedPage.keyboard.press('Escape')

    await workboardPage.resetButton.click()
    await expect(authenticatedPage).toHaveURL(/\/workboard$/)
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
    await workboardPage.statusChangeOption('Done').click()

    await expect(authenticatedPage.getByText('Status updated')).toBeVisible()
    await expect(authenticatedPage.getByText(/Audit [a-f0-9-]{8}/)).toBeVisible()
    await expect(workboardPage.statusSelectFor('Arbor & Vale LLC')).toContainText('Done')
  })

  test('AC: E2E-WORKBOARD-COMPLETE saves a view, changes density/columns, and bulk updates rows', async ({
    authenticatedPage,
    workboardPage,
  }) => {
    await workboardPage.goto()

    await workboardPage.compactTab.click()
    await expect(authenticatedPage).toHaveURL(/\/workboard\?density=compact$/)

    await workboardPage.columnsButton.click()
    await workboardPage.columnVisibilityOption('County').click()
    await authenticatedPage.keyboard.press('Escape')
    await expect(authenticatedPage).toHaveURL(/hide=clientCounty/)

    await workboardPage.searchInput.fill('Arbor')
    await expect(authenticatedPage).toHaveURL(/q=Arbor/)

    await workboardPage.savedViewsButton.click()
    await workboardPage.savedViewMenuItem('Save current view').click()
    await authenticatedPage.getByLabel('Saved view name').fill('E2E Arbor compact')
    await authenticatedPage.getByRole('button', { name: 'Save view' }).click()
    await expect(authenticatedPage.getByText('Saved view created')).toBeVisible()

    await workboardPage.resetButton.click()
    await expect(authenticatedPage).toHaveURL(/\/workboard$/)
    await workboardPage.savedViewsButton.click()
    await workboardPage.savedViewMenuItem('Apply view').click()
    await expect(authenticatedPage).toHaveURL(/q=Arbor/)
    await expect(authenticatedPage).toHaveURL(/density=compact/)
    await expect(authenticatedPage).toHaveURL(/hide=clientCounty/)

    await workboardPage.savedViewsButton.click()
    await workboardPage.savedViewMenuItem('Rename view').click()
    await authenticatedPage.getByLabel('Saved view name').fill('E2E renamed view')
    await authenticatedPage.getByRole('button', { name: 'Save view' }).click()
    await expect(authenticatedPage.getByText('Saved view updated')).toBeVisible()

    await workboardPage.savedViewsButton.click()
    await workboardPage.savedViewMenuItem('Delete view').click()
    await expect(authenticatedPage.getByText('Saved view deleted')).toBeVisible()

    await workboardPage.resetButton.click()
    await workboardPage.selectRow('Arbor & Vale LLC').click()
    await authenticatedPage.getByRole('button', { name: 'Change assignee' }).click()
    await authenticatedPage.getByRole('menuitem', { name: 'E2E Owner' }).click()
    await expect(authenticatedPage.getByText('Owners updated')).toBeVisible()
    await expect(workboardPage.rowFor('Arbor & Vale LLC')).toContainText('E2E Owner')

    await workboardPage.selectRow('Arbor & Vale LLC').click()
    await workboardPage.selectRow('Northstar Dental Group').click()
    const [csvDownload] = await Promise.all([
      authenticatedPage.waitForEvent('download'),
      authenticatedPage.getByRole('button', { name: 'CSV' }).click(),
    ])
    expect(csvDownload.suggestedFilename()).toMatch(/^workboard-\d{4}-\d{2}-\d{2}\.csv$/)
    const [zipDownload] = await Promise.all([
      authenticatedPage.waitForEvent('download'),
      authenticatedPage.getByRole('button', { name: 'PDF zip' }).click(),
    ])
    expect(zipDownload.suggestedFilename()).toMatch(/^workboard-pdfs-\d{4}-\d{2}-\d{2}\.zip$/)
    await authenticatedPage.getByRole('button', { name: 'Mark extended' }).click()
    await authenticatedPage.getByLabel('Extension memo').fill('E2E extension memo')
    await authenticatedPage
      .getByRole('dialog')
      .getByRole('button', { name: 'Mark extended' })
      .click()
    await expect(authenticatedPage.getByText('Bulk status updated')).toBeVisible()
    await expect(workboardPage.statusSelectFor('Arbor & Vale LLC')).toContainText('Extended')
  })
})
