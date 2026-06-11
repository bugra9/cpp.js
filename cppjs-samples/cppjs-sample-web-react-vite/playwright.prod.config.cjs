// @ts-check
const { defineConfig, devices } = require('@playwright/test');

/**
 * @see https://playwright.dev/docs/test-configuration
 */
// CPPJS_E2E_PORT lets sequential/parallel e2e runs give each project a unique free
// port (avoids teardown races on the shared default).
const port = process.env.CPPJS_E2E_PORT || '4173';

module.exports = defineConfig({
  testDir: './e2e',
  timeout: 30 * 1000,
  expect: {
    timeout: 50000,
  },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: 'html',

  use: {
    baseURL: `http://localhost:${port}`,
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: `npx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
  },
});
