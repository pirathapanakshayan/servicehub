import bcrypt from "bcryptjs";
import { apiError, apiSuccess, forbidden, internalError, parseBody } from "@/lib/api-response";
import { publicUserSelect, setSessionCookie, signToken, verifyPassword } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loginSchema } from "@/lib/validators";

const INVALID_CREDENTIALS = "Invalid email or password";

// Compared against when the email is unknown so response time doesn't reveal which accounts exist.
const DUMMY_HASH = bcrypt.hashSync("servicehub-timing-guard", 10);

export async function POST(request: Request) {
  const body = await parseBody(request, loginSchema);
  if (!body.ok) return body.response;

  const { email, password, adminOnly } = body.data;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { ...publicUserSelect, passwordHash: true },
    });

    const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !passwordOk) return apiError("UNAUTHORIZED", INVALID_CREDENTIALS, 401);

    if (!user.isActive) return forbidden("Your account has been deactivated");
    if (adminOnly && user.role !== "ADMIN") {
      return forbidden("This account does not have admin access");
    }

    const token = await signToken({ sub: user.id, role: user.role, name: user.name });
    const { passwordHash: _passwordHash, ...publicUser } = user;
    const response = apiSuccess({ user: publicUser });
    setSessionCookie(response, token);
    return response;
  } catch (error) {
    console.error("[auth/login]", error);
    return internalError();
  }
}
