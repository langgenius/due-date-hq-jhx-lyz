import { expect, test } from '../fixtures/test'

// Feature: Audit log
// PRD: Firm-wide audit trail
// AC: E2E-AUDIT-WORKBOARD-STATUS-DETAIL

test.skip(
  Boolean(process.env.E2E_BASE_URL),
  'local e2e auth seed is not available on external targets',
)

test.describe('seeded audit trail', () => {
  test.use({ authSeed: 'workboard' })

  test('AC: E2E-AUDIT-WORKBOARD-STATUS-DETAIL traces a Workboard write into audit detail', async ({
    auditPage,
    authenticatedPage,
    workboardPage,
  }) => {
    await workboardPage.goto()

    await workboardPage.statusSelectFor('Arbor & Vale LLC').click()
    await workboardPage.statusChangeOption('Done').click()

    await expect(authenticatedPage.getByText('Status updated')).toBeVisible()

    await auditPage.goto()
    await expect(auditPage.heading).toBeVisible()
    await auditPage.actionInput.fill('obligation.status.updated')

    await expect(authenticatedPage).toHaveURL(/\/audit\?action=obligation\.status\.updated$/)
    await expect(auditPage.eventRowFor('obligation.status.updated')).toBeVisible()

    await auditPage.eventRowFor('obligation.status.updated').click()

    await expect(auditPage.detailDrawer).toBeVisible()
    await expect(auditPage.detailDrawer.getByText('obligation.status.updated')).toBeVisible()
    await expect(auditPage.detailDrawer.getByText('Before')).toBeVisible()
    await expect(auditPage.detailDrawer.getByText('After')).toBeVisible()
    await expect(auditPage.detailDrawer.getByText('"status": "pending"')).toBeVisible()
    await expect(auditPage.detailDrawer.getByText('"status": "done"')).toBeVisible()
  })
})
