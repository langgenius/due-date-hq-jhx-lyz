import { expect, test } from '../fixtures/test'

const AI_STEP_TIMEOUT = 20_000

// Feature: Migration Copilot Step 1
// PRD: S2 import intake
// AC: E2E-MIGRATION-INTAKE, E2E-MIGRATION-SSN-BLOCK, E2E-MIGRATION-DISCARD,
//     E2E-MIGRATION-IMPORT-UNDO

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

test('AC: E2E-MIGRATION-IMPORT-UNDO imports from the wizard and reverts from toast', async ({
  appShellPage,
  authenticatedPage,
  migrationWizardPage,
  workboardPage,
}) => {
  const importedClient = 'Undoable Migration LLC'

  await appShellPage.goto()
  await appShellPage.importClientsButton.click()

  await expect(migrationWizardPage.dialog).toBeVisible()
  await migrationWizardPage.presetButton('TaxDome').click()
  await migrationWizardPage.pasteRows(
    [
      'Client Name,EIN,State,Entity Type,Tax Types',
      `${importedClient},12-3456789,CA,C Corp,federal_1120; ca_100_franchise`,
    ].join('\n'),
  )

  await migrationWizardPage.continue()
  await expect(
    authenticatedPage.getByRole('heading', { name: 'AI mapped your columns — review and confirm' }),
  ).toBeVisible({ timeout: AI_STEP_TIMEOUT })

  await migrationWizardPage.continue()
  await expect(
    authenticatedPage.getByRole('heading', { name: /We normalized \d+ values/ }),
  ).toBeVisible({ timeout: AI_STEP_TIMEOUT })

  await migrationWizardPage.continue()
  await expect(authenticatedPage.getByRole('heading', { name: 'Ready to import' })).toBeVisible()
  await expect(authenticatedPage.getByText('1 client')).toBeVisible()

  await migrationWizardPage.importAndGenerate()

  await expect(authenticatedPage.getByText('Import complete')).toBeVisible()
  await expect(authenticatedPage.getByText(/1 clients, [1-9]\d* obligations/)).toBeVisible()

  await migrationWizardPage.openUndoImportConfirmation()
  await expect(migrationWizardPage.undoImportDialog).toBeVisible()
  await migrationWizardPage.confirmUndoImport()

  await expect(authenticatedPage).toHaveURL(/\/workboard$/)
  await expect(workboardPage.heading).toBeVisible()
  await expect(authenticatedPage.getByText('Import undone')).toBeVisible()
  await expect(workboardPage.rowFor(importedClient)).toBeHidden()
})

test('AC: E2E-MIGRATION-EXPOSURE imports tax inputs into Dashboard and Evidence drawer', async ({
  appShellPage,
  authenticatedPage,
  migrationWizardPage,
  workboardPage,
}) => {
  const importedClient = 'Exposure Migration Corp'
  await authenticatedPage.emulateMedia({ reducedMotion: 'reduce' })

  await appShellPage.goto()
  await appShellPage.importClientsButton.click()

  await expect(migrationWizardPage.dialog).toBeVisible()
  await migrationWizardPage.presetButton('TaxDome').click()
  await migrationWizardPage.pasteRows(
    [
      'Client Name,EIN,State,Entity Type,Estimated Tax Due,Owner Count',
      `${importedClient},12-3456789,CA,C Corp,"$75,000",1`,
    ].join('\n'),
  )

  await migrationWizardPage.continue()
  await expect(
    authenticatedPage.getByRole('heading', { name: 'AI mapped your columns — review and confirm' }),
  ).toBeVisible({ timeout: AI_STEP_TIMEOUT })

  await migrationWizardPage.continue()
  await expect(
    authenticatedPage.getByRole('heading', { name: /We normalized \d+ values/ }),
  ).toBeVisible({ timeout: AI_STEP_TIMEOUT })

  await migrationWizardPage.continue()
  await expect(authenticatedPage.getByRole('heading', { name: 'Ready to import' })).toBeVisible()
  await expect(authenticatedPage.getByText('Exposure preview')).toBeVisible()
  await expect(authenticatedPage.getByText(/\$[1-9][\d,.]*\.\d{2}/).first()).toBeVisible()

  await migrationWizardPage.importAndGenerate()

  await expect(authenticatedPage.getByText('Import complete')).toBeVisible()
  await expect(authenticatedPage).toHaveURL(/\/$/)
  await expect(authenticatedPage.getByText('Penalty Radar')).toBeVisible()
  await expect(authenticatedPage.getByText(/\$[1-9][\d,.]*\.\d{2}/).first()).toBeVisible()

  await appShellPage.workboardLink.click()
  const importedRow = workboardPage.rowFor(importedClient).first()
  await expect(importedRow).toBeVisible()
  await expect(importedRow).toContainText('$')
  await importedRow.getByRole('button', { name: `Open evidence for ${importedClient}` }).click()
  await expect(authenticatedPage.getByRole('dialog', { name: 'Evidence chain' })).toBeVisible()
  await expect(authenticatedPage.getByText('Source timeline')).toBeVisible()
})
