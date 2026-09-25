import { Prisma } from "@prisma/client";
import { apiError, apiSuccess, internalError, parseBody } from "@/lib/api-response";
import { hashPassword, publicUserSelect } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validators";

const EMAIL_TAKEN = "An account with this email already exists";

export async function POST(request: Request) {
  const body = await parseBody(request, registerSchema);
  if (!body.ok) return body.response;

  const { name, email, password, phone } = body.data;

  try {
    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) return apiError("CONFLICT", EMAIL_TAKEN, 409);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        phone: phone || null,
        role: "CUSTOMER",
      },
      select: publicUserSelect,
    });

    return apiSuccess({ user }, 201);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return apiError("CONFLICT", EMAIL_TAKEN, 409);
    }
    console.error("[auth/register]", error);
    return internalError();
  }
}
