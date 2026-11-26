import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './pages-tests',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5175/Pafupi/',
    launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
      ? {
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE,
          args: ['--no-sandbox', '--disable-dev-shm-usage'],
        }
      : {},
  },
  webServer: {
    command: 'BASE_PATH=/Pafupi/ npx vite preview --host 0.0.0.0 --port 5175 --strictPort',
    url: 'http://127.0.0.1:5175/Pafupi/',
    reuseExistingServer: false,
  },
});
