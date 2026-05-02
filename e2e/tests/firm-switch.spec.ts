import type { Page } from '@playwright/test'
import { seedBillingSubscription } from '../fixtures/billing'
import { expect, test } from '../fixtures/test'

// Feature: Firm creation and switching
// PRD: P1 tenant foundation
// AC: E2E-FIRM-CREATE-SWITCH

test.skip(
  Boolean(process.env.E2E_BASE_URL),
  'local e2e auth seed is not available on external targets',
)

test('AC: E2E-FIRM-CREATE-GATE blocks extra self-serve firm creation', async ({
  authenticatedPage,
}) => {
  await authenticatedPage.goto('/firm')

  await expect(
    authenticatedPage.getByRole('heading', { name: 'Practice profile', level: 1 }),
  ).toBeVisible()
  await expect(authenticatedPage.getByLabel('Practice name')).toHaveValue('E2E Practice')
  await expectActiveFirmSummary(authenticatedPage, { plan: 'Solo', seatLimit: 1 })

  await authenticatedPage.getByRole('button', { name: /Switch firm/ }).click()
  await authenticatedPage.getByRole('menuitem', { name: 'Add firm' }).click()

  const dialog = authenticatedPage.getByRole('dialog', { name: 'Add firm' })
  await expect(dialog).toBeVisible()
  await expect(dialog.getByText('1 of 1 included')).toBeVisible()
  await expect(dialog.getByText(/Solo and Pro include one active firm workspace/)).toBeVisible()
  await expect(dialog.getByLabel('Firm name')).toBeHidden()

  await dialog.getByRole('link', { name: 'Review plans' }).click()
  await expect(authenticatedPage).toHaveURL(/\/billing$/)
  await expect(authenticatedPage.getByRole('heading', { name: 'Billing', level: 1 })).toBeVisible()
  await expect(authenticatedPage.getByText('1 of 1 active firms', { exact: true })).toBeVisible()
})

test('AC: E2E-FIRM-CREATE-SWITCH creates a separate firm on the Firm plan', async ({
  authenticatedPage,
  authSession,
  request,
}) => {
  const firmName = `E2E Advisory ${authSession.user.id.slice(-8)}`
  const timezone = 'America/Los_Angeles'
  const slugPrefix = slugBody(firmName)

  await seedBillingSubscription(request, { firmId: authSession.firmId, plan: 'firm' })
  await authenticatedPage.goto('/firm')

  await expect(
    authenticatedPage.getByRole('heading', { name: 'Practice profile', level: 1 }),
  ).toBeVisible()
  await expect(authenticatedPage.getByLabel('Practice name')).toHaveValue('E2E Practice')
  await expectActiveFirmSummary(authenticatedPage, { plan: 'Firm', seatLimit: 10 })

  await authenticatedPage.getByRole('button', { name: /Switch firm/ }).click()
  await authenticatedPage.getByRole('menuitem', { name: 'Add firm' }).click()

  const dialog = authenticatedPage.getByRole('dialog', { name: 'Add firm' })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Firm name').fill(firmName)
  await dialog.getByLabel('Timezone').click()
  await authenticatedPage.getByRole('option', { name: /Pacific.*America\/Los_Angeles/ }).click()
  await dialog.getByRole('button', { name: 'Create firm' }).click()

  await expect(dialog).toBeHidden()
  await expect(
    authenticatedPage.getByRole('button', {
      name: new RegExp(`Switch firm.*${escapeRegExp(firmName)}`),
    }),
  ).toBeVisible()

  await authenticatedPage.goto('/firm')

  await expect(authenticatedPage.getByLabel('Practice name')).toHaveValue(firmName)
  await expect(authenticatedPage.getByLabel('Timezone')).toContainText(timezone)
  await expectActiveFirmSummary(authenticatedPage, { plan: 'Solo', seatLimit: 1 })
  await expect(authenticatedPage.locator('body')).not.toContainText(
    new RegExp(`${escapeRegExp(slugPrefix)}-[a-z2-9]{6}`),
  )
})

async function expectActiveFirmSummary(
  page: Page,
  expected: { plan: string; seatLimit: number },
): Promise<void> {
  const summary = page.getByRole('note', { name: 'Active practice summary' })
  await expect(summary).toContainText(new RegExp(`\\b${escapeRegExp(expected.plan)}\\b`))
  await expect(summary).toContainText(new RegExp(`\\b${expected.seatLimit}\\b`))
}

function slugBody(value: string): string {
  return (
    value
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'practice'
  )
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
