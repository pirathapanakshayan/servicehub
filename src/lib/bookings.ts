import "server-only";

import { Prisma } from "@prisma/client";
import {
  ACTIVE_STATUSES,
  dateOnlyToDate,
  dateToDateOnly,
  isFutureSlot,
  nowInBusinessZone,
  type BookingStatus,
} from "@/lib/booking-rules";
import { prisma } from "@/lib/prisma";
import type { BookingQuery } from "@/lib/validators";

const serviceSelect = {
  id: true,
  name: true,
  price: true,
  durationMinutes: true,
  imageUrl: true,
  status: true,
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ServiceSelect;

const userSelect = { id: true, name: true, email: true, phone: true } satisfies Prisma.UserSelect;

const bookingInclude = {
  service: { select: serviceSelect },
  user: { select: userSelect },
} satisfies Prisma.BookingInclude;

type BookingRow = Prisma.BookingGetPayload<{ include: typeof bookingInclude }>;

export type BookingDTO = {
  id: string;
  userId: string;
  serviceId: string;
  bookingDate: string;
  bookingTime: string;
  status: BookingStatus;
  totalPrice: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  service: Omit<BookingRow["service"], "price"> & { price: string };
  /** Present only in admin responses. */
  user?: BookingRow["user"];
};

export function serializeBooking(row: BookingRow, { includeUser }: { includeUser: boolean }) {
  const { user, service, ...booking } = row;
  const dto: BookingDTO = {
    ...booking,
    bookingDate: dateToDateOnly(booking.bookingDate),
    totalPrice: booking.totalPrice.toFixed(2),
    createdAt: booking.createdAt.toISOString(),
    updatedAt: booking.updatedAt.toISOString(),
    service: { ...service, price: service.price.toFixed(2) },
  };
  if (includeUser) dto.user = user;
  return dto;
}

type Viewer = { userId: string; isAdmin: boolean };

/** Customers see only their own bookings; admins see all and may search by customer. */
export async function listBookings(query: BookingQuery, viewer: Viewer) {
  const { status, search, dateFrom, dateTo, page, limit } = query;

  const where: Prisma.BookingWhereInput = {
    ...(viewer.isAdmin ? {} : { userId: viewer.userId }),
    ...(status ? { status } : {}),
    ...(dateFrom || dateTo
      ? {
          bookingDate: {
            ...(dateFrom ? { gte: dateOnlyToDate(dateFrom) } : {}),
            ...(dateTo ? { lte: dateOnlyToDate(dateTo) } : {}),
          },
        }
      : {}),
    ...(viewer.isAdmin && search
      ? {
          OR: [
            { service: { name: { contains: search, mode: "insensitive" } } },
            { user: { name: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: [{ bookingDate: "desc" }, { bookingTime: "desc" }, { createdAt: "desc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return {
    data: rows.map((r) => serializeBooking(r, { includeUser: viewer.isAdmin })),
    meta: { page, limit, total },
  };
}

/** The booking if the viewer owns it or is an admin; otherwise null (callers respond 404). */
export async function getBookingForViewer(id: string, viewer: Viewer) {
  const row = await prisma.booking.findUnique({ where: { id }, include: bookingInclude });
  if (!row || (!viewer.isAdmin && row.userId !== viewer.userId)) return null;
  return serializeBooking(row, { includeUser: viewer.isAdmin });
}

/** Times already taken for a service on a date (non-cancelled bookings). */
export async function getTakenTimes(
  serviceId: string,
  date: string,
  db: Prisma.TransactionClient = prisma,
) {
  const rows = await db.booking.findMany({
    where: {
      serviceId,
      bookingDate: dateOnlyToDate(date),
      status: { in: [...ACTIVE_STATUSES] },
    },
    select: { bookingTime: true },
  });
  return rows.map((r) => r.bookingTime);
}

export class BookingError extends Error {
  constructor(
    public code: "NOT_FOUND" | "CONFLICT" | "VALIDATION_ERROR",
    message: string,
    public status: number,
    public field?: string,
  ) {
    super(message);
  }
}

type CreateBookingArgs = {
  userId: string;
  serviceId: string;
  bookingDate: string;
  bookingTime: string;
  notes: string | null;
};

/**
 * Validates availability and inserts the booking in one serializable transaction, so two
 * concurrent requests for the same slot cannot both succeed.
 */
export async function createBooking(args: CreateBookingArgs) {
  if (!isFutureSlot(args.bookingDate, args.bookingTime)) {
    throw new BookingError(
      "VALIDATION_ERROR",
      "Please choose a date and time in the future",
      400,
      "bookingTime",
    );
  }

  try {
    const row = await prisma.$transaction(
      async (tx) => {
        const service = await tx.service.findUnique({
          where: { id: args.serviceId },
          select: { status: true, price: true },
        });
        if (!service || service.status !== "ACTIVE") {
          throw new BookingError("NOT_FOUND", "Service not found or no longer available", 404);
        }

        const taken = await getTakenTimes(args.serviceId, args.bookingDate, tx);
        if (taken.includes(args.bookingTime)) {
          throw new BookingError("CONFLICT", "This time slot is already booked", 409);
        }

        return tx.booking.create({
          data: {
            userId: args.userId,
            serviceId: args.serviceId,
            bookingDate: dateOnlyToDate(args.bookingDate),
            bookingTime: args.bookingTime,
            notes: args.notes,
            totalPrice: service.price,
            status: "PENDING",
          },
          include: bookingInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return serializeBooking(row, { includeUser: false });
  } catch (error) {
    // Serialization failure: a concurrent request booked the same slot first.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2034") {
      throw new BookingError("CONFLICT", "This time slot is already booked", 409);
    }
    throw error;
  }
}

// ---------------------------------------------------------------------------
// Customer views
// ---------------------------------------------------------------------------

export const BOOKING_TABS = ["all", "upcoming", "past", "cancelled"] as const;
export type BookingTab = (typeof BOOKING_TABS)[number];

/** Upcoming = still open (PENDING/CONFIRMED) and scheduled at or after now. */
function upcomingWhere(): Prisma.BookingWhereInput {
  const now = nowInBusinessZone();
  const today = dateOnlyToDate(now.date);
  return {
    status: { in: ["PENDING", "CONFIRMED"] },
    OR: [{ bookingDate: { gt: today } }, { bookingDate: today, bookingTime: { gte: now.time } }],
  };
}

function tabWhere(tab: BookingTab): Prisma.BookingWhereInput {
  switch (tab) {
    case "upcoming":
      return upcomingWhere();
    case "past":
      return { status: { not: "CANCELLED" }, NOT: upcomingWhere() };
    case "cancelled":
      return { status: "CANCELLED" };
    default:
      return {};
  }
}

export async function listCustomerBookings(
  userId: string,
  tab: BookingTab,
  page: number,
  limit = 10,
) {
  const where: Prisma.BookingWhereInput = { userId, ...tabWhere(tab) };
  const ascending = tab === "upcoming";
  const [rows, total] = await prisma.$transaction([
    prisma.booking.findMany({
      where,
      include: bookingInclude,
      orderBy: [
        { bookingDate: ascending ? "asc" : "desc" },
        { bookingTime: ascending ? "asc" : "desc" },
      ],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);
  return {
    data: rows.map((r) => serializeBooking(r, { includeUser: false })),
    meta: { page, limit, total },
  };
}

export async function getCustomerDashboard(userId: string) {
  const upcoming: Prisma.BookingWhereInput = { userId, ...upcomingWhere() };
  const [upcomingCount, completedCount, spent, next] = await prisma.$transaction([
    prisma.booking.count({ where: upcoming }),
    prisma.booking.count({ where: { userId, status: "COMPLETED" } }),
    prisma.booking.aggregate({
      where: { userId, status: "COMPLETED" },
      _sum: { totalPrice: true },
    }),
    prisma.booking.findFirst({
      where: upcoming,
      include: bookingInclude,
      orderBy: [{ bookingDate: "asc" }, { bookingTime: "asc" }],
    }),
  ]);
  return {
    upcomingCount,
    completedCount,
    totalSpent: (spent._sum.totalPrice ?? new Prisma.Decimal(0)).toFixed(2),
    nextBooking: next ? serializeBooking(next, { includeUser: false }) : null,
  };
}

/** Number of bookings in each My Bookings tab. */
export async function getCustomerTabCounts(userId: string): Promise<Record<BookingTab, number>> {
  const counts = await prisma.$transaction(
    BOOKING_TABS.map((tab) => prisma.booking.count({ where: { userId, ...tabWhere(tab) } })),
  );
  return Object.fromEntries(BOOKING_TABS.map((tab, i) => [tab, counts[i]!])) as Record<
    BookingTab,
    number
  >;
}

/** Active services the customer booked most recently (deduplicated), for "Book again". */
export async function getRecentlyBookedServices(userId: string, take = 4) {
  const rows = await prisma.booking.findMany({
    where: { userId, service: { status: "ACTIVE" } },
    select: { service: { select: serviceSelect } },
    orderBy: { createdAt: "desc" },
    distinct: ["serviceId"],
    take,
  });
  return rows.map(({ service }) => ({ ...service, price: service.price.toFixed(2) }));
}
