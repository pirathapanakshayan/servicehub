import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ServiceQuery } from "@/lib/validators";

const serviceInclude = {
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.ServiceInclude;

type ServiceWithCategory = Prisma.ServiceGetPayload<{ include: typeof serviceInclude }>;

/** Plain, client-safe service shape (Decimal and Date serialized). */
export type ServiceDTO = Omit<ServiceWithCategory, "price" | "createdAt" | "updatedAt"> & {
  price: string;
  createdAt: string;
  updatedAt: string;
};

export function serializeService(service: ServiceWithCategory): ServiceDTO {
  return {
    ...service,
    price: service.price.toFixed(2),
    createdAt: service.createdAt.toISOString(),
    updatedAt: service.updatedAt.toISOString(),
  };
}

const ORDER_BY: Record<ServiceQuery["sort"], Prisma.ServiceOrderByWithRelationInput[]> = {
  newest: [{ createdAt: "desc" }, { id: "asc" }],
  price_asc: [{ price: "asc" }, { name: "asc" }],
  price_desc: [{ price: "desc" }, { name: "asc" }],
};

/**
 * Lists services with filters, sorting and pagination.
 * `includeInactive` is honoured only when the caller is an admin.
 */
export async function listServices(query: ServiceQuery, { isAdmin }: { isAdmin: boolean }) {
  const { search, categoryId, minPrice, maxPrice, sort, page, limit } = query;
  const includeInactive = isAdmin && (query.includeInactive || query.status !== undefined);
  const status = isAdmin ? query.status : undefined;

  const where: Prisma.ServiceWhereInput = {
    ...(status ? { status } : includeInactive ? {} : { status: "ACTIVE" }),
    ...(categoryId ? { categoryId } : {}),
    ...(minPrice !== undefined || maxPrice !== undefined
      ? { price: { gte: minPrice, lte: maxPrice } }
      : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const [rows, total] = await prisma.$transaction([
    prisma.service.findMany({
      where,
      include: serviceInclude,
      orderBy: ORDER_BY[sort],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.service.count({ where }),
  ]);

  return { data: rows.map(serializeService), meta: { page, limit, total } };
}

/** Returns the service, or null if missing or (for non-admins) inactive. */
export async function getService(id: string, { isAdmin }: { isAdmin: boolean }) {
  const service = await prisma.service.findUnique({ where: { id }, include: serviceInclude });
  if (!service || (!isAdmin && service.status !== "ACTIVE")) return null;
  return serializeService(service);
}

export async function getFeaturedServices(take = 6) {
  const rows = await prisma.service.findMany({
    where: { status: "ACTIVE" },
    include: serviceInclude,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take,
  });
  return rows.map(serializeService);
}

export function getCategories() {
  return prisma.category.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });
}

export type CategoryDTO = Awaited<ReturnType<typeof getCategories>>[number];

export { serviceInclude };

export async function getCategoriesWithCounts() {
  const rows = await prisma.category.findMany({
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { services: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { createdAt: "asc" },
  });
  return rows.map(({ _count, ...c }) => ({ ...c, serviceCount: _count.services }));
}

/** Headline numbers for the landing page. */
export async function getLandingStats() {
  const [services, bookings, customers] = await prisma.$transaction([
    prisma.service.count({ where: { status: "ACTIVE" } }),
    prisma.booking.count(),
    prisma.user.count({ where: { role: "CUSTOMER" } }),
  ]);
  return { services, bookings, customers };
}

/** Other active services in the same category (newest first), for the detail page. */
export async function getRelatedServices(service: { id: string; categoryId: string }, take = 3) {
  const rows = await prisma.service.findMany({
    where: { status: "ACTIVE", categoryId: service.categoryId, id: { not: service.id } },
    include: serviceInclude,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    take,
  });
  return rows.map(serializeService);
}
