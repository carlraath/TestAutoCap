import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createMemoryDb, type Db } from "@/db/client";
import { auditLog, users } from "@/db/schema";
import { bootstrapAdmin, login, LOGIN_FAILURE_MESSAGE, rotateAdminPassword } from "@/lib/auth";
import { verifyPassword } from "@/lib/passwords";

const PASSWORD = "bootstrap-password-123";

describe("admin bootstrap", () => {
  let db: Db;
  beforeAll(async () => {
    db = await createMemoryDb();
  });

  it("creates the admin once and audits admin.bootstrap", async () => {
    const first = await bootstrapAdmin(db, "Admin", PASSWORD);
    expect(first).toEqual({ created: true, username: "admin" });
    const second = await bootstrapAdmin(db, "admin", "a-different-password-456");
    expect(second).toEqual({ created: false, username: "admin" });

    const admins = await db.select().from(users).where(eq(users.role, "admin"));
    expect(admins).toHaveLength(1);
    expect(await verifyPassword(PASSWORD, admins[0].passwordHash)).toBe(true);

    const rows = await db.select().from(auditLog).where(eq(auditLog.action, "admin.bootstrap"));
    expect(rows).toHaveLength(1);
    expect(rows[0].actorUsername).toBe("admin");
    expect(rows[0].targetId).toBe(admins[0].id);
    expect(JSON.stringify(rows[0].details)).not.toContain(PASSWORD);
  });

  it("refuses to bootstrap with an empty username or a short password", async () => {
    const fresh = await createMemoryDb();
    await expect(bootstrapAdmin(fresh, "", PASSWORD)).rejects.toThrow(/ADMIN_USERNAME/);
    await expect(bootstrapAdmin(fresh, "admin", "short")).rejects.toThrow(/ADMIN_PASSWORD/);
  });
});

describe("login", () => {
  let db: Db;
  beforeAll(async () => {
    db = await createMemoryDb();
    await bootstrapAdmin(db, "admin", PASSWORD);
  });

  it("succeeds with the right password and records last activity", async () => {
    const result = await login(db, "admin", PASSWORD, "10.0.0.1");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.user.username).toBe("admin");
    expect(result.user.role).toBe("admin");
    expect(result.user.participantNumber).toBeNull();
    const row = await db.query.users.findFirst({ where: eq(users.username, "admin") });
    expect(row?.lastActivityAt).toBeInstanceOf(Date);
  });

  it("is case-insensitive on the username and trims whitespace", async () => {
    const result = await login(db, "  ADMIN ", PASSWORD, "10.0.0.1");
    expect(result.ok).toBe(true);
  });

  it("fails with the generic message for a wrong password", async () => {
    const result = await login(db, "admin", "wrong-password-000", "10.0.0.1");
    expect(result).toEqual({ ok: false, message: LOGIN_FAILURE_MESSAGE });
  });

  it("fails with the same generic message for an unknown user", async () => {
    const result = await login(db, "participant-99", PASSWORD, "10.0.0.1");
    expect(result).toEqual({ ok: false, message: LOGIN_FAILURE_MESSAGE });
    expect(LOGIN_FAILURE_MESSAGE).toBe("That participant code and password do not match.");
  });

  it("fails with the generic message for an empty password", async () => {
    const result = await login(db, "admin", "", "10.0.0.1");
    expect(result).toEqual({ ok: false, message: LOGIN_FAILURE_MESSAGE });
  });
});

describe("rotateAdminPassword", () => {
  it("changes the hash after verifying the current password and audits admin.password_rotated", async () => {
    const db = await createMemoryDb();
    await bootstrapAdmin(db, "admin", PASSWORD);
    const row = await db.query.users.findFirst({ where: eq(users.username, "admin") });
    if (!row) throw new Error("admin missing");
    const actor = { userId: row.id, username: row.username, role: "admin" as const, participantNumber: null };

    expect(await rotateAdminPassword(db, actor, "not-the-password-1", "new-password-value-789")).toEqual({
      ok: false,
      message: "The current password is not correct.",
    });
    expect(await rotateAdminPassword(db, actor, PASSWORD, "short")).toMatchObject({ ok: false });
    expect(await rotateAdminPassword(db, actor, PASSWORD, "new-password-value-789")).toEqual({ ok: true });

    expect((await login(db, "admin", PASSWORD, "ip")).ok).toBe(false);
    expect((await login(db, "admin", "new-password-value-789", "ip")).ok).toBe(true);
    const rows = await db.select().from(auditLog).where(eq(auditLog.action, "admin.password_rotated"));
    expect(rows).toHaveLength(1);
  });
});
