import { resetTestDatabase } from "../setup/reset-db";

/** Playwright globalSetup: fresh, seeded test database before the E2E run. */
export default function globalSetup() {
  resetTestDatabase();
}
