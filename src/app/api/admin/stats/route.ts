import { apiSuccess, internalError } from "@/lib/api-response";
import { getAdminStats } from "@/lib/admin";
import { requireAdmin } from "@/lib/auth";

export async function GET() {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  try {
    return apiSuccess({ data: await getAdminStats() });
  } catch (error) {
    console.error("[admin:stats]", error);
    return internalError();
  }
}
