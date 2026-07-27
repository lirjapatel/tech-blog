import { defineConfig, devices } from '@playwright/test'

/**
 * Tests run against a real production build served by `astro preview`, not the
 * dev server. That way the suite exercises the same static output that gets
 * deployed — including generated OG images, the search index, and minified CSS.
 */
const PORT = 4321
const BASE_URL = `http://localhost:${PORT}`

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  /*
   * Capped deliberately. `astro preview` is a lightweight static server, and
   * letting Playwright default to one worker per CPU core saturated it — page
   * loads stalled and tests failed in ways that never reproduced individually.
   */
  workers: 3,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : [['list'], ['html', { open: 'never' }]],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],

  webServer: {
    command: 'npm run build && npm run preview',
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
})
