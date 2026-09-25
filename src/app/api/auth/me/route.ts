import { apiSuccess, forbidden, internalError, unauthorized } from "@/lib/api-response";
import { getSession, publicUserSelect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getSession();
  if (!session) return unauthorized();

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.sub },
      select: publicUserSelect,
    });
    if (!user) return unauthorized();
    if (!user.isActive) return forbidden("Your account has been deactivated");

    return apiSuccess({ user });
  } catch (error) {
    console.error("[auth/me]", error);
    return internalError();
  }
}
