import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { DELETE as deleteService } from "@/app/api/services/[id]/route";
import { POST as createService } from "@/app/api/services/route";
import { jsonRequest, loginAs, logout, prisma, readJson, routeContext, SEED } from "./helpers";

beforeEach(() => logout());
afterAll(() => prisma.$disconnect());

async function newServiceBody() {
  const category = await prisma.category.findFirstOrThrow();
  return {
    name: "Test Gutter Cleaning",
    description: "Clearing leaves and debris from roof gutters.",
    price: 2500,
    durationMinutes: 60,
    categoryId: category.id,
  };
}

describe("POST /api/services", () => {
  it("returns 401 when not logged in", async () => {
    const res = await createService(jsonRequest("/api/services", "POST", await newServiceBody()));
    expect(res.status).toBe(401);
  });

  it("returns 403 for a customer", async () => {
    await loginAs(SEED.nimali);
    const res = await createService(jsonRequest("/api/services", "POST", await newServiceBody()));
    expect(res.status).toBe(403);
    expect((await readJson(res)).error?.code).toBe("FORBIDDEN");
  });

  it("creates the service for an admin", async () => {
    await loginAs(SEED.admin);
    const res = await createService(jsonRequest("/api/services", "POST", await newServiceBody()));
    expect(res.status).toBe(201);
  });
});

describe("DELETE /api/services/:id", () => {
  it("returns 409 for a service that has bookings", async () => {
    const booked = await prisma.service.findFirstOrThrow({ where: { bookings: { some: {} } } });
    await loginAs(SEED.admin);
    const res = await deleteService(jsonRequest("/", "DELETE"), routeContext(booked.id));
    expect(res.status).toBe(409);
    expect((await readJson(res)).error).toEqual({
      code: "CONFLICT",
      message: "Service has bookings. Set it to inactive instead.",
    });
    expect(await prisma.service.findUnique({ where: { id: booked.id } })).not.toBeNull();
  });

  it("deletes a service without bookings", async () => {
    const unbooked = await prisma.service.create({
      data: { ...(await newServiceBody()), name: "Temporary Service" },
    });
    await loginAs(SEED.admin);
    const res = await deleteService(jsonRequest("/", "DELETE"), routeContext(unbooked.id));
    expect(res.status).toBe(200);
    expect(await prisma.service.findUnique({ where: { id: unbooked.id } })).toBeNull();
  });
});
