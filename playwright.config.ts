import { defineConfig, devices } from '@playwright/test'

const baseURL = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:8787'
const usesExternalTarget = Boolean(process.env.E2E_BASE_URL)
const reuseExistingServer = Boolean(process.env.E2E_REUSE_EXISTING_SERVER)

const localWorkerCommand = [
  'pnpm --filter @duedatehq/app build',
  'pnpm --dir apps/server exec wrangler d1 migrations apply DB --local --config wrangler.toml',
  'pnpm --dir apps/server exec wrangler dev --local --ip 127.0.0.1 --port 8787 --var AI_GATEWAY_PROVIDER_API_KEY: --var AI_GATEWAY_API_KEY:',
].join(' && ')

export default defineConfig({
  testDir: './e2e/tests',
  outputDir: './test-results/e2e',
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  ...(process.env.CI ? { workers: 1 } : {}),
  reporter: process.env.CI
    ? [
        ['github'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
      ]
    : [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    video: 'retain-on-failure',
  },
  ...(usesExternalTarget
    ? {}
    : {
        webServer: {
          command: localWorkerCommand,
          url: `${baseURL}/api/health`,
          reuseExistingServer,
          timeout: 120_000,
          stdout: 'pipe',
          stderr: 'pipe',
        },
      }),
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
})
