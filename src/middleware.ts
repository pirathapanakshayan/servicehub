import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifyToken } from "@/lib/jwt";

const CUSTOMER_PATHS = ["/dashboard", "/my-bookings", "/profile"];
const GUEST_ONLY_PATHS = ["/login", "/register"];
const ADMIN_LOGIN = "/admin/login";

const matches = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifyToken(request.cookies.get(SESSION_COOKIE)?.value);
  const redirect = (path: string) => NextResponse.redirect(new URL(path, request.url));

  if (CUSTOMER_PATHS.some((p) => matches(pathname, p)) && !session) {
    const login = new URL("/login", request.url);
    login.searchParams.set("redirect", `${pathname}${search}`);
    return NextResponse.redirect(login);
  }

  if (matches(pathname, "/admin")) {
    if (pathname === ADMIN_LOGIN) {
      if (session?.role === "ADMIN") return redirect("/admin/dashboard");
      return NextResponse.next();
    }
    if (session?.role !== "ADMIN") return redirect(ADMIN_LOGIN);
  }

  if (GUEST_ONLY_PATHS.some((p) => matches(pathname, p)) && session) {
    return redirect(session.role === "ADMIN" ? "/admin/dashboard" : "/dashboard");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/my-bookings/:path*",
    "/profile/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
