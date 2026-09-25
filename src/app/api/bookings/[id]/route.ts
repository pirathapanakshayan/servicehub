import { Prisma } from "@prisma/client";
import { apiError, apiSuccess, forbidden, internalError, parseBody } from "@/lib/api-response";
import { requireAdmin, requireUser } from "@/lib/auth";
import { checkTransition } from "@/lib/booking-rules";
import { getBookingForViewer } from "@/lib/bookings";
import { prisma } from "@/lib/prisma";
import { bookingUpdateSchema, uuidParamSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

const notFound = () => apiError("NOT_FOUND", "Booking not found", 404);

async function parseId(context: RouteContext) {
  const parsed = uuidParamSchema.safeParse((await context.params).id);
  return parsed.success ? parsed.data : null;
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const id = await parseId(context);
  if (!id) return notFound();

  try {
    const booking = await getBookingForViewer(id, {
      userId: auth.session.sub,
      isAdmin: auth.session.role === "ADMIN",
    });
    return booking ? apiSuccess({ data: booking }) : notFound();
  } catch (error) {
    console.error("[bookings:get]", error);
    return internalError();
  }
}

export async function PUT(request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const id = await parseId(context);
  if (!id) return notFound();

  const body = await parseBody(request, bookingUpdateSchema);
  if (!body.ok) return body.response;

  const isAdmin = auth.session.role === "ADMIN";
  const nextStatus = body.data.status;

  try {
    const existing = await prisma.booking.findUnique({
      where: { id },
      select: { userId: true, status: true },
    });
    if (!existing || (!isAdmin && existing.userId !== auth.session.sub)) return notFound();
    if (!isAdmin && nextStatus !== "CANCELLED") return forbidden("You can only cancel a booking");

    const check = checkTransition(existing.status, nextStatus, isAdmin ? "ADMIN" : "CUSTOMER");
    if (!check.ok) return apiError("UNPROCESSABLE_ENTITY", check.message, 422);

    // Conditional update: matches nothing if the status changed since it was read.
    const { count } = await prisma.booking.updateMany({
      where: { id, status: existing.status },
      data: { status: nextStatus },
    });
    if (count === 0) {
      return apiError("CONFLICT", "This booking was just updated. Refresh and try again.", 409);
    }

    const booking = await getBookingForViewer(id, { userId: auth.session.sub, isAdmin });
    return apiSuccess({ data: booking });
  } catch (error) {
    console.error("[bookings:update]", error);
    return internalError();
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const id = await parseId(context);
  if (!id) return notFound();

  try {
    await prisma.booking.delete({ where: { id } });
    return apiSuccess({ success: true });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2025") {
      return notFound();
    }
    console.error("[bookings:delete]", error);
    return internalError();
  }
}
