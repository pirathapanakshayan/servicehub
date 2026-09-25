import path from "node:path";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Load .env / .env.test so TEST_DATABASE_URL is available to globalSetup and the tests.
const env = loadEnv("test", process.cwd(), "");
process.env.TEST_DATABASE_URL ??= env.TEST_DATABASE_URL;
// The app database from .env, so the reset guard can refuse to wipe it.
process.env.APP_DATABASE_URL ??= env.DATABASE_URL;

const TEST_JWT_SECRET = "test-only-jwt-secret-with-at-least-32-characters";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Next.js resolves this to an empty module on the server; outside Next it throws.
      "server-only": path.resolve(__dirname, "tests/setup/empty-module.ts"),
    },
  },
  test: {
    // API tests share one database, so test files run one at a time (unit tests are fast anyway).
    fileParallelism: false,
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["tests/unit/**/*.test.ts"],
          environment: "node",
        },
      },
      {
        extends: true,
        test: {
          name: "api",
          include: ["tests/api/**/*.test.ts"],
          environment: "node",
          globalSetup: ["tests/setup/global-db.ts"],
          setupFiles: ["tests/setup/api-mocks.ts"],
          testTimeout: 20_000,
          hookTimeout: 20_000,
          env: {
            DATABASE_URL: process.env.TEST_DATABASE_URL ?? "",
            JWT_SECRET: TEST_JWT_SECRET,
          },
        },
      },
    ],
  },
});
