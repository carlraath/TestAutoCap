import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { MIGRATIONS } from "./migrations";

type AnyDb = PgDatabase<PgQueryResultHKT, Record<string, unknown>>;

/** Applies each migration once, in order, tracked in schema_migrations. Safe to run on every start. */
export async function runMigrations(db: AnyDb): Promise<string[]> {
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
