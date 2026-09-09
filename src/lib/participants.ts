import { and, eq, inArray, sql } from "drizzle-orm";
import type { Db } from "@/db/client";
import { attempts, users } from "@/db/schema";
import { ASSESSMENT_IDS } from "@/engine/structure";
import type { AssessmentId, AttemptStatus } from "@/engine/types";
import { audit, type AuditActor } from "./audit";
import { toCsv } from "./csv";
import { generatePassword, hashPassword } from "./passwords";

export const MAX_BULK_CREATE = 200;

export interface Credential {
  code: string;
  password: string;
}

export interface ParticipantSummary {
  userId: string;
  code: string;
  number: number;
  displayName: string;
  statuses: Record<AssessmentId, AttemptStatus>;
  resets: number;
  lastActivityAt: Date | null;
}

/** The Allocation Register headers, exactly as exported. */
export const REGISTER_HEADERS = ["Participant code", "Initial password", "Allocated to"];

/** "Participant 7" style display name for a participant number. */
export function participantDisplayName(number: number): string {
  return `Participant ${number}`;
}

/** "participant-07" for numbers up to 99, "participant-100" beyond. */
export function participantCode(number: number): string {
  return `participant-${number < 100 ? String(number).padStart(2, "0") : String(number)}`;
}

/** Renders the one-time Allocation Register CSV. The "Allocated to" column is left empty for offline completion. */
export function registerCsv(credentials: Credential[]): string {
  return toCsv(
    REGISTER_HEADERS,
    credentials.map((c) => [c.code, c.password, ""]),
  );
}

async function nextFreeNumber(db: Db): Promise<number> {
  const [row] = await db.select({ max: sql<number | null>`max(${users.participantNumber})` }).from(users);
  return (row?.max ?? 0) + 1;
}

/**
 * Creates `count` participants from the next free number, returning each code
 * with its generated password exactly once. Passwords are never stored or
 * logged; the audit row carries the codes only.
 */
export async function bulkCreateParticipants(db: Db, admin: AuditActor, count: number): Promise<Credential[]> {
  if (!Number.isInteger(count) || count < 1 || count > MAX_BULK_CREATE) {
    throw new Error(`Count must be a whole number between 1 and ${MAX_BULK_CREATE}.`);
  }
  const start = await nextFreeNumber(db);
  const credentials: Credential[] = [];
  const rows: (typeof users.$inferInsert)[] = [];
  for (let n = start; n < start + count; n += 1) {
    const password = generatePassword();
    credentials.push({ code: participantCode(n), password });
    rows.push({ username: participantCode(n), role: "participant", participantNumber: n, passwordHash: await hashPassword(password) });
  }
  await db.insert(users).values(rows);
  await audit(db, admin, "participants.bulk_created", {
    targetType: "participants",
    details: { count, from: participantCode(start), to: participantCode(start + count - 1), codes: credentials.map((c) => c.code) },
  });
  return credentials;
}

/** Replaces one participant's password, returning the new password once and auditing the change. */
export async function regeneratePassword(db: Db, admin: AuditActor, userId: string): Promise<Credential> {
  const user = await db.query.users.findFirst({ where: and(eq(users.id, userId), eq(users.role, "participant")) });
  if (!user) throw new Error("Participant not found.");
  const password = generatePassword();
  await db.update(users).set({ passwordHash: await hashPassword(password), passwordRegeneratedAt: new Date() }).where(eq(users.id, user.id));
  await audit(db, admin, "participant.password_regenerated", { targetType: "user", targetId: user.id, details: { code: user.username } });
  return { code: user.username, password };
}

/** Empty status map: every assessment not started. */
export function emptyStatuses(): Record<AssessmentId, AttemptStatus> {
  return { ta: "not_started", sql: "not_started", python: "not_started" };
}

function isAssessment(value: string): value is AssessmentId {
  return (ASSESSMENT_IDS as readonly string[]).includes(value);
}

/** Every participant with per-assessment status, reset count and last activity, ordered by number. */
export async function listParticipants(db: Db): Promise<ParticipantSummary[]> {
  const people = await db.select().from(users).where(eq(users.role, "participant")).orderBy(users.participantNumber);
  if (people.length === 0) return [];
  const ids = people.map((p) => p.id);
  const rows = await db
    .select({ userId: attempts.userId, assessmentId: attempts.assessmentId, status: attempts.status })
    .from(attempts)
    .where(inArray(attempts.userId, ids));
  const statuses = new Map<string, Record<AssessmentId, AttemptStatus>>();
  const resets = new Map<string, number>();
  for (const row of rows) {
    if (row.status === "void") {
      resets.set(row.userId, (resets.get(row.userId) ?? 0) + 1);
      continue;
    }
    if (!isAssessment(row.assessmentId)) continue;
    const map = statuses.get(row.userId) ?? emptyStatuses();
    map[row.assessmentId] = row.status;
    statuses.set(row.userId, map);
  }
  return people.map((p) => ({
    userId: p.id,
    code: p.username,
    number: p.participantNumber ?? 0,
    displayName: participantDisplayName(p.participantNumber ?? 0),
    statuses: statuses.get(p.id) ?? emptyStatuses(),
    resets: resets.get(p.id) ?? 0,
    lastActivityAt: p.lastActivityAt,
  }));
}
