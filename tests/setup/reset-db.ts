import { execSync } from "node:child_process";

/**
 * Brings the database at TEST_DATABASE_URL up to the current schema and re-seeds it.
 * Refuses to run against DATABASE_URL so a misconfigured .env can never wipe real data.
 */
export function resetTestDatabase() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Point it at a separate, disposable database (see docs/TESTING_REPORT.md).",
    );
  }
  const appUrls = [process.env.DATABASE_URL, process.env.APP_DATABASE_URL].filter(Boolean);
  if (appUrls.includes(url)) {
    throw new Error("TEST_DATABASE_URL must differ from DATABASE_URL: the test run wipes it.");
  }

  const run = (command: string) =>
    execSync(command, { stdio: "pipe", env: { ...process.env, DATABASE_URL: url } });

  // Sync tables to the schema without dropping anything, then let the seed clear and
  // re-populate every table (prisma/seed.ts deletes all rows first).
  run("npx prisma db push --skip-generate");
  run("npx tsx prisma/seed.ts");
}
