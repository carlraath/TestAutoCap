import { eq } from "drizzle-orm";
import { getIronSession, type IronSession } from "iron-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Db } from "@/db/client";
import { users, type UserRow } from "@/db/schema";
import { audit } from "./audit";
import { hashPassword, verifyPassword } from "./passwords";
import { isLimited, purgeOld, recordAttempt } from "./rate-limit";
import { homeFor, isSignedIn, sessionOptions, type SessionData } from "./session";

export type { SessionData } from "./session";
export { homeFor } from "./session";

/** The one and only login failure message. Used for wrong passwords, unknown users and rate limiting alike. */
export const LOGIN_FAILURE_MESSAGE = "That participant code and password do not match.";

export type LoginResult = { ok: true; user: SessionData } | { ok: false; message: string };

/** The iron-session object for the current request (server components, route handlers and actions). */
export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions());
}

/** The signed-in user for the current request, or null. */
export async function getSessionUser(): Promise<SessionData | null> {
  const session = await getSession();
  return isSignedIn(session) ? { userId: session.userId, username: session.username, role: session.role, participantNumber: session.participantNumber ?? null } : null;
}

/** Returns the signed-in user or redirects to /login. */
export async function requireUser(): Promise<SessionData> {
  const user = await getSessionUser();
  if (!user) redirect("/login");
  return user;
}

/** Returns the signed-in admin, redirecting participants to their dashboard and anonymous visitors to /login. */
export async function requireAdmin(): Promise<SessionData> {
  const user = await requireUser();
  if (user.role !== "admin") redirect(homeFor(user.role));
  return user;
}

/** Returns the signed-in participant, redirecting admins to /admin and anonymous visitors to /login. */
export async function requireParticipant(): Promise<SessionData> {
  const user = await requireUser();
  if (user.role !== "participant") redirect(homeFor(user.role));
  return user;
}

/** Writes the session cookie for a user. Call from a server action or route handler after a successful login. */
export async function establishSession(user: SessionData): Promise<void> {
  const session = await getSession();
  session.userId = user.userId;
  session.username = user.username;
  session.role = user.role;
  session.participantNumber = user.participantNumber;
  await session.save();
}

/** Clears the session cookie. */
export async function clearSession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

function toSessionData(user: UserRow): SessionData {
  return { userId: user.id, username: user.username, role: user.role, participantNumber: user.participantNumber };
}

/**
 * Verifies a username and password. The rate limit is checked before the
 * password, every attempt is recorded, and the failure message is always the
 * same generic sentence. On success the user's lastActivityAt is updated.
 * Does not touch cookies; the caller establishes the session.
 */
export async function login(db: Db, username: string, password: string, ip: string): Promise<LoginResult> {
  const name = username.trim().toLowerCase();
  const address = ip.trim() || "local";
  await purgeOld(db);
  if (!name || !password || (await isLimited(db, name, address))) {
    await recordAttempt(db, name || "-", address, false);
    return { ok: false, message: LOGIN_FAILURE_MESSAGE };
  }
  const user = await db.query.users.findFirst({ where: eq(users.username, name) });
  const verified = user ? await verifyPassword(password, user.passwordHash) : false;
  await recordAttempt(db, name, address, verified);
  if (!user || !verified) return { ok: false, message: LOGIN_FAILURE_MESSAGE };
  await db.update(users).set({ lastActivityAt: new Date() }).where(eq(users.id, user.id));
  return { ok: true, user: toSessionData(user) };
}

/**
 * Creates the admin account from the bootstrap credentials when no admin
 * exists yet, auditing admin.bootstrap. Idempotent: returns created=false on
 * later runs and never changes an existing admin's password.
 */
export async function bootstrapAdmin(db: Db, username: string, password: string): Promise<{ created: boolean; username: string }> {
  const existing = await db.query.users.findFirst({ where: eq(users.role, "admin") });
  if (existing) return { created: false, username: existing.username };
  const name = username.trim().toLowerCase();
  if (!name) throw new Error("ADMIN_USERNAME must be set to bootstrap the administrator.");
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters.");
  const [admin] = await db
    .insert(users)
    .values({ username: name, role: "admin", passwordHash: await hashPassword(password) })
    .returning();
  await audit(db, { userId: admin.id, username: admin.username, role: "admin" }, "admin.bootstrap", {
    targetType: "user",
    targetId: admin.id,
    details: { username: admin.username },
  });
  return { created: true, username: admin.username };
}

export type RotateResult = { ok: true } | { ok: false; message: string };

/** Changes the signed-in admin's own password after verifying the current one, auditing admin.password_rotated. */
export async function rotateAdminPassword(db: Db, admin: SessionData, currentPassword: string, newPassword: string): Promise<RotateResult> {
  if (admin.role !== "admin") return { ok: false, message: "Only an administrator can change this password." };
  if (newPassword.length < 12) return { ok: false, message: "The new password must be at least 12 characters." };
  const row = await db.query.users.findFirst({ where: eq(users.id, admin.userId) });
  if (!row || !(await verifyPassword(currentPassword, row.passwordHash))) {
    return { ok: false, message: "The current password is not correct." };
  }
  await db.update(users).set({ passwordHash: await hashPassword(newPassword), passwordRegeneratedAt: new Date() }).where(eq(users.id, row.id));
  await audit(db, { userId: admin.userId, username: admin.username, role: "admin" }, "admin.password_rotated", {
    targetType: "user",
    targetId: row.id,
  });
  return { ok: true };
}
