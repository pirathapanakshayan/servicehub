import { apiSuccess, internalError, validationError } from "@/lib/api-response";
import { listCustomers } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";
import { userQuerySchema } from "@/lib/validators";

export async function GET(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const parsed = userQuerySchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return validationError(parsed.error);

  try {
    return apiSuccess(await listCustomers(parsed.data));
  } catch (error) {
    console.error("[admin:users:list]", error);
    return internalError();
  }
}
