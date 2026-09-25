import { NextResponse } from "next/server";
import type { z, ZodError } from "zod";

export type ApiErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "BAD_REQUEST"
  | "UNPROCESSABLE_ENTITY"
  | "INTERNAL_ERROR";

export type ApiErrorBody = {
  error: { code: ApiErrorCode; message: string; fields?: Record<string, string[]> };
};

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function apiError(
  code: ApiErrorCode,
  message: string,
  status: number,
  fields?: Record<string, string[]>,
) {
  const body: ApiErrorBody = { error: { code, message, ...(fields ? { fields } : {}) } };
  return NextResponse.json(body, { status });
}

export function validationError(error: ZodError) {
  const fields: Record<string, string[]> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    (fields[key] ??= []).push(issue.message);
  }
  return apiError("VALIDATION_ERROR", error.issues[0]?.message ?? "Invalid input", 400, fields);
}

export const unauthorized = (message = "You must be logged in") =>
  apiError("UNAUTHORIZED", message, 401);

export const forbidden = (message = "You do not have permission to do this") =>
  apiError("FORBIDDEN", message, 403);

export const internalError = () =>
  apiError("INTERNAL_ERROR", "Something went wrong. Please try again.", 500);

/**
 * Reads a JSON request body and validates it with a zod schema.
 * Usage: `const body = await parseBody(request, schema); if (!body.ok) return body.response;`
 */
export async function parseBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<{ ok: true; data: z.output<T> } | { ok: false; response: NextResponse }> {
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return {
      ok: false,
      response: apiError("BAD_REQUEST", "Request body must be valid JSON", 400),
    };
  }
  const parsed = schema.safeParse(json);
  if (!parsed.success) return { ok: false, response: validationError(parsed.error) };
  return { ok: true, data: parsed.data };
}
