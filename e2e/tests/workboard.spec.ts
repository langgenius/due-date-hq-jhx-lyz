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

    await expect(authenticatedPage.getByText('Triage queue', { exact: true })).toBeVisible()
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

  test('AC: E2E-DASHBOARD-FILTERS keeps header filters open while updating table data', async ({
    authenticatedPage,
  }) => {
    await authenticatedPage.goto('/')

    const triageTable = authenticatedPage
      .locator('[data-slot="card"]')
      .filter({ has: authenticatedPage.getByText('Triage queue', { exact: true }) })
      .getByRole('table')
    const dashboardHeaderButton = (name: string) =>
      triageTable
        .locator('th')
        .filter({ hasText: new RegExp(`^${name}$`) })
        .locator('button')
        .first()

    await dashboardHeaderButton('Status').click()
    await authenticatedPage.getByRole('menuitemcheckbox', { name: /Needs review/ }).click()
    await expect(authenticatedPage).toHaveURL(/\/\?status=review$/)
    await expect(triageTable.getByRole('row', { name: /Northstar Dental Group/ })).toBeVisible()
    await expect(triageTable.getByRole('row', { name: /Arbor & Vale LLC/ })).toBeHidden()
    await expect(
      authenticatedPage.getByRole('menuitemcheckbox', { name: /Needs review/ }),
    ).toBeVisible()

    await authenticatedPage.goto('/')
    await dashboardHeaderButton('Deadline').click()
    await authenticatedPage.getByRole('menuitemcheckbox', { name: /Today/ }).click()
    await expect(authenticatedPage).toHaveURL(/\/\?due=today$/)
    await expect(triageTable.getByRole('row', { name: /Unassigned Foundry LLC/ })).toBeVisible()
    await expect(triageTable.getByRole('row', { name: /Arbor & Vale LLC/ })).toBeHidden()
    await expect(authenticatedPage.getByRole('menuitemcheckbox', { name: /Today/ })).toBeVisible()
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
    await workboardPage.statusFilterOption('Needs review').click()
    await expect(authenticatedPage).toHaveURL(/\/workboard\?status=review$/)
    await expect(authenticatedPage.getByText('Northstar Dental Group')).toBeVisible()
    await expect(authenticatedPage.getByText('Arbor & Vale LLC')).toBeHidden()
    await expect(workboardPage.statusFilterOption('Needs review')).toBeVisible()
    await authenticatedPage.keyboard.press('Escape')

    await workboardPage.resetButton.click()
    await expect(authenticatedPage).toHaveURL(/\/workboard$/)
    await workboardPage.sortSelect.click()
    await authenticatedPage.getByRole('option', { name: 'Due date — latest first' }).click()
    await expect(authenticatedPage).toHaveURL(/\/workboard\?sort=due_desc$/)
  })

  test('AC: E2E-WORKBOARD-DETAIL opens the obligation drawer from a row click', async ({
    authenticatedPage,
    workboardPage,
  }) => {
    await workboardPage.goto()

    await workboardPage.openDetailFor('Arbor & Vale LLC')
    await expect(authenticatedPage).toHaveURL(/drawer=obligation/)
    await expect(authenticatedPage).toHaveURL(/tab=readiness/)
    await expect(authenticatedPage.getByRole('dialog', { name: /Arbor & Vale LLC/ })).toBeVisible()
    await expect(authenticatedPage.getByRole('tab', { name: 'Readiness' })).toBeVisible()
    await expect(authenticatedPage.getByRole('tab', { name: 'Extension' })).toBeVisible()
    await expect(authenticatedPage.getByRole('tab', { name: 'Risk' })).toBeVisible()
    await expect(authenticatedPage.getByRole('tab', { name: 'Evidence' })).toBeVisible()
    await expect(authenticatedPage.getByRole('tab', { name: 'Audit' })).toBeVisible()

    const checklistLabels = authenticatedPage.getByLabel('Checklist item label')
    const checklistCount = await checklistLabels.count()
    await authenticatedPage.getByRole('button', { name: 'Add item' }).click()
    await expect(checklistLabels).toHaveCount(checklistCount + 1)
    await checklistLabels.last().fill('E2E removable checklist item')
    await authenticatedPage.getByRole('button', { name: 'Remove checklist item' }).last().click()
    await expect(checklistLabels).toHaveCount(checklistCount)
  })

  test('AC: E2E-WORKBOARD-STATUS updates status through oRPC and audit toast', async ({
    authenticatedPage,
    workboardPage,
  }) => {
    await workboardPage.goto()

    await workboardPage.statusSelectFor('Arbor & Vale LLC').click()
    await workboardPage.statusChangeOption('Filed').click()

    await expect(authenticatedPage.getByText('Status updated')).toBeVisible()
    await expect(authenticatedPage.getByText(/Audit [a-f0-9-]{8}/)).toBeVisible()
    await expect(workboardPage.statusSelectFor('Arbor & Vale LLC')).toContainText('Filed')

    await workboardPage.readinessSelectFor('Arbor & Vale LLC').click()
    await workboardPage.readinessChangeOption('Waiting').click()

    await expect(authenticatedPage.getByText('Readiness updated')).toBeVisible()
    await expect(workboardPage.readinessSelectFor('Arbor & Vale LLC')).toContainText('Waiting')

    await authenticatedPage.keyboard.press('P')
    await expect(workboardPage.statusSelectFor('Arbor & Vale LLC')).toContainText('Paid')
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
    await authenticatedPage.getByRole('button', { name: 'Change readiness', exact: true }).click()
    await authenticatedPage.getByRole('menuitem', { name: 'Needs review' }).click()
    await expect(authenticatedPage.getByText('Bulk readiness updated')).toBeVisible()
    await expect(workboardPage.readinessSelectFor('Arbor & Vale LLC')).toContainText('Needs review')

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
