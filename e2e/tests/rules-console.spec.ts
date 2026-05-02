import { expect, test } from '../fixtures/test'

// Feature: Rules
// PRD: Rules source registry and rule pack
// AC: E2E-RULES-TABS, E2E-RULES-DETAIL, E2E-RULES-PREVIEW

test.skip(
  Boolean(process.env.E2E_BASE_URL),
  'local e2e auth seed is not available on external targets',
)

test('AC: E2E-RULES-TABS persists implemented tab state', async ({
  authenticatedPage,
  rulesConsolePage,
}) => {
  await rulesConsolePage.goto()

  await expect(rulesConsolePage.coverageTab).toHaveAttribute('aria-selected', 'true')
  await expect(authenticatedPage.getByText('Verified rules', { exact: true })).toBeVisible()

  await rulesConsolePage.sourcesTab.click()
  await expect(authenticatedPage).toHaveURL(/\/rules\?tab=sources$/)
  await expect(
    authenticatedPage.getByText('IRS Publication 509 (2026), Tax Calendars'),
  ).toBeVisible()

  await rulesConsolePage.libraryTab.click()
  await expect(authenticatedPage).toHaveURL(/\/rules\?tab=library$/)
  await expect(authenticatedPage.getByText('fed.1065.return.2025')).toBeVisible()
})

test('AC: E2E-RULES-DETAIL opens a shipped rule detail drawer', async ({
  authenticatedPage,
  rulesConsolePage,
}) => {
  await rulesConsolePage.goto()
  await rulesConsolePage.libraryTab.click()
  await authenticatedPage
    .getByRole('button', {
      name: /Open rule detail: Federal Form 1065 return for partnerships/,
    })
    .click()

  await expect(
    authenticatedPage.getByRole('heading', {
      name: 'Federal Form 1065 return for partnerships',
    }),
  ).toBeVisible()
  await expect(authenticatedPage.getByText('Due date logic')).toBeVisible()
  await expect(authenticatedPage.getByText('Evidence', { exact: true })).toBeVisible()
})

test('AC: E2E-RULES-PREVIEW runs the implemented obligation preview', async ({
  authenticatedPage,
  rulesConsolePage,
}) => {
  await rulesConsolePage.goto()
  await rulesConsolePage.previewTab.click()

  await expect(authenticatedPage).toHaveURL(/\/rules\?tab=preview$/)
  await authenticatedPage.getByRole('button', { name: /Run preview/ }).click()

  await expect(authenticatedPage.getByText(/REMINDER READY/)).toBeVisible()
  await expect(authenticatedPage.getByText(/REQUIRES REVIEW/)).toBeVisible()
  await expect(
    authenticatedPage.getByText('Federal Form 1065 return for partnerships'),
  ).toBeVisible()
})
