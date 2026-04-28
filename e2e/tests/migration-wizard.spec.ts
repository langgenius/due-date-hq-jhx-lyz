import { expect, test } from '../fixtures/test'

// Feature: Migration Copilot Step 1
// PRD: S2 import intake
// AC: E2E-MIGRATION-INTAKE, E2E-MIGRATION-SSN-BLOCK, E2E-MIGRATION-DISCARD

test.skip(
  Boolean(process.env.E2E_BASE_URL),
  'local e2e auth seed is not available on external targets',
)

test('AC: E2E-MIGRATION-INTAKE parses pasted rows and protects discard', async ({
  appShellPage,
  authenticatedPage,
  migrationWizardPage,
}) => {
  await appShellPage.goto()
  await appShellPage.importClientsButton.click()

  await expect(migrationWizardPage.dialog).toBeVisible()
  await migrationWizardPage.pasteRows(
    [
      'Client Name,Entity Type,State,Tax ID,SSN',
      'Arbor & Vale LLC,LLC,CA,12-3456789,123-45-6789',
      'Northstar Dental Group,S Corp,NY,98-7654321,987-65-4321',
    ].join('\n'),
  )

  await expect(authenticatedPage.getByText('2 rows ready to import')).toBeVisible()
  await expect(authenticatedPage.getByRole('alert')).toContainText('SSN-like columns blocked')
  await expect(authenticatedPage.getByRole('alert')).toContainText('SSN')

  await migrationWizardPage.closeButton.click()
  await expect(migrationWizardPage.discardDialog).toBeVisible()
  await authenticatedPage.getByRole('button', { name: 'Keep editing' }).click()
  await expect(migrationWizardPage.dialog).toBeVisible()
})
