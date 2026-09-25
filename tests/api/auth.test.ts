import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { POST as login } from "@/app/api/auth/login/route";
import { POST as register } from "@/app/api/auth/register/route";
import { jsonRequest, logout, prisma, readJson, SEED } from "./helpers";

beforeEach(() => logout());
afterAll(() => prisma.$disconnect());

describe("POST /api/auth/register", () => {
  const body = {
    name: "New Customer",
    email: "new.customer@example.com",
    password: "Welcome123",
    confirmPassword: "Welcome123",
  };

  it("creates a CUSTOMER and never returns the password hash", async () => {
    const res = await register(
      jsonRequest("/api/auth/register", "POST", { ...body, role: "ADMIN" }),
    );
    expect(res.status).toBe(201);
    const json = await readJson(res);
    expect(json.user).toMatchObject({ email: body.email, role: "CUSTOMER" });
    expect(JSON.stringify(json)).not.toContain("passwordHash");
  });

  it("returns 409 for a duplicate email (case-insensitive)", async () => {
    const res = await register(
      jsonRequest("/api/auth/register", "POST", { ...body, email: SEED.nimali.toUpperCase() }),
    );
    expect(res.status).toBe(409);
    expect((await readJson(res)).error).toEqual({
      code: "CONFLICT",
      message: "An account with this email already exists",
    });
  });

  it("returns 400 with field errors for invalid input", async () => {
    const res = await register(
      jsonRequest("/api/auth/register", "POST", { ...body, password: "short" }),
    );
    expect(res.status).toBe(400);
    expect((await readJson(res)).error?.code).toBe("VALIDATION_ERROR");
  });
});

describe("POST /api/auth/login", () => {
  it("returns 401 with a generic message for a wrong password", async () => {
    const res = await login(
      jsonRequest("/api/auth/login", "POST", { email: SEED.nimali, password: "WrongPass1" }),
    );
    expect(res.status).toBe(401);
    expect((await readJson(res)).error).toEqual({
      code: "UNAUTHORIZED",
      message: "Invalid email or password",
    });
    expect(res.headers.get("set-cookie")).toBeNull();
  });

  it("returns the same 401 for an unknown email", async () => {
    const res = await login(
      jsonRequest("/api/auth/login", "POST", {
        email: "nobody@example.com",
        password: "Whatever1",
      }),
    );
    expect(res.status).toBe(401);
    expect((await readJson(res)).error?.message).toBe("Invalid email or password");
  });

  it("sets an httpOnly session cookie on success", async () => {
    const res = await login(
      jsonRequest("/api/auth/login", "POST", { email: SEED.nimali, password: SEED.password }),
    );
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie") ?? "";
    expect(cookie).toMatch(/^session=/);
    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=lax/i);
  });

  it("returns 403 for a deactivated account", async () => {
    await prisma.user.update({ where: { email: SEED.kasun }, data: { isActive: false } });
    try {
      const res = await login(
        jsonRequest("/api/auth/login", "POST", { email: SEED.kasun, password: SEED.password }),
      );
      expect(res.status).toBe(403);
    } finally {
      await prisma.user.update({ where: { email: SEED.kasun }, data: { isActive: true } });
    }
  });
});
