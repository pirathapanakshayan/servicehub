import { Prisma } from "@prisma/client";
import { apiError, apiSuccess, internalError, parseBody } from "@/lib/api-response";
import { isAdminViewer, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getService, serializeService, serviceInclude } from "@/lib/services";
import { serviceSchema, uuidParamSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

const HAS_BOOKINGS = "Service has bookings. Set it to inactive instead.";
const notFound = () => apiError("NOT_FOUND", "Service not found", 404);

async function parseId(context: RouteContext) {
  const parsed = uuidParamSchema.safeParse((await context.params).id);
  return parsed.success ? parsed.data : null;
}

export async function GET(_request: Request, context: RouteContext) {
  const id = await parseId(context);
  if (!id) return notFound();

  try {
    const service = await getService(id, { isAdmin: await isAdminViewer() });
    if (!service) return notFound();
    return apiSuccess({ data: service });
  } catch (error) {
    console.error("[services:get]", error);
    return internalError();
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const id = await parseId(context);
  if (!id) return notFound();

  const body = await parseBody(request, serviceSchema);
  if (!body.ok) return body.response;

  try {
    const [existing, category] = await Promise.all([
      prisma.service.findUnique({ where: { id }, select: { id: true } }),
      prisma.category.findUnique({ where: { id: body.data.categoryId }, select: { id: true } }),
    ]);
    if (!existing) return notFound();
    if (!category) {
      return apiError("VALIDATION_ERROR", "Category does not exist", 400, {
        categoryId: ["Category does not exist"],
      });
    }

    const service = await prisma.service.update({
      where: { id },
      data: body.data,
      include: serviceInclude,
    });
    return apiSuccess({ data: serializeService(service) });
  } catch (error) {
    console.error("[services:update]", error);
    return internalError();
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const id = await parseId(context);
  if (!id) return notFound();

  try {
    const service = await prisma.service.findUnique({
      where: { id },
      select: { _count: { select: { bookings: true } } },
    });
    if (!service) return notFound();
    if (service._count.bookings > 0) return apiError("CONFLICT", HAS_BOOKINGS, 409);

    await prisma.service.delete({ where: { id } });
    return apiSuccess({ success: true });
  } catch (error) {
    // A booking created between the check and the delete trips the FK restriction.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return apiError("CONFLICT", HAS_BOOKINGS, 409);
    }
    console.error("[services:delete]", error);
    return internalError();
  }
}
