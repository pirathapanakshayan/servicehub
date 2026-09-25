import { defineConfig, devices } from "@playwright/test";
import { loadEnv } from "vite";

// Same env handling as vitest.config.ts: TEST_DATABASE_URL comes from .env / .env.test.
const env = loadEnv("test", process.cwd(), "");
process.env.TEST_DATABASE_URL ??= env.TEST_DATABASE_URL;
process.env.APP_DATABASE_URL ??= env.DATABASE_URL;

const PORT = 3100;

export default defineConfig({
  testDir: "tests/e2e",
  globalSetup: "./tests/e2e/global-setup.ts",
  // The flows share one database, so run them in order.
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Optional: PLAYWRIGHT_CHANNEL=msedge (or chrome) uses an installed browser instead of
        // Playwright's bundled Chromium, e.g. when `npx playwright install` isn't possible.
        channel: process.env.PLAYWRIGHT_CHANNEL || undefined,
      },
    },
  ],
  webServer: {
    command: `npx next dev --turbopack -p ${PORT}`,
    url: `http://localhost:${PORT}/api/categories`,
    // Never attach to an already-running dev server: it would be using the real database.
    reuseExistingServer: false,
    timeout: 180_000,
    env: {
      DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
      JWT_SECRET: "test-only-jwt-secret-with-at-least-32-characters",
    },
  },
});
