import { defineConfig, devices } from '@playwright/test';

const publicOrigin = 'https://austrian-business-cycle-monitor.jimblogic.chatgpt.site';
const baseURL = process.env.ABCM_BASE_URL || publicOrigin;
if (![publicOrigin, 'http://127.0.0.1:8793'].includes(baseURL)) throw new Error('Unapproved smoke-test origin');

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  forbidOnly: !!process.env.CI,
  retries: 0,
  timeout: 120_000,
  globalTimeout: 20 * 60_000,
  expect: { timeout: 20_000 },
  reporter: [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'results.json' }]],
  use: { baseURL, actionTimeout: 20_000, navigationTimeout: 45_000, screenshot: 'only-on-failure', trace: 'retain-on-failure', reducedMotion: 'reduce', locale: 'en-US', timezoneId: 'Europe/Madrid' },
  projects: [
    { name: 'desktop-chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'desktop-firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'iphone-webkit', use: { ...devices['iPhone 13'] } },
    { name: 'android-chromium', use: { ...devices['Pixel 7'] } },
  ],
  ...(baseURL.includes('127.0.0.1') ? { webServer: {
    command: 'bash start-candidate.sh', url: `${baseURL}/`, timeout: 180_000, reuseExistingServer: false,
  } } : {}),
});
