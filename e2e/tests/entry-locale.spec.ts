import { expect, test } from '../fixtures/test'

// Feature: Entry locale switch
// PRD: Marketing-to-app locale handoff
// AC: E2E-SMOKE-I18N

test('AC: E2E-SMOKE-I18N switches the login entry locale', async ({ loginPage, page }) => {
  await loginPage.goto()

  await loginPage.languageButton.click()
  await page.getByRole('menuitem', { name: '简体中文' }).click()

  await expect(loginPage.googleButton).toHaveText(/使用 Google 继续/)
  await expect(page.getByText('面向美国注册会计师事务所')).toBeVisible()
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.evaluate(() => window.localStorage.getItem('lng'))).resolves.toBe('zh-CN')
})

test('AC: E2E-SMOKE-I18N consumes the marketing locale handoff query', async ({
  loginPage,
  page,
}) => {
  await loginPage.goto('/login?lng=zh-CN')

  await expect(loginPage.googleButton).toHaveText(/使用 Google 继续/)
  await expect(page).toHaveURL(/\/login$/)
  await expect(page.evaluate(() => window.localStorage.getItem('lng'))).resolves.toBe('zh-CN')
})
