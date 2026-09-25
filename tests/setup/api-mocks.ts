import { vi } from "vitest";

// Route handlers read the session with next/headers' cookies(), which needs a Next request
// scope. Tests control the cookie jar through tests/api/helpers.ts instead.
vi.mock("next/headers", async () => {
  const { cookieJar } = await import("../api/helpers");
  return {
    cookies: async () => ({
      get: (name: string) => {
        const value = cookieJar.get(name);
        return value === undefined ? undefined : { name, value };
      },
    }),
  };
});
