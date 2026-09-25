import { apiError, apiSuccess, internalError, validationError } from "@/lib/api-response";
import { availableSlots } from "@/lib/booking-rules";
import { getTakenTimes } from "@/lib/bookings";
import { prisma } from "@/lib/prisma";
import { slotsQuerySchema, uuidParamSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  const id = uuidParamSchema.safeParse((await context.params).id);
  if (!id.success) return apiError("NOT_FOUND", "Service not found", 404);

  const query = slotsQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return validationError(query.error);
  const { date } = query.data;

  try {
    const service = await prisma.service.findUnique({
      where: { id: id.data },
      select: { status: true },
    });
    if (!service || service.status !== "ACTIVE") {
      return apiError("NOT_FOUND", "Service not found", 404);
    }

    const taken = await getTakenTimes(id.data, date);
    return apiSuccess({ data: { date, times: availableSlots(date, taken) } });
  } catch (error) {
    console.error("[services:slots]", error);
    return internalError();
  }
}
