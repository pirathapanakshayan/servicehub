import { NextResponse } from "next/server";
import { apiSuccess } from "@/lib/api-response";
import { clearSessionCookie } from "@/lib/auth";
import { safeRedirectPath } from "@/lib/validators";

export async function POST() {
  const response = apiSuccess({ success: true });
  clearSessionCookie(response);
  return response;
}

/**
 * Clears the session and redirects. Used by pages when a token is still valid but the
 * account is gone or deactivated; otherwise middleware would bounce /login back to the page.
 */
export async function GET(request: Request) {
  const next = safeRedirectPath(new URL(request.url).searchParams.get("next"), "/login");
  const response = NextResponse.redirect(new URL(next, request.url));
  clearSessionCookie(response);
  return response;
}
