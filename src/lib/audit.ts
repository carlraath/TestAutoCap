import { desc } from "drizzle-orm";
import type { Db } from "@/db/client";
import { auditLog, type AuditRow } from "@/db/schema";

export type AuditAction =
  | "admin.bootstrap"
  | "admin.password_rotated"
  | "participants.bulk_created"
  | "participant.password_regenerated"
  | "attempt.reset"
  | "item.retired"
  | "exercise.closed"
  | "export.created"
  | "attempt.started"
  | "attempt.submitted"
  | "attempt.auto_submitted";

export interface AuditActor {
  userId: string | null;
  username: string;
  role: "admin" | "participant";
}

export interface AuditOptions {
  targetType?: string;
  targetId?: string;
  reason?: string;
  details?: Record<string, unknown>;
}

/** Records one state-changing action in the audit log. Never pass passwords in details. */
export async function audit(db: Db, actor: AuditActor, action: AuditAction, options: AuditOptions = {}): Promise<AuditRow> {
  const [row] = await db
    .insert(auditLog)
    .values({
      actorUserId: actor.userId,
      actorUsername: actor.username,
      actorRole: actor.role,
      action,
      targetType: options.targetType ?? null,
      targetId: options.targetId ?? null,
      reason: options.reason ?? null,
      details: options.details ?? null,
    })
    .returning();
  return row;
}

/** Lists audit rows newest first. */
export async function listAudit(db: Db, { limit = 100, offset = 0 }: { limit?: number; offset?: number } = {}): Promise<AuditRow[]> {
  return db.select().from(auditLog).orderBy(desc(auditLog.id)).limit(limit).offset(offset);
}
