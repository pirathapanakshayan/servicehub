import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { GET as getBooking, PUT as updateBooking } from "@/app/api/bookings/[id]/route";
import { POST as createBooking } from "@/app/api/bookings/route";
import {
  businessDate,
  jsonRequest,
  loginAs,
  logout,
  prisma,
  readJson,
  routeContext,
  SEED,
} from "./helpers";

beforeEach(() => logout());
afterAll(() => prisma.$disconnect());

/** A seeded booking for `email` in `status`. */
async function seededBooking(email: string, status: "PENDING" | "CONFIRMED" | "COMPLETED") {
  return prisma.booking.findFirstOrThrow({
    where: { user: { email }, status },
    include: { service: true },
  });
}

async function activeService() {
  return prisma.service.findFirstOrThrow({ where: { status: "ACTIVE" }, orderBy: { name: "asc" } });
}

describe("POST /api/bookings", () => {
  it("returns 401 when not logged in", async () => {
    const service = await activeService();
    const res = await createBooking(
      jsonRequest("/api/bookings", "POST", {
        serviceId: service.id,
        bookingDate: businessDate(10),
        bookingTime: "10:00",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("creates a PENDING booking with the service price snapshotted", async () => {
    await loginAs(SEED.nimali);
    const service = await activeService();
    const res = await createBooking(
      jsonRequest("/api/bookings", "POST", {
        serviceId: service.id,
        bookingDate: businessDate(20),
        bookingTime: "09:30",
        notes: "Integration test",
      }),
    );
    expect(res.status).toBe(201);
    const { data } = (await readJson(res)) as { data: Record<string, unknown> };
    expect(data).toMatchObject({
      status: "PENDING",
      totalPrice: service.price.toFixed(2),
      bookingTime: "09:30",
    });
  });

  it("returns 400 for a past date", async () => {
    await loginAs(SEED.nimali);
    const service = await activeService();
    const res = await createBooking(
      jsonRequest("/api/bookings", "POST", {
        serviceId: service.id,
        bookingDate: businessDate(-1),
        bookingTime: "10:00",
      }),
    );
    expect(res.status).toBe(400);
    expect((await readJson(res)).error).toMatchObject({
      code: "VALIDATION_ERROR",
      message: "Please choose a date and time in the future",
    });
  });

  it("returns 409 when the slot is already taken", async () => {
    // Kasun's seeded CONFIRMED booking is in the future; Nimali tries the same slot.
    const taken = await seededBooking(SEED.kasun, "CONFIRMED");
    await loginAs(SEED.nimali);
    const res = await createBooking(
      jsonRequest("/api/bookings", "POST", {
        serviceId: taken.serviceId,
        bookingDate: taken.bookingDate.toISOString().slice(0, 10),
        bookingTime: taken.bookingTime,
      }),
    );
    expect(res.status).toBe(409);
    expect((await readJson(res)).error).toEqual({
      code: "CONFLICT",
      message: "This time slot is already booked",
    });
  });

  it("returns 403 for an admin", async () => {
    await loginAs(SEED.admin);
    const service = await activeService();
    const res = await createBooking(
      jsonRequest("/api/bookings", "POST", {
        serviceId: service.id,
        bookingDate: businessDate(10),
        bookingTime: "10:00",
      }),
    );
    expect(res.status).toBe(403);
  });
});

describe("PUT /api/bookings/:id", () => {
  it("lets a customer cancel their own PENDING booking (200)", async () => {
    const booking = await seededBooking(SEED.nimali, "PENDING");
    await loginAs(SEED.nimali);
    const res = await updateBooking(
      jsonRequest(`/api/bookings/${booking.id}`, "PUT", { status: "CANCELLED" }),
      routeContext(booking.id),
    );
    expect(res.status).toBe(200);
    expect(((await readJson(res)) as { data: { status: string } }).data.status).toBe("CANCELLED");
  });

  it("returns 422 when a customer cancels a COMPLETED booking", async () => {
    const booking = await seededBooking(SEED.nimali, "COMPLETED");
    await loginAs(SEED.nimali);
    const res = await updateBooking(
      jsonRequest(`/api/bookings/${booking.id}`, "PUT", { status: "CANCELLED" }),
      routeContext(booking.id),
    );
    expect(res.status).toBe(422);
    expect((await readJson(res)).error).toEqual({
      code: "UNPROCESSABLE_ENTITY",
      message: "Completed bookings are final and cannot be changed.",
    });
  });

  it("returns 403 when a customer tries to confirm", async () => {
    const booking = await seededBooking(SEED.kasun, "PENDING");
    await loginAs(SEED.kasun);
    const res = await updateBooking(
      jsonRequest(`/api/bookings/${booking.id}`, "PUT", { status: "CONFIRMED" }),
      routeContext(booking.id),
    );
    expect(res.status).toBe(403);
  });

  it("returns 404 when a customer changes another user's booking", async () => {
    const booking = await seededBooking(SEED.kasun, "PENDING");
    await loginAs(SEED.nimali);
    const res = await updateBooking(
      jsonRequest(`/api/bookings/${booking.id}`, "PUT", { status: "CANCELLED" }),
      routeContext(booking.id),
    );
    expect(res.status).toBe(404);
  });
});

describe("GET /api/bookings/:id", () => {
  it("returns 404 when a customer reads another user's booking", async () => {
    const booking = await seededBooking(SEED.kasun, "CONFIRMED");
    await loginAs(SEED.nimali);
    const res = await getBooking(
      jsonRequest(`/api/bookings/${booking.id}`, "GET"),
      routeContext(booking.id),
    );
    expect(res.status).toBe(404);
    expect((await readJson(res)).error).toEqual({
      code: "NOT_FOUND",
      message: "Booking not found",
    });
  });

  it("returns the booking to its owner and to an admin", async () => {
    const booking = await seededBooking(SEED.kasun, "CONFIRMED");
    await loginAs(SEED.kasun);
    expect((await getBooking(jsonRequest("/", "GET"), routeContext(booking.id))).status).toBe(200);
    await loginAs(SEED.admin);
    const res = await getBooking(jsonRequest("/", "GET"), routeContext(booking.id));
    expect(res.status).toBe(200);
    expect(JSON.stringify(await readJson(res))).not.toContain("passwordHash");
  });
});
