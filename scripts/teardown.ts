/**
 * Teardown: verifiably deletes all application data.
 *
 *   npm run db:teardown -- --yes
 *
 * Embedded PGlite (no DATABASE_URL): removes the DATA_DIR directory and confirms it no longer exists.
 * Managed Postgres (DATABASE_URL): drops every application table and confirms the public schema holds none of them.
 * Prints a dated deletion confirmation the operator can paste into the written confirmation to the owner.
 */
import { loadEnvConfig } from "@next/env";
import fs from "node:fs";
import { resolveDatabaseTarget, type DatabaseTarget } from "@/db/config";
import { formatDatabaseFailure } from "@/db/errors";

loadEnvConfig(process.cwd());

const TABLES = ["attempts", "audit_log", "login_attempts", "items", "settings", "users", "schema_migrations"];

async function main(): Promise<void> {
  if (!process.argv.includes("--yes")) {
    console.error("Refusing to delete anything without --yes. This removes every participant, attempt, item and audit row.");
    process.exit(2);
  }
  const stamp = new Date().toISOString();
  const target = resolveDatabaseTarget();
  console.log(`Using ${target.description}.`);
  if (target.kind === "managed") {
    const { Pool } = await import("pg");
    const pool = new Pool({
      connectionString: target.connectionString,
      ...(target.ssl === undefined ? {} : { ssl: target.ssl }),
      max: 1,
      connectionTimeoutMillis: 15_000,
      application_name: "capability-placement",
    });
    for (const t of TABLES) {
      await pool.query(`DROP TABLE IF EXISTS ${t} CASCADE`);
    }
    const left = await pool.query(
      `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = ANY($1::text[])`,
      [TABLES],
    );
    await pool.end();
    if (left.rowCount && left.rowCount > 0) {
      console.error(`FAIL tables still present: ${left.rows.map((r: { table_name: string }) => r.table_name).join(", ")}`);
      process.exit(1);
    }
    console.log(`DELETION CONFIRMED ${stamp}: all application tables dropped from the managed database. Now delete the database itself in the provider console and revoke its credentials.`);
    return;
  }
  const dataDir = target.dataDir;
  if (dataDir === ":memory:") {
    console.log(`DELETION CONFIRMED ${stamp}: the database was in memory only, so nothing was ever written to disk.`);
    return;
  }
  fs.rmSync(dataDir, { recursive: true, force: true });
  if (fs.existsSync(dataDir)) {
    console.error(`FAIL ${dataDir} still exists`);
    process.exit(1);
  }
  console.log(`DELETION CONFIRMED ${stamp}: embedded database directory ${dataDir} removed and verified absent.`);
}

main().catch((err: unknown) => {
  let target: DatabaseTarget | null = null;
  try {
    target = resolveDatabaseTarget();
  } catch {
    target = null;
  }
  console.error(formatDatabaseFailure(err, target));
  if (process.env.DEBUG_DB) console.error(err);
  process.exit(1);
});
