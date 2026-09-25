import {
  apiError,
  apiSuccess,
  internalError,
  parseBody,
  validationError,
} from "@/lib/api-response";
import { isAdminViewer, requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { listServices, serializeService, serviceInclude } from "@/lib/services";
import { serviceQuerySchema, serviceSchema } from "@/lib/validators";

export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = serviceQuerySchema.safeParse(params);
  if (!parsed.success) return validationError(parsed.error);

  try {
    const result = await listServices(parsed.data, { isAdmin: await isAdminViewer() });
    return apiSuccess(result);
  } catch (error) {
    console.error("[services:list]", error);
    return internalError();
  }
}

export async function POST(request: Request) {
  const auth = await requireAdmin();
  if (!auth.ok) return auth.response;

  const body = await parseBody(request, serviceSchema);
  if (!body.ok) return body.response;

  try {
    const category = await prisma.category.findUnique({
      where: { id: body.data.categoryId },
      select: { id: true },
    });
    if (!category) {
      return apiError("VALIDATION_ERROR", "Category does not exist", 400, {
        categoryId: ["Category does not exist"],
      });
    }

    const service = await prisma.service.create({ data: body.data, include: serviceInclude });
    return apiSuccess({ data: serializeService(service) }, 201);
  } catch (error) {
    console.error("[services:create]", error);
    return internalError();
  }
}
