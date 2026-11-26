import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'retain-on-failure',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
          args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--no-zygote'],
        }
      : {},
  },
  webServer: [
    {
      command: 'npx tsx server/e2e.ts',
      url: 'http://127.0.0.1:3003/api/bootstrap',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'API_TARGET=http://127.0.0.1:3003 npx vite --host 0.0.0.0 --port 5174 --strictPort',
      url: 'http://127.0.0.1:5174',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
