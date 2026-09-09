import { beforeAll, describe, expect, it } from "vitest";
import { createMemoryDb, type Db } from "@/db/client";
import { loginAttempts } from "@/db/schema";
import { bootstrapAdmin, login, LOGIN_FAILURE_MESSAGE } from "@/lib/auth";
import { bulkCreateParticipants } from "@/lib/participants";
import { isLimited, purgeOld, recordAttempt } from "@/lib/rate-limit";

const PASSWORD = "bootstrap-password-123";

describe("rate limit", () => {
  let db: Db;
  let participantPassword: string;
  beforeAll(async () => {
    db = await createMemoryDb();
    await bootstrapAdmin(db, "admin", PASSWORD);
    const [created] = await bulkCreateParticipants(db, { userId: null, username: "admin", role: "admin" }, 1);
    participantPassword = created.password;
  });

  it("refuses the 11th attempt for a username after 10 failures, even with the right password", async () => {
    for (let i = 0; i < 10; i += 1) {
      const r = await login(db, "admin", "wrong-password-000", `10.0.1.${i}`);
      expect(r.ok).toBe(false);
    }
    expect(await isLimited(db, "admin", "10.0.9.9")).toBe(true);
    const refused = await login(db, "admin", PASSWORD, "10.0.9.9");
    expect(refused).toEqual({ ok: false, message: LOGIN_FAILURE_MESSAGE });
    // A different account from a fresh address is unaffected.
    const other = await login(db, "participant-01", participantPassword, "10.0.9.9");
    expect(other.ok).toBe(true);
  });

  it("refuses the 11th attempt from an IP after 10 failures across different usernames", async () => {
    const ip = "192.0.2.77";
    for (let i = 0; i < 10; i += 1) {
      const r = await login(db, `participant-${50 + i}`, "wrong-password-000", ip);
      expect(r.ok).toBe(false);
    }
    expect(await isLimited(db, "participant-01", ip)).toBe(true);
    const refused = await login(db, "participant-01", participantPassword, ip);
    expect(refused).toEqual({ ok: false, message: LOGIN_FAILURE_MESSAGE });
    // The same account from another address still works.
    const fine = await login(db, "participant-01", participantPassword, "192.0.2.78");
    expect(fine.ok).toBe(true);
  });

  it("only counts failures inside the 15 minute window and purges rows older than 24 hours", async () => {
    const fresh = await createMemoryDb();
    const old = new Date(Date.now() - 16 * 60 * 1000);
    const ancient = new Date(Date.now() - 25 * 60 * 60 * 1000);
    for (let i = 0; i < 10; i += 1) await fresh.insert(loginAttempts).values({ username: "u", ip: "ip", success: false, at: old });
    await fresh.insert(loginAttempts).values({ username: "u", ip: "ip", success: false, at: ancient });
    expect(await isLimited(fresh, "u", "ip")).toBe(false);
    await recordAttempt(fresh, "u", "ip", false);
    expect(await isLimited(fresh, "u", "ip")).toBe(false);
    expect((await fresh.select().from(loginAttempts)).length).toBe(12);
    await purgeOld(fresh);
    expect((await fresh.select().from(loginAttempts)).length).toBe(11);
  });
});
