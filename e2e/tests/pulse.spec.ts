import { expect, test } from '../fixtures/test'

// Feature: Pulse regulatory alert loop
// PRD: Phase 0 Pulse MVP
// AC: E2E-PULSE-APPLY-UNDO, E2E-PULSE-RBAC

test.skip(
  Boolean(process.env.E2E_BASE_URL) && !process.env.E2E_SEED_TOKEN,
  'remote Pulse canary requires E2E_SEED_TOKEN',
)

test.describe('seeded Pulse alerts', () => {
  test.describe.configure({ mode: 'serial' })
  test.use({ authSeed: 'pulse' })

  test('AC: E2E-PULSE-APPLY-UNDO applies, audits, links evidence, and reverts', async ({
    appShellPage,
    authenticatedPage,
    workboardPage,
  }) => {
    await appShellPage.goto()

    await expect(authenticatedPage.getByText('IRS Disaster Relief')).toBeVisible()
    await authenticatedPage.getByRole('button', { name: 'Review', exact: true }).click()

    const drawer = authenticatedPage.getByRole('dialog')
    await expect(drawer.getByText('Affected clients')).toBeVisible()
    await expect(drawer.getByText('Arbor & Vale LLC')).toBeVisible()
    await expect(drawer.getByText('Bright Studio S-Corp')).toBeVisible()
    await expect(drawer.getByText('Pulse evidence linked to each obligation')).toBeVisible()

    await drawer.getByRole('button', { name: /Apply to 1 client/ }).click()
    await expect(authenticatedPage.getByText(/Applied to 1 clients?/)).toBeVisible()

    await workboardPage.goto()
    const arborRow = workboardPage.rowFor('Arbor & Vale LLC')
    await expect(arborRow).toContainText('2026-10-15')
    const arborEvidenceButton = arborRow.getByRole('button', {
      name: 'Open evidence for Arbor & Vale LLC',
    })
    await expect(arborEvidenceButton).toHaveText('1')
    await arborEvidenceButton.click()
    const evidenceDrawer = authenticatedPage.getByRole('dialog', { name: 'Evidence chain' })
    await expect(evidenceDrawer.getByText('pulse_apply')).toBeVisible()
    await evidenceDrawer.getByRole('button', { name: 'Close' }).click()
    await expect(workboardPage.rowFor('Bright Studio S-Corp')).toContainText('2026-03-15')

    await appShellPage.goto('/audit?action=pulse.apply&range=all')
    await expect(authenticatedPage.getByText('pulse.apply')).toBeVisible()

    await appShellPage.goto('/')
    await expect(authenticatedPage.getByText('pulse_apply')).toBeVisible()

    await appShellPage.goto('/alerts')
    await authenticatedPage.getByRole('button', { name: 'Review' }).first().click()
    await authenticatedPage.getByRole('button', { name: 'Undo (24h)' }).click()
    await expect(authenticatedPage.getByText(/Reverted 1 clients?/)).toBeVisible()

    await workboardPage.goto()
    await expect(workboardPage.rowFor('Arbor & Vale LLC')).toContainText('2026-03-15')
  })

  test.describe('coordinator role', () => {
    test.use({ authRole: 'coordinator' })

    test('AC: E2E-PULSE-RBAC keeps Pulse mutations read-only', async ({
      appShellPage,
      authenticatedPage,
    }) => {
      await appShellPage.goto()

      await authenticatedPage.getByRole('button', { name: 'Review', exact: true }).click()
      const drawer = authenticatedPage.getByRole('dialog')

      await expect(drawer.getByText('Read-only view')).toBeVisible()
      await expect(
        drawer.getByText('Only Owners and Managers can apply Pulse changes.'),
      ).toBeVisible()
      await expect(drawer.getByRole('button', { name: /Apply to 1 client/ })).toBeDisabled()
      await expect(drawer.getByRole('button', { name: 'Dismiss' })).toBeDisabled()
      await expect(drawer.getByRole('button', { name: 'Snooze 24h' })).toBeDisabled()
    })
  })
})
