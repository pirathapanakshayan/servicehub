import { signToken } from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

/** Cookies the mocked next/headers cookies() returns (see tests/setup/api-mocks.ts). */
export const cookieJar = new Map<string, string>();

export const SEED = {
  admin: "admin@servicehub.com",
  nimali: "nimali@example.com",
  kasun: "kasun@example.com",
  password: "Customer@123",
} as const;

/** Acts as the given seeded user for subsequent route handler calls. */
export async function loginAs(email: string) {
  const user = await prisma.user.findUniqueOrThrow({ where: { email } });
  cookieJar.set("session", await signToken({ sub: user.id, role: user.role, name: user.name }));
  return user;
}

export function logout() {
  cookieJar.clear();
}

export function jsonRequest(path: string, method: string, body?: unknown) {
  return new Request(`http://localhost${path}`, {
    method,
    headers: { "content-type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** The second argument Next passes to dynamic route handlers. */
export function routeContext(id: string) {
  return { params: Promise.resolve({ id }) };
}

/** A "YYYY-MM-DD" date `days` from today in the business time zone. */
export function businessDate(days: number) {
  const base = new Date(
    `${new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Colombo" })}T00:00:00.000Z`,
  );
  base.setUTCDate(base.getUTCDate() + days);
  return base.toISOString().slice(0, 10);
}

export async function readJson(response: Response) {
  return (await response.json()) as Record<string, unknown> & {
    error?: { code: string; message: string };
  };
}

export { prisma };
