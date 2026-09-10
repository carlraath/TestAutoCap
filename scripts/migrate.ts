/**
 * Creates or updates the database schema, then stops.
 *
 *   npx tsx scripts/migrate.ts
 *
 * Safe to run as often as you like: each migration is applied once and recorded in schema_migrations.
 */
import { loadEnvConfig } from "@next/env";
import { sql } from "drizzle-orm";
import { runDbScript } from "./lib/db-script";

loadEnvConfig(process.cwd());

void runDbScript(async (db) => {
  const applied = (await db.execute(sql`SELECT name FROM schema_migrations ORDER BY name`)) as {
    rows: Array<{ name: string }>;
  };
  console.log("Database ready. Migrations applied (see schema_migrations).");
  console.log(`Migrations in place: ${applied.rows.map((r) => r.name).join(", ")}.`);
});
