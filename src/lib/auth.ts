import "server-only";

import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { NextResponse } from "next/server";
import { forbidden, unauthorized } from "@/lib/api-response";
import {
  SESSION_COOKIE,
  SESSION_MAX_AGE_SECONDS,
  signToken,
  verifyToken,
  type SessionPayload,
} from "@/lib/jwt";
import { prisma } from "@/lib/prisma";

export { signToken, verifyToken, SESSION_COOKIE, type SessionPayload };

const BCRYPT_ROUNDS = 10;

export function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

export function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function setSessionCookie(response: NextResponse, token: string) {
  response.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export function clearSessionCookie(response: NextResponse) {
  response.cookies.set(SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

/** Reads and verifies the session cookie. For Server Components, route handlers and actions. */
export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  return verifyToken(cookieStore.get(SESSION_COOKIE)?.value);
}

/** Public user fields (never includes passwordHash). */
export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

type AuthResult = { ok: true; session: SessionPayload } | { ok: false; response: NextResponse };

/**
 * For route handlers: resolves the session and confirms the user still exists and is active.
 * Usage: `const auth = await requireUser(); if (!auth.ok) return auth.response;`
 */
export async function requireUser(): Promise<AuthResult> {
  const session = await getSession();
  if (!session) return { ok: false, response: unauthorized() };

  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { isActive: true, role: true, name: true },
  });
  if (!user) return { ok: false, response: unauthorized() };
  if (!user.isActive)
    return { ok: false, response: forbidden("Your account has been deactivated") };

  // Trust the database role over the token in case it changed since login.
  return { ok: true, session: { sub: session.sub, role: user.role, name: user.name } };
}

/** For admin route handlers: 401 if not logged in, 403 if not an ADMIN. */
export async function requireAdmin(): Promise<AuthResult> {
  const auth = await requireUser();
  if (!auth.ok) return auth;
  if (auth.session.role !== "ADMIN") return { ok: false, response: forbidden() };
  return auth;
}

/**
 * True only for a logged-in, active ADMIN, confirmed against the database (a token issued
 * before the account was deactivated or demoted is not enough). For public routes that show
 * admins extra data.
 */
export async function isAdminViewer(): Promise<boolean> {
  const session = await getSession();
  if (session?.role !== "ADMIN") return false;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: { role: true, isActive: true },
  });
  return user?.role === "ADMIN" && user.isActive;
}

/** The logged-in, active user's public fields, or null. For Server Components. */
export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.sub },
    select: publicUserSelect,
  });
  return user?.isActive ? user : null;
}

/** For protected pages: returns the current user or redirects to login. */
export async function requirePageUser(currentPath: string) {
  const user = await getCurrentUser();
  if (!user) redirect(sessionEndedPath(`/login?redirect=${encodeURIComponent(currentPath)}`));
  return user;
}

/** For admin pages: returns the current admin or redirects to the admin login. */
export async function requirePageAdmin() {
  const user = await getCurrentUser();
  if (!user || user.role !== "ADMIN") redirect(sessionEndedPath("/admin/login"));
  return user;
}

/** Clears a stale session cookie on the way to `next` (see GET /api/auth/logout). */
function sessionEndedPath(next: string) {
  return `/api/auth/logout?next=${encodeURIComponent(next)}`;
}
