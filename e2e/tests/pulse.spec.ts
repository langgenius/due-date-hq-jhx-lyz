import type { APIRequestContext, Cookie, Page } from '@playwright/test'
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
    auditPage,
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
    await expect(auditPage.eventRowFor('pulse.apply')).toBeVisible()
    await expect(auditPage.eventRowFor('pulse.apply')).toContainText('Pulse applied')

    await appShellPage.goto('/?asOfDate=2026-05-03&triage=long_term')
    await expect(authenticatedPage.getByText('Due this week', { exact: true })).toBeVisible()
    await expect(authenticatedPage.getByRole('tab', { name: /Long-term/ })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await expect(workboardPage.rowFor('Arbor & Vale LLC')).toContainText('2026-10-15')

    await appShellPage.goto('/rules?tab=pulse')
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

  test.describe('preparer role', () => {
    test.use({ authRole: 'preparer' })

    test('AC: E2E-PULSE-REQUEST-REVIEW notifies Owner/Manager without applying', async ({
      appShellPage,
      authSession,
      authenticatedPage,
      request,
    }) => {
      await appShellPage.goto()

      await authenticatedPage.getByRole('button', { name: 'Review', exact: true }).click()
      const drawer = authenticatedPage.getByRole('dialog')

      await expect(drawer.getByText('Read-only view')).toBeVisible()
      await expect(drawer.getByRole('button', { name: /Apply to 1 client/ })).toBeDisabled()
      await expect(drawer.getByRole('button', { name: 'Dismiss' })).toBeDisabled()
      await expect(drawer.getByRole('button', { name: 'Snooze 24h' })).toBeDisabled()
      await expect(drawer.getByRole('button', { name: 'Request review' })).toBeVisible()

      await drawer.getByRole('button', { name: 'Request review' }).click()
      const requestDialog = authenticatedPage.getByRole('dialog', { name: 'Request Pulse review' })
      await requestDialog
        .getByLabel('Optional note')
        .fill('Please confirm LA County applicability.')
      await requestDialog.getByRole('button', { name: 'Send request' }).click()
      await expect(authenticatedPage.getByText('Review requested')).toBeVisible()

      await switchToE2ERole({
        request,
        page: authenticatedPage,
        firmId: authSession.firmId,
        role: 'owner',
      })
      await authenticatedPage.goto('/notifications')
      const notification = authenticatedPage
        .getByRole('article')
        .filter({ hasText: 'Review requested: IRS CA storm relief' })
      await expect(notification).toContainText('E2E Preparer requested Owner/Manager review')
      await expect(notification).toContainText('Please confirm LA County applicability.')

      await notification.getByRole('link', { name: 'Open' }).click()
      await expect(authenticatedPage).toHaveURL(/\/rules\?tab=pulse&alert=/)
      await expect(
        authenticatedPage.getByRole('dialog').getByRole('heading', { name: /IRS CA storm relief/ }),
      ).toBeVisible()
    })
  })
})

async function switchToE2ERole(input: {
  request: APIRequestContext
  page: Page
  firmId: string
  role: 'owner' | 'manager'
}) {
  const response = await input.request.post('/api/e2e/switch-role', {
    data: { firmId: input.firmId, role: input.role },
    headers: e2eSeedHeaders(),
  })
  expect(response.ok()).toBe(true)
  const body: unknown = await response.json()
  if (!isSwitchRoleResponse(body)) {
    throw new Error('Invalid e2e switch-role response.')
  }
  await input.page.context().addCookies([body.cookie])
}

function e2eSeedHeaders(): Record<string, string> {
  return process.env.E2E_SEED_TOKEN ? { Authorization: `Bearer ${process.env.E2E_SEED_TOKEN}` } : {}
}

function isSwitchRoleResponse(value: unknown): value is { cookie: Cookie } {
  if (!value || typeof value !== 'object') return false
  const cookie = (value as { cookie?: unknown }).cookie
  return Boolean(cookie && typeof cookie === 'object')
}
