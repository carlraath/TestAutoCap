import type { SessionOptions } from "iron-session";
import { SESSION_TTL_SECONDS } from "@/engine/structure";

/**
 * Session cookie configuration shared by src/lib/auth.ts (server components and
 * actions) and src/proxy.ts (the request proxy). Deliberately free of database
 * and next/headers imports so the proxy bundle stays tiny.
 */

export const SESSION_COOKIE_NAME = "cp_session";
const MIN_SECRET_LENGTH = 32;

export interface SessionData {
  userId: string;
  username: string;
  role: "admin" | "participant";
  participantNumber: number | null;
}

/** Reads SESSION_SECRET, failing loudly when it is missing or too short. */
export function sessionSecret(): string {
  const secret = process.env.SESSION_SECRET?.trim() ?? "";
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`SESSION_SECRET must be set to at least ${MIN_SECRET_LENGTH} characters. See .env.example.`);
  }
  return secret;
}

/** True when cookies must carry the Secure attribute (https APP_URL or production). */
export function cookiesMustBeSecure(): boolean {
  // APP_URL is the address people actually use, so it decides. Marking the cookie Secure when
  // the site is served over plain HTTP would stop some browsers returning it at all, which
  // presents as an endless redirect back to the sign-in page. When APP_URL is not set, fall
  // back to the safe assumption that a production deployment is served over HTTPS.
  const appUrl = process.env.APP_URL?.trim().toLowerCase() ?? "";
  if (appUrl.startsWith("https")) return true;
  if (appUrl.startsWith("http:")) return false;
  return process.env.NODE_ENV === "production";
}

/** iron-session options: cp_session, 8 hour ttl, httpOnly, sameSite lax, path /. */
export function sessionOptions(): SessionOptions {
  return {
    cookieName: SESSION_COOKIE_NAME,
    password: sessionSecret(),
    ttl: SESSION_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      secure: cookiesMustBeSecure(),
    },
  };
}

/** True when the session payload has everything a signed-in user needs. */
export function isSignedIn(data: Partial<SessionData>): data is SessionData {
  return typeof data.userId === "string" && typeof data.username === "string" && (data.role === "admin" || data.role === "participant");
}

/** The landing route for a role. */
export function homeFor(role: SessionData["role"]): string {
  return role === "admin" ? "/admin" : "/dashboard";
}
