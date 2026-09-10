import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { MIGRATIONS } from "./migrations";

type AnyDb = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

/**
 * Advisory lock identifier for schema migrations. Any number would do; it only has to be the same
 * in every process that migrates this database.
 */
const MIGRATION_LOCK = "6127893451";

export interface MigrateOptions {
  /**
   * Take a transaction-scoped advisory lock first, so that two processes starting at the same time
   * cannot both create the schema. Needed on managed PostgreSQL, where several serverless instances
   * can open the database at once. The lock is released when the transaction ends, which is what
   * makes it safe through a connection pooler.
   */
  serialise?: boolean;
}

/** Applies each migration once, in order, tracked in schema_migrations. Safe to run on every start. */
export async function runMigrations(db: AnyDb, options: MigrateOptions = {}): Promise<string[]> {
  if (options.serialise) {
    return db.transaction(async (tx) => {
      await tx.execute(sql.raw(`SELECT pg_advisory_xact_lock(${MIGRATION_LOCK})`));
      return applyMigrations(tx as unknown as AnyDb);
    });
  }
  return applyMigrations(db);
}

async function applyMigrations(db: AnyDb): Promise<string[]> {
  await db.execute(
    sql`CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())`,
  );
  const applied = (await db.execute(sql`SELECT name FROM schema_migrations`)) as { rows: Array<{ name: string }> };
  const done = new Set(applied.rows.map((r) => r.name));
  const ran: string[] = [];
  for (const m of MIGRATIONS) {
    if (done.has(m.name)) continue;
    for (const statement of m.statements) {
      await db.execute(sql.raw(statement));
    }
    await db.execute(sql`INSERT INTO schema_migrations (name) VALUES (${m.name})`);
    ran.push(m.name);
  }
  return ran;
}

/** Lists every table.column in the public schema. Used by the no-PII verification. */
export async function listColumns(db: AnyDb): Promise<string[]> {
  const res = (await db.execute(
    sql`SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = 'public' ORDER BY table_name, ordinal_position`,
  )) as { rows: Array<{ table_name: string; column_name: string }> };
  return res.rows.map((r) => `${r.table_name}.${r.column_name}`);
}
