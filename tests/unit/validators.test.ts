import { describe, expect, it } from "vitest";
import { nowInBusinessZone } from "@/lib/booking-rules";
import {
  bookingCreateSchema,
  registerSchema,
  safeRedirectPath,
  serviceSchema,
} from "@/lib/validators";

/** First error message per field, e.g. { password: "..." }. */
function fieldErrors(result: {
  success: boolean;
  error?: { issues: { path: PropertyKey[]; message: string }[] };
}) {
  const out: Record<string, string> = {};
  for (const issue of result.error?.issues ?? [])
    out[String(issue.path[0] ?? "_")] ??= issue.message;
  return out;
}

/** "YYYY-MM-DD" `days` from today in the business time zone. */
function businessDate(days: number) {
  const d = new Date(`${nowInBusinessZone().date}T00:00:00.000Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

describe("registerSchema", () => {
  const valid = {
    name: "Test User",
    email: "Test.User@Example.com ",
    password: "secret123",
    confirmPassword: "secret123",
  };

  it("accepts valid input and normalizes the email", () => {
    const r = registerSchema.safeParse(valid);
    expect(r.success).toBe(true);
    expect(r.data?.email).toBe("test.user@example.com");
  });

  it("strips a role from the body", () => {
    const r = registerSchema.safeParse({ ...valid, role: "ADMIN" });
    expect(r.success).toBe(true);
    expect(r.data).not.toHaveProperty("role");
  });

  it.each([
    [{ name: "A" }, "name", "Name must be at least 2 characters"],
    [{ name: "x".repeat(61) }, "name", "Name must be at most 60 characters"],
    [{ email: "not-an-email" }, "email", "Enter a valid email address"],
    [
      { password: "short1", confirmPassword: "short1" },
      "password",
      "Password must be at least 8 characters",
    ],
    [
      { password: "abcdefgh", confirmPassword: "abcdefgh" },
      "password",
      "Password must contain at least one number",
    ],
    [
      { password: "12345678", confirmPassword: "12345678" },
      "password",
      "Password must contain at least one letter",
    ],
    [{ confirmPassword: "different1" }, "confirmPassword", "Passwords do not match"],
    [{ phone: "abc" }, "phone", "Enter a valid phone number"],
  ])("rejects %j", (patch, field, message) => {
    const r = registerSchema.safeParse({ ...valid, ...patch });
    expect(r.success).toBe(false);
    expect(fieldErrors(r)[field]).toBe(message);
  });

  it("allows an empty optional phone", () => {
    expect(registerSchema.safeParse({ ...valid, phone: "" }).success).toBe(true);
  });
});

describe("bookingCreateSchema", () => {
  const valid = {
    serviceId: "7c1c3c9e-2f0b-4a3e-9d7e-1b2c3d4e5f60",
    bookingDate: businessDate(7),
    bookingTime: "10:30",
  };

  it("accepts a future slot and turns empty notes into null", () => {
    const r = bookingCreateSchema.safeParse({ ...valid, notes: "" });
    expect(r.success).toBe(true);
    expect(r.data?.notes).toBeNull();
  });

  it("rejects a past date", () => {
    const r = bookingCreateSchema.safeParse({ ...valid, bookingDate: businessDate(-1) });
    expect(r.success).toBe(false);
    expect(fieldErrors(r).bookingTime).toBe("Please choose a date and time in the future");
  });

  it.each(["9:00", "10:15", "25:00", "10.30", "18:30", "07:30", ""])(
    "rejects bad time %j",
    (bookingTime) => {
      const r = bookingCreateSchema.safeParse({ ...valid, bookingTime });
      expect(r.success).toBe(false);
      expect(fieldErrors(r).bookingTime).toBe(
        "Time must be a 30-minute slot between 08:00 and 18:00",
      );
    },
  );

  it.each(["2026-02-30", "25-10-2026", "tomorrow"])("rejects bad date %j", (bookingDate) => {
    const r = bookingCreateSchema.safeParse({ ...valid, bookingDate });
    expect(r.success).toBe(false);
    expect(fieldErrors(r).bookingDate).toBe("Date must be a valid date in YYYY-MM-DD format");
  });

  it("rejects notes over 500 characters and a non-uuid service", () => {
    expect(
      fieldErrors(bookingCreateSchema.safeParse({ ...valid, notes: "x".repeat(501) })).notes,
    ).toBe("Notes must be at most 500 characters");
    expect(fieldErrors(bookingCreateSchema.safeParse({ ...valid, serviceId: "1" })).serviceId).toBe(
      "Select a valid service",
    );
  });
});

describe("serviceSchema", () => {
  const valid = {
    name: "Window Cleaning",
    description: "Inside and outside window cleaning.",
    price: "3200.50",
    durationMinutes: "90",
    categoryId: "7c1c3c9e-2f0b-4a3e-9d7e-1b2c3d4e5f60",
  };

  it("coerces form strings and applies defaults", () => {
    const r = serviceSchema.safeParse(valid);
    expect(r.success).toBe(true);
    expect(r.data).toMatchObject({
      price: 3200.5,
      durationMinutes: 90,
      status: "ACTIVE",
      imageUrl: null,
    });
  });

  it.each([
    [{ name: "ab" }, "name", "Name must be at least 3 characters"],
    [{ description: "too short" }, "description", "Description must be at least 10 characters"],
    [{ price: "-1" }, "price", "Price cannot be negative"],
    [{ price: "10.005" }, "price", "Price can have at most 2 decimal places"],
    [{ durationMinutes: "10" }, "durationMinutes", "Duration must be at least 15 minutes"],
    [{ durationMinutes: "481" }, "durationMinutes", "Duration must be at most 480 minutes"],
    [{ durationMinutes: "30.5" }, "durationMinutes", "Duration must be a whole number of minutes"],
    [{ categoryId: "cleaning" }, "categoryId", "Select a valid category"],
    [{ imageUrl: "javascript:alert(1)" }, "imageUrl", "Enter a valid image URL"],
    [{ status: "ARCHIVED" }, "status", "Status must be ACTIVE or INACTIVE"],
  ])("rejects %j", (patch, field, message) => {
    const r = serviceSchema.safeParse({ ...valid, ...patch });
    expect(r.success).toBe(false);
    expect(fieldErrors(r)[field]).toBe(message);
  });

  it("allows price 0", () => {
    expect(serviceSchema.safeParse({ ...valid, price: 0 }).success).toBe(true);
  });
});

describe("safeRedirectPath", () => {
  it.each([
    ["/my-bookings", "/my-bookings"],
    ["https://evil.example", "/dashboard"],
    ["//evil.example", "/dashboard"],
    ["/\\evil.example", "/dashboard"],
    [null, "/dashboard"],
  ])("%j -> %j", (input, expected) => {
    expect(safeRedirectPath(input, "/dashboard")).toBe(expected);
  });
});
