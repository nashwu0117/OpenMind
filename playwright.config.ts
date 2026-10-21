import { defineConfig } from '@playwright/test';
const port = Number(process.env.OPENMIND_TEST_PORT ?? 5187);
const url = `http://127.0.0.1:${port}`;
export default defineConfig({ testDir: './tests/e2e', timeout: 45000, fullyParallel: false, workers: 1, use: { baseURL: url, viewport: { width: 1480, height: 960 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' }, webServer: { command: `npm run dev -- --force --port ${port}`, url, reuseExistingServer: !process.env.CI, timeout: 30000 } });
