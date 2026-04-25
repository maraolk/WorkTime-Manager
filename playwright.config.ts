import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: 'npm run mock',
      url: 'http://localhost:3000/users',
      reuseExistingServer: true,
      timeout: 30_000,
    },
    {
      command: 'npm start -- --host 127.0.0.1',
      url: 'http://127.0.0.1:4200',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
