import { expect, test } from '../fixtures/test'

// Feature: Router error boundary
// PRD: Platform smoke
// AC: E2E-SMOKE-NOT-FOUND

test('AC: E2E-SMOKE-NOT-FOUND renders the SPA 404 boundary', async ({ page }) => {
  await page.goto('/not-a-real-route')

  const alert = page.getByRole('alert')
  await expect(alert).toContainText('Page not found')
  await expect(alert).toContainText("We couldn't find what you were looking for.")
  await expect(page.getByRole('link', { name: 'Return home' })).toHaveAttribute('href', '/')
})

test('AC: E2E-SMOKE-NOT-FOUND renders localized 404 copy', async ({ loginPage, page }) => {
  await loginPage.goto('/login?lng=zh-CN')
  await page.goto('/not-a-real-route')

  const alert = page.getByRole('alert')
  await expect(alert).toContainText('未找到页面')
  await expect(alert).toContainText('未找到您要查找的内容。')
  await expect(page.getByRole('link', { name: '返回首页' })).toHaveAttribute('href', '/')
})
