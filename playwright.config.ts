import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * Tests authentication flows: landing → keycloak → onboarding
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run sequentially - padre needs hijo's code
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // Single worker for sequential execution
  reporter: [['html', { open: 'never' }], ['list']],
  
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    // Setup project - creates test users in Keycloak if needed
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    // Main E2E tests
    {
      name: 'e2e',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],

  // Run local dev server if not already running
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60000,
  },
});
