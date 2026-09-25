import { jwtVerify, SignJWT } from "jose";

/**
 * Edge-safe JWT helpers (no Node-only imports) so they can run in middleware.
 * Server code should import these via `@/lib/auth`.
 */

export const SESSION_COOKIE = "session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export type Role = "CUSTOMER" | "ADMIN";

export type SessionPayload = {
  sub: string;
  role: Role;
  name: string;
};

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error("JWT_SECRET must be set and at least 32 characters long");
  }
  return new TextEncoder().encode(secret);
}

export async function signToken(payload: SessionPayload): Promise<string> {
  return new SignJWT({ role: payload.role, name: payload.name })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE_SECONDS}s`)
    .sign(getSecret());
}

/** Returns the session payload, or null if the token is missing, invalid or expired. */
export async function verifyToken(token: string | undefined): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
    const { sub, role, name } = payload;
    if (typeof sub !== "string" || typeof name !== "string") return null;
    if (role !== "CUSTOMER" && role !== "ADMIN") return null;
    return { sub, role, name };
  } catch {
    return null;
  }
}
