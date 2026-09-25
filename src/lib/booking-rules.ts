/**
 * Pure booking rules: status transitions, time slots and business-timezone date helpers.
 * No I/O and no framework imports, so this is safe on client and server and easy to unit test.
 */

export const BOOKING_STATUSES = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
export type BookingStatus = (typeof BOOKING_STATUSES)[number];
export type Actor = "CUSTOMER" | "ADMIN";

/** All bookings are made in Sri Lanka time. */
export const BUSINESS_TIME_ZONE = "Asia/Colombo";

export const FINAL_STATUSES: readonly BookingStatus[] = ["COMPLETED", "CANCELLED"];
export const CUSTOMER_CANCELLABLE: readonly BookingStatus[] = ["PENDING", "CONFIRMED"];
/** Statuses that occupy a time slot. */
export const ACTIVE_STATUSES: readonly BookingStatus[] = ["PENDING", "CONFIRMED", "COMPLETED"];

/** Allowed transitions and who may perform them (see CLAUDE.md "Booking status rules"). */
const TRANSITIONS: Record<BookingStatus, Partial<Record<BookingStatus, readonly Actor[]>>> = {
  PENDING: { CONFIRMED: ["ADMIN"], CANCELLED: ["CUSTOMER", "ADMIN"] },
  CONFIRMED: { COMPLETED: ["ADMIN"], CANCELLED: ["CUSTOMER", "ADMIN"] },
  COMPLETED: {},
  CANCELLED: {},
};

export type TransitionResult = { ok: true } | { ok: false; message: string };

const label = (s: BookingStatus) => s.charAt(0) + s.slice(1).toLowerCase();

/**
 * Checks whether `actor` may move a booking from `from` to `to`.
 * Ownership is checked by the caller; customers may only act on their own bookings.
 */
export function checkTransition(
  from: BookingStatus,
  to: BookingStatus,
  actor: Actor,
): TransitionResult {
  if (from === to)
    return { ok: false, message: `Booking is already ${label(from).toLowerCase()}.` };
  if (FINAL_STATUSES.includes(from)) {
    return {
      ok: false,
      message: `${label(from)} bookings are final and cannot be changed.`,
    };
  }
  const allowedActors = TRANSITIONS[from][to];
  if (!allowedActors) {
    return {
      ok: false,
      message: `Cannot change a ${label(from).toLowerCase()} booking to ${label(to).toLowerCase()}.`,
    };
  }
  if (!allowedActors.includes(actor)) {
    return {
      ok: false,
      message:
        actor === "CUSTOMER"
          ? "You can only cancel a booking."
          : `Only a customer can make this change.`,
    };
  }
  return { ok: true };
}

export function canCustomerCancel(status: BookingStatus): boolean {
  return CUSTOMER_CANCELLABLE.includes(status);
}

/** Statuses an actor may move a booking to from its current status. */
export function nextStatuses(from: BookingStatus, actor: Actor): BookingStatus[] {
  return BOOKING_STATUSES.filter((to) => checkTransition(from, to, actor).ok);
}

// ---------------------------------------------------------------------------
// Time slots
// ---------------------------------------------------------------------------

export const SLOT_START = "08:00";
export const SLOT_END = "18:00";
export const SLOT_INTERVAL_MINUTES = 30;

const toMinutes = (time: string) => {
  const [h, m] = time.split(":").map(Number);
  return h! * 60 + m!;
};
const toTime = (minutes: number) =>
  `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;

/** All bookable start times: 08:00, 08:30, ..., 18:00. */
export function generateSlots(): string[] {
  const slots: string[] = [];
  for (let m = toMinutes(SLOT_START); m <= toMinutes(SLOT_END); m += SLOT_INTERVAL_MINUTES) {
    slots.push(toTime(m));
  }
  return slots;
}

export const ALL_SLOTS: readonly string[] = generateSlots();

export function isValidSlot(time: string): boolean {
  return ALL_SLOTS.includes(time);
}

// ---------------------------------------------------------------------------
// Dates in the business time zone
// ---------------------------------------------------------------------------

/** Current date ("YYYY-MM-DD") and time ("HH:mm") in the business time zone. */
export function nowInBusinessZone(now: Date = new Date()): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: BUSINESS_TIME_ZONE,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(now)
      .map((p) => [p.type, p.value]),
  );
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
  };
}

/** True when the date/time is strictly after `now` in the business time zone. */
export function isFutureSlot(date: string, time: string, now: Date = new Date()): boolean {
  const current = nowInBusinessZone(now);
  if (date !== current.date) return date > current.date;
  return time > current.time;
}

/** Available slots for a date, excluding taken times and (for today) times already passed. */
export function availableSlots(
  date: string,
  taken: Iterable<string>,
  now: Date = new Date(),
): string[] {
  const takenSet = new Set(taken);
  return ALL_SLOTS.filter((t) => !takenSet.has(t) && isFutureSlot(date, t, now));
}

/** A "YYYY-MM-DD" string as a UTC-midnight Date, matching Prisma's @db.Date storage. */
export function dateOnlyToDate(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}

/** A @db.Date value back to "YYYY-MM-DD". */
export function dateToDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** True for a real calendar date in "YYYY-MM-DD" form (rejects 2026-02-30). */
export function isValidDateOnly(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const d = dateOnlyToDate(date);
  return !Number.isNaN(d.getTime()) && dateToDateOnly(d) === date;
}
