import type { Locator } from '@playwright/test'
import { seedBillingSubscription } from '../fixtures/billing'
import { expect, test } from '../fixtures/test'

// Feature: Team workload
// PRD: Firm shared deadline operations
// AC: E2E-WORKLOAD-SOLO-UPGRADE, E2E-WORKLOAD-FIRM-METRICS, E2E-WORKLOAD-WORKBOARD-LINKS

test.skip(
  Boolean(process.env.E2E_BASE_URL),
  'local e2e auth seed is not available on external targets',
)

test.describe('seeded team workload', () => {
  test.use({ authSeed: 'workboard' })

  test('AC: E2E-WORKLOAD-SOLO-UPGRADE keeps Solo locked but discoverable', async ({
    appShellPage,
    authenticatedPage,
    workloadPage,
  }) => {
    await appShellPage.goto()

    const sidebarItem = appShellPage.primaryNavigation.getByRole('link', {
      name: /Team workload.*Firm/,
    })
    await expect(sidebarItem).toHaveAttribute('aria-disabled', 'true')

    await workloadPage.goto()

    await expect(authenticatedPage).toHaveURL(/\/workload$/)
    await expect(workloadPage.upgradeHeading).toBeVisible()
    await expect(workloadPage.upgradeToFirmLink).toHaveAttribute('href', '/billing')
    await expect(workloadPage.openWorkboardLink).toHaveAttribute('href', '/workboard')
  })

  test('AC: E2E-WORKLOAD-FIRM-METRICS reads paid-plan workload from real queue rows', async ({
    authSession,
    request,
    workloadPage,
  }) => {
    await seedBillingSubscription(request, { firmId: authSession.firmId })

    await workloadPage.goto()

    await expect(workloadPage.ownerWorkloadHeading).toBeVisible()
    await expectWorkloadCells(workloadPage.rowFor('M. Chen'), ['M. Chen', '1', '0', '1', '0', '0'])
    await expectWorkloadCells(workloadPage.rowFor('A. Rivera'), [
      'A. Rivera',
      '1',
      '0',
      '1',
      '0',
      '1',
    ])
    await expectWorkloadCells(workloadPage.rowFor('Unassigned'), [
      /Unassigned/,
      '1',
      '1',
      '0',
      '0',
      '0',
      'Risk',
    ])
  })

  test('AC: E2E-WORKLOAD-WORKBOARD-LINKS deep-links workload triage into Workboard', async ({
    authSession,
    authenticatedPage,
    request,
    workboardPage,
    workloadPage,
  }) => {
    await seedBillingSubscription(request, { firmId: authSession.firmId })

    await workloadPage.goto()
    await workloadPage.rowFor('M. Chen').locator('td').nth(3).getByRole('link').click()

    await expect(authenticatedPage).toHaveURL(/\/workboard\?.*assignee=M\.(?:\+|%20)Chen/)
    await expect(authenticatedPage).toHaveURL(/\/workboard\?.*due=overdue/)
    await expect(workboardPage.heading).toBeVisible()
    await expect(authenticatedPage.getByText('Arbor & Vale LLC')).toBeVisible()
    await expect(authenticatedPage.getByText('Northstar Dental Group')).toBeHidden()

    await workloadPage.goto()
    await workloadPage.rowFor('Unassigned').getByRole('link', { name: 'Open' }).click()

    await expect(authenticatedPage).toHaveURL(/\/workboard\?owner=unassigned$/)
    await expect(authenticatedPage.getByText('Unassigned Foundry LLC')).toBeVisible()
    await expect(authenticatedPage.getByText('Copperline Studios')).toBeHidden()
  })
})

async function expectWorkloadCells(row: Locator, expected: Array<string | RegExp>): Promise<void> {
  await Promise.all(
    expected.map((value, index) => expect(row.locator('td').nth(index)).toContainText(value)),
  )
}
