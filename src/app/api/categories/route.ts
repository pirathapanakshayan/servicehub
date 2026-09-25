import { apiSuccess, internalError } from "@/lib/api-response";
import { getCategories } from "@/lib/services";

// Always read live categories; never prerender at build time.
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    return apiSuccess({ data: await getCategories() });
  } catch (error) {
    console.error("[categories:list]", error);
    return internalError();
  }
}
