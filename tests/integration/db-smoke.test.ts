import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createMemoryDb, type Db } from "@/db/client";
import { listColumns, runMigrations } from "@/db/migrate";
import * as schema from "@/db/schema";
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

describe("migrations", () => {
  it("applies once and is safe to run again", async () => {
    const db = await createMemoryDb();
    expect(await runMigrations(db)).toEqual([]);
    expect((await listColumns(db)).length).toBeGreaterThan(20);
  });

  it("runs under the transaction and advisory lock used on managed PostgreSQL", async () => {
    // The managed path serialises migrations so that two instances starting at once cannot
    // both create the schema. Exercise that code path, and the SQL it runs, against real Postgres.
    const { PGlite } = await import("@electric-sql/pglite");
    const { drizzle } = await import("drizzle-orm/pglite");
    const db = drizzle(new PGlite(), { schema }) as unknown as Db;

    expect(await runMigrations(db, { serialise: true })).toEqual(["0001_init"]);
    expect(await runMigrations(db, { serialise: true })).toEqual([]);

    const applied = (await db.execute(sql`SELECT name FROM schema_migrations`)) as { rows: Array<{ name: string }> };
    expect(applied.rows.map((r) => r.name)).toEqual(["0001_init"]);
    expect(findPiiIdentifiers(await listColumns(db))).toEqual([]);
  });
});
