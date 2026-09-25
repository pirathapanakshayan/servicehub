import "server-only";

import { Prisma } from "@prisma/client";
import { BOOKING_STATUSES, nowInBusinessZone, type BookingStatus } from "@/lib/booking-rules";
import { serializeBooking } from "@/lib/bookings";
import { prisma } from "@/lib/prisma";
import type { UserQuery } from "@/lib/validators";

const CHART_DAYS = 14;

/** "YYYY-MM-DD" for an instant, in the business time zone. */
function businessDate(instant: Date): string {
  return nowInBusinessZone(instant).date;
}

/** The last `days` business dates ending today, oldest first. */
function lastBusinessDates(days: number): string[] {
  const today = nowInBusinessZone().date;
  const base = new Date(`${today}T00:00:00.000Z`);
  return Array.from({ length: days }, (_, i) => {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() - (days - 1 - i));
    return d.toISOString().slice(0, 10);
  });
}

const recentBookingInclude = {
  service: {
    select: {
      id: true,
      name: true,
      price: true,
      durationMinutes: true,
      imageUrl: true,
      status: true,
      category: { select: { id: true, name: true, slug: true } },
    },
  },
  user: { select: { id: true, name: true, email: true, phone: true } },
} satisfies Prisma.BookingInclude;

export async function getAdminStats() {
  const days = lastBusinessDates(CHART_DAYS);
  // Start of the window with a day of margin; exact bucketing is done in business time below.
  const windowStart = new Date(`${days[0]}T00:00:00.000Z`);
  windowStart.setUTCDate(windowStart.getUTCDate() - 1);

  const [customers, activeServices, totalBookings, byStatus, revenue, recentCreated, top, recent] =
    await prisma.$transaction([
      prisma.user.count({ where: { role: "CUSTOMER" } }),
      prisma.service.count({ where: { status: "ACTIVE" } }),
      prisma.booking.count(),
      prisma.booking.groupBy({
        by: ["status"],
        orderBy: { status: "asc" },
        _count: { _all: true },
      }),
      prisma.booking.aggregate({ where: { status: "COMPLETED" }, _sum: { totalPrice: true } }),
      prisma.booking.findMany({
        where: { createdAt: { gte: windowStart } },
        select: { createdAt: true },
      }),
      prisma.booking.groupBy({
        by: ["serviceId"],
        orderBy: { _count: { serviceId: "desc" } },
        _count: { serviceId: true },
        take: 5,
      }),
      prisma.booking.findMany({
        include: recentBookingInclude,
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

  const statusCounts = Object.fromEntries(BOOKING_STATUSES.map((s) => [s, 0])) as Record<
    BookingStatus,
    number
  >;
  for (const row of byStatus) {
    const count = row._count;
    statusCounts[row.status] = typeof count === "object" && count ? (count._all ?? 0) : 0;
  }

  const perDay = new Map(days.map((d) => [d, 0]));
  for (const { createdAt } of recentCreated) {
    const day = businessDate(createdAt);
    if (perDay.has(day)) perDay.set(day, perDay.get(day)! + 1);
  }

  const topIds = top.map((t) => t.serviceId);
  const topServices = await prisma.service.findMany({
    where: { id: { in: topIds } },
    select: { id: true, name: true, category: { select: { name: true } } },
  });
  const nameById = new Map(topServices.map((s) => [s.id, s]));

  return {
    totals: {
      customers,
      activeServices,
      bookings: totalBookings,
      revenue: (revenue._sum.totalPrice ?? new Prisma.Decimal(0)).toFixed(2),
    },
    bookingsByStatus: BOOKING_STATUSES.map((status) => ({ status, count: statusCounts[status] })),
    bookingsPerDay: days.map((date) => ({ date, count: perDay.get(date) ?? 0 })),
    topServices: top.map((t) => {
      const count = t._count;
      return {
        id: t.serviceId,
        name: nameById.get(t.serviceId)?.name ?? "Deleted service",
        category: nameById.get(t.serviceId)?.category.name ?? "",
        bookings: typeof count === "object" && count ? (count.serviceId ?? 0) : 0,
      };
    }),
    recentBookings: recent.map((r) => serializeBooking(r, { includeUser: true })),
  };
}

export type AdminStats = Awaited<ReturnType<typeof getAdminStats>>;

const customerSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  _count: { select: { bookings: true } },
} satisfies Prisma.UserSelect;

type CustomerRow = Prisma.UserGetPayload<{ select: typeof customerSelect }>;

function serializeCustomer({ _count, createdAt, ...user }: CustomerRow) {
  return { ...user, createdAt: createdAt.toISOString(), bookingCount: _count.bookings };
}

export type CustomerDTO = ReturnType<typeof serializeCustomer>;

/** Customers only, with their booking counts. */
export async function listCustomers(query: UserQuery) {
  const { search, isActive, page, limit } = query;
  const where: Prisma.UserWhereInput = {
    role: "CUSTOMER",
    ...(isActive !== undefined ? { isActive } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.user.findMany({
      where,
      select: customerSelect,
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  return { data: rows.map(serializeCustomer), meta: { page, limit, total } };
}

/** A user with all their bookings (newest first), or null. */
export async function getUserWithBookings(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: customerSelect });
  if (!user) return null;
  const bookings = await prisma.booking.findMany({
    where: { userId: id },
    include: recentBookingInclude,
    orderBy: [{ bookingDate: "desc" }, { bookingTime: "desc" }],
  });
  return {
    ...serializeCustomer(user),
    bookings: bookings.map((b) => serializeBooking(b, { includeUser: false })),
  };
}

export type UserWithBookingsDTO = NonNullable<Awaited<ReturnType<typeof getUserWithBookings>>>;
