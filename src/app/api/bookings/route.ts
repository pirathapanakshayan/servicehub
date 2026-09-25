import {
  apiError,
  apiSuccess,
  forbidden,
  internalError,
  parseBody,
  validationError,
} from "@/lib/api-response";
import { requireUser } from "@/lib/auth";
import { BookingError, createBooking, listBookings } from "@/lib/bookings";
import { bookingCreateSchema, bookingQuerySchema } from "@/lib/validators";

export async function GET(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const parsed = bookingQuerySchema.safeParse(
    Object.fromEntries(new URL(request.url).searchParams),
  );
  if (!parsed.success) return validationError(parsed.error);

  try {
    const result = await listBookings(parsed.data, {
      userId: auth.session.sub,
      isAdmin: auth.session.role === "ADMIN",
    });
    return apiSuccess(result);
  } catch (error) {
    console.error("[bookings:list]", error);
    return internalError();
  }
}

export async function POST(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;
  if (auth.session.role !== "CUSTOMER") return forbidden("Only customers can make bookings");

  const body = await parseBody(request, bookingCreateSchema);
  if (!body.ok) return body.response;

  try {
    const booking = await createBooking({ userId: auth.session.sub, ...body.data });
    return apiSuccess({ data: booking }, 201);
  } catch (error) {
    if (error instanceof BookingError) {
      return apiError(
        error.code,
        error.message,
        error.status,
        error.field ? { [error.field]: [error.message] } : undefined,
      );
    }
    console.error("[bookings:create]", error);
    return internalError();
  }
}
