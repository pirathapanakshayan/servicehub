import { apiError, apiSuccess, internalError, parseBody } from "@/lib/api-response";
import {
  hashPassword,
  publicUserSelect,
  requireUser,
  setSessionCookie,
  signToken,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { profileUpdateSchema } from "@/lib/validators";

export async function GET() {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.session.sub },
      select: publicUserSelect,
    });
    return apiSuccess({ data: user });
  } catch (error) {
    console.error("[profile:get]", error);
    return internalError();
  }
}

export async function PUT(request: Request) {
  const auth = await requireUser();
  if (!auth.ok) return auth.response;

  const body = await parseBody(request, profileUpdateSchema);
  if (!body.ok) return body.response;
  const { name, phone, currentPassword, newPassword } = body.data;

  try {
    let passwordHash: string | undefined;
    if (newPassword) {
      const current = await prisma.user.findUniqueOrThrow({
        where: { id: auth.session.sub },
        select: { passwordHash: true },
      });
      if (!(await verifyPassword(currentPassword ?? "", current.passwordHash))) {
        return apiError("VALIDATION_ERROR", "Current password is incorrect", 400, {
          currentPassword: ["Current password is incorrect"],
        });
      }
      passwordHash = await hashPassword(newPassword);
    }

    const user = await prisma.user.update({
      where: { id: auth.session.sub },
      data: {
        ...(name !== undefined ? { name } : {}),
        ...(phone !== undefined ? { phone: phone || null } : {}),
        ...(passwordHash ? { passwordHash } : {}),
      },
      select: publicUserSelect,
    });

    const response = apiSuccess({ data: user });
    // The session token carries the display name, so reissue it when the name changes.
    if (name !== undefined && name !== auth.session.name) {
      setSessionCookie(
        response,
        await signToken({ sub: user.id, role: user.role, name: user.name }),
      );
    }
    return response;
  } catch (error) {
    console.error("[profile:update]", error);
    return internalError();
  }
}
