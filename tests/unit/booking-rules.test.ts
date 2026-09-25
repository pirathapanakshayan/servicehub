import { describe, expect, it } from "vitest";
import {
  ALL_SLOTS,
  availableSlots,
  BOOKING_STATUSES,
  canCustomerCancel,
  checkTransition,
  isFutureSlot,
  isValidDateOnly,
  isValidSlot,
  nextStatuses,
  nowInBusinessZone,
  type Actor,
  type BookingStatus,
} from "@/lib/booking-rules";

/** The allowed transitions from CLAUDE.md ("Booking status rules"). Everything else is forbidden. */
const ALLOWED: Record<Actor, [BookingStatus, BookingStatus][]> = {
  ADMIN: [
    ["PENDING", "CONFIRMED"],
    ["PENDING", "CANCELLED"],
    ["CONFIRMED", "COMPLETED"],
    ["CONFIRMED", "CANCELLED"],
  ],
  CUSTOMER: [
    ["PENDING", "CANCELLED"],
    ["CONFIRMED", "CANCELLED"],
  ],
};

const matrix = (["CUSTOMER", "ADMIN"] as const).flatMap((actor) =>
  BOOKING_STATUSES.flatMap((from) =>
    BOOKING_STATUSES.map((to) => ({
      actor,
      from,
      to,
      allowed: ALLOWED[actor].some(([f, t]) => f === from && t === to),
    })),
  ),
);

describe("checkTransition: full status matrix", () => {
  it("covers all 32 actor/from/to combinations", () => {
    expect(matrix).toHaveLength(32);
    expect(matrix.filter((c) => c.allowed)).toHaveLength(6);
  });

  it.each(matrix)("$actor: $from -> $to is allowed=$allowed", ({ actor, from, to, allowed }) => {
    const result = checkTransition(from, to, actor);
    expect(result.ok).toBe(allowed);
    if (!result.ok) expect(result.message.length).toBeGreaterThan(0);
  });
});

describe("checkTransition: error messages", () => {
  it("explains that COMPLETED and CANCELLED are final", () => {
    expect(checkTransition("COMPLETED", "CANCELLED", "ADMIN")).toEqual({
      ok: false,
      message: "Completed bookings are final and cannot be changed.",
    });
    expect(checkTransition("CANCELLED", "PENDING", "ADMIN")).toMatchObject({
      message: "Cancelled bookings are final and cannot be changed.",
    });
  });

  it("tells a customer they can only cancel", () => {
    expect(checkTransition("PENDING", "CONFIRMED", "CUSTOMER")).toMatchObject({
      message: "You can only cancel a booking.",
    });
  });

  it("rejects skipping a step", () => {
    expect(checkTransition("PENDING", "COMPLETED", "ADMIN")).toMatchObject({
      message: "Cannot change a pending booking to completed.",
    });
  });
});

describe("nextStatuses / canCustomerCancel", () => {
  it("offers admins only valid next statuses", () => {
    expect(nextStatuses("PENDING", "ADMIN")).toEqual(["CONFIRMED", "CANCELLED"]);
    expect(nextStatuses("CONFIRMED", "ADMIN")).toEqual(["COMPLETED", "CANCELLED"]);
    expect(nextStatuses("COMPLETED", "ADMIN")).toEqual([]);
    expect(nextStatuses("CANCELLED", "ADMIN")).toEqual([]);
  });

  it("lets customers cancel only PENDING or CONFIRMED", () => {
    expect(BOOKING_STATUSES.filter(canCustomerCancel)).toEqual(["PENDING", "CONFIRMED"]);
  });
});

describe("time slots", () => {
  it("are every 30 minutes from 08:00 to 18:00 inclusive", () => {
    expect(ALL_SLOTS).toHaveLength(21);
    expect(ALL_SLOTS[0]).toBe("08:00");
    expect(ALL_SLOTS.at(-1)).toBe("18:00");
  });

  it.each(["08:00", "12:30", "18:00"])("accepts %s", (t) => expect(isValidSlot(t)).toBe(true));
  it.each(["07:30", "18:30", "10:15", "9:00", "25:00", "noon", ""])("rejects %j", (t) =>
    expect(isValidSlot(t)).toBe(false),
  );
});

describe("business time zone (Asia/Colombo, UTC+05:30)", () => {
  // 2026-03-10 04:00 UTC = 09:30 in Colombo.
  const now = new Date("2026-03-10T04:00:00.000Z");

  it("reports the local date and time", () => {
    expect(nowInBusinessZone(now)).toEqual({ date: "2026-03-10", time: "09:30" });
  });

  it("rolls over the date before UTC does", () => {
    // 20:00 UTC on the 10th is already 01:30 on the 11th in Colombo.
    expect(nowInBusinessZone(new Date("2026-03-10T20:00:00.000Z")).date).toBe("2026-03-11");
  });

  it("treats only later times today, and later dates, as future", () => {
    expect(isFutureSlot("2026-03-10", "09:00", now)).toBe(false);
    expect(isFutureSlot("2026-03-10", "09:30", now)).toBe(false);
    expect(isFutureSlot("2026-03-10", "10:00", now)).toBe(true);
    expect(isFutureSlot("2026-03-09", "18:00", now)).toBe(false);
    expect(isFutureSlot("2026-03-11", "08:00", now)).toBe(true);
  });

  it("hides taken and past slots", () => {
    const slots = availableSlots("2026-03-10", ["10:00", "11:30"], now);
    expect(slots[0]).toBe("10:30");
    expect(slots).not.toContain("10:00");
    expect(slots).not.toContain("11:30");
    expect(availableSlots("2026-03-09", [], now)).toEqual([]);
    expect(availableSlots("2026-03-11", [], now)).toHaveLength(21);
  });
});

describe("isValidDateOnly", () => {
  it.each(["2026-01-31", "2028-02-29"])("accepts %s", (d) => expect(isValidDateOnly(d)).toBe(true));
  it.each(["2026-02-30", "2027-02-29", "2026-13-01", "26-01-01", "2026/01/01", ""])(
    "rejects %j",
    (d) => expect(isValidDateOnly(d)).toBe(false),
  );
});
