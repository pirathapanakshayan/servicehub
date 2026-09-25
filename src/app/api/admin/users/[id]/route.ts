import { apiError, apiSuccess, forbidden, internalError, parseBody } from "@/lib/api-response";
import { getUserWithBookings } from "@/lib/admin";
import { publicUserSelect, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { userUpdateSchema, uuidParamSchema } from "@/lib/validators";

type RouteContext = { params: Promise<{ id: string }> };

const notFound = () => apiError("NOT_FOUND", "User not found", 404);

async function parseId(context: RouteContext) {
  const parsed = uuidParamSchema.safeParse((await context.params).id);
  return parsed.success ? parsed.data : null;
}

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const id = await parseId(context);
  if (!id) return notFound();

  try {
    const user = await getUserWithBookings(id);
    return user ? apiSuccess({ data: user }) : notFound();
  } catch (error) {
    console.error("[admin:users:get]", error);
    return internalError();
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const id = await parseId(context);
  if (!id) return notFound();

  const body = await parseBody(request, userUpdateSchema);
  if (!body.ok) return body.response;

  if (id === auth.session.sub && !body.data.isActive) {
    return forbidden("You cannot deactivate your own account");
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id }, select: { id: true } });
    if (!existing) return notFound();

    const user = await prisma.user.update({
      where: { id },
      data: { isActive: body.data.isActive },
      select: publicUserSelect,
    });
    return apiSuccess({ data: user });
  } catch (error) {
    console.error("[admin:users:update]", error);
    return internalError();
  }
}
