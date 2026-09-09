import { eq } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createMemoryDb } from "@/db/client";
import { listColumns } from "@/db/migrate";
import { users } from "@/db/schema";
import { findPiiIdentifiers } from "@/lib/pii-check";

describe("database smoke", () => {
  it("migrates an in-memory PGlite database and round-trips a user row", async () => {
    const db = await createMemoryDb();
    const [inserted] = await db
      .insert(users)
      .values({ username: "participant-01", role: "participant", participantNumber: 1, passwordHash: "x" })
      .returning();
    expect(inserted.id).toMatch(/^[0-9a-f-]{36}$/);
    const found = await db.query.users.findFirst({ where: eq(users.username, "participant-01") });
    expect(found?.participantNumber).toBe(1);
  });

  it("has no personal-data columns anywhere in the schema", async () => {
    const db = await createMemoryDb();
    const cols = await listColumns(db);
    expect(cols.length).toBeGreaterThan(20);
    expect(findPiiIdentifiers(cols)).toEqual([]);
  });

  it("the PII detector still catches real offenders", () => {
    expect(findPiiIdentifiers(["users.email", "users.first_name", "profiles.phoneNumber", "users.display_name", "x.dob"])).toHaveLength(5);
    expect(findPiiIdentifiers(["users.username", "attempts.last_saved_at", "audit_log.actor_username"])).toEqual([]);
  });
});
