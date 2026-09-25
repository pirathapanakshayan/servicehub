import { resetTestDatabase } from "./reset-db";

/** Vitest globalSetup for the API project: fresh, seeded test database per run. */
export default function setup() {
  resetTestDatabase();
}
