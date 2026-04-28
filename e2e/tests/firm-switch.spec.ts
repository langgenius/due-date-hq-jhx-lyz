import { expect, test } from '../fixtures/test'

// Feature: Firm creation and switching
// PRD: P1 tenant foundation
// AC: E2E-FIRM-CREATE-SWITCH

test.skip(
  Boolean(process.env.E2E_BASE_URL),
  'local e2e auth seed is not available on external targets',
)

test('AC: E2E-FIRM-CREATE-SWITCH creates a separate firm and switches context', async ({
  authenticatedPage,
  authSession,
}) => {
  const firmName = `E2E Advisory ${authSession.user.id.slice(-8)}`
  const timezone = 'America/Los_Angeles'
  const slugPrefix = slugBody(firmName)

  await authenticatedPage.goto('/settings/profile')

  await expect(
    authenticatedPage.getByRole('heading', { name: 'Firm profile', level: 1 }),
  ).toBeVisible()
  await expect(authenticatedPage.getByLabel('Firm name')).toHaveValue('E2E Practice')
  await expect(authenticatedPage.getByText('Active firm · solo plan · 1 seat limit')).toBeVisible()

  await authenticatedPage.getByRole('button', { name: /Switch firm/ }).click()
  await authenticatedPage.getByRole('menuitem', { name: 'Add firm' }).click()

  const dialog = authenticatedPage.getByRole('dialog', { name: 'Add firm' })
  await expect(dialog).toBeVisible()
  await dialog.getByLabel('Firm name').fill(firmName)
  await dialog.getByLabel('Timezone').fill(timezone)
  await dialog.getByRole('button', { name: 'Create firm' }).click()

  await expect(dialog).toBeHidden()
  await expect(
    authenticatedPage.getByRole('button', {
      name: new RegExp(`Switch firm.*${escapeRegExp(firmName)}`),
    }),
  ).toBeVisible()

  await authenticatedPage.goto('/settings/profile')

  await expect(authenticatedPage.getByLabel('Firm name')).toHaveValue(firmName)
  await expect(authenticatedPage.getByLabel('Timezone')).toHaveValue(timezone)
  await expect(authenticatedPage.getByText('Active firm · solo plan · 1 seat limit')).toBeVisible()
  await expect(authenticatedPage.locator('body')).not.toContainText(
    new RegExp(`${escapeRegExp(slugPrefix)}-[a-z2-9]{6}`),
  )
})

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
