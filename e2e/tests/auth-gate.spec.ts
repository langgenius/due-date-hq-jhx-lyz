import { expect, test } from '../fixtures/test'

// Feature: Entry auth gate
// PRD: S1 protected workbench entry
// AC: E2E-SMOKE-LOGIN, E2E-SMOKE-AUTH-REDIRECT

test('AC: E2E-SMOKE-LOGIN renders the login entry', async ({ loginPage, page }) => {
  await loginPage.goto()

  await expect(page).toHaveURL(/\/login$/)
  await expect(loginPage.heading).toBeVisible()
  await expect(loginPage.googleButton).toBeEnabled()
  await expect(loginPage.footerStatus).toBeVisible()
})

test('AC: E2E-SMOKE-AUTH-REDIRECT redirects root visitors to login', async ({
  loginPage,
  page,
}) => {
  await loginPage.goto('/')

  await expect(loginPage.googleButton).toBeVisible()

  const url = new URL(page.url())
  expect(url.pathname).toBe('/login')
  expect(url.searchParams.has('redirectTo')).toBe(false)
})

test('AC: E2E-SMOKE-AUTH-REDIRECT preserves protected route query params', async ({
  loginPage,
  page,
}) => {
  await loginPage.goto('/workboard?status=in_review&sort=due_asc')

  await expect(loginPage.googleButton).toBeVisible()

  const url = new URL(page.url())
  expect(url.pathname).toBe('/login')
  expect(url.searchParams.get('redirectTo')).toBe('/workboard?status=in_review&sort=due_asc')
})

test('AC: E2E-SMOKE-AUTH-REDIRECT preserves the onboarding target', async ({ loginPage, page }) => {
  await loginPage.goto('/onboarding')

  await expect(loginPage.googleButton).toBeVisible()

  const url = new URL(page.url())
  expect(url.pathname).toBe('/login')
  expect(url.searchParams.get('redirectTo')).toBe('/onboarding')
})
