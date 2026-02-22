import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:5501';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    // CI installs Chromium only; locally Chrome works. Use Chromium in CI to match workflow.
    {
      name: 'chromium',
      use: process.env.CI ? { ...devices['Chromium'] } : { ...devices['Desktop Chrome'], channel: 'chrome' },
    },
  ],
  webServer: process.env.PLAYWRIGHT_BASE_URL
    ? undefined
    : {
        command: 'npx http-server . -p 5501 -c-1',
        url: baseURL,
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
      },
});
