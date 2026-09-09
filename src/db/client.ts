import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { runMigrations } from "./migrate";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * One schema, two drivers.
 * - DATABASE_URL set: node-postgres against managed Postgres (Neon, Railway, Render, ...).
 * - DATABASE_URL unset: PGlite, an embedded Postgres persisted to DATA_DIR (default ./data/pglite).
 *   DATA_DIR=":memory:" gives a throwaway in-memory database (tests).
 * The instance is cached on globalThis so Next.js dev reloads do not open a second PGlite on the same directory.
 */

type Holder = { db?: Db; ready?: Promise<Db> };
const holder = globalThis as unknown as { __cpDb?: Holder };
if (!holder.__cpDb) holder.__cpDb = {};

export async function getDb(): Promise<Db> {
  const h = holder.__cpDb as Holder;
  if (h.db) return h.db;
  if (!h.ready) {
    h.ready = createDb().then((db) => {
      h.db = db;
      return db;
    });
  }
  return h.ready;
}

/** Creates a fresh, migrated, in-memory database. For tests only. */
export async function createMemoryDb(): Promise<Db> {
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const client = new PGlite();
  const db = drizzle(client, { schema }) as unknown as Db;
  await runMigrations(db);
  return db;
}

async function createDb(): Promise<Db> {
  const url = process.env.DATABASE_URL?.trim();
  if (url) {
    const { drizzle } = await import("drizzle-orm/node-postgres");
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: url, max: 5 });
    const db = drizzle(pool, { schema }) as unknown as Db;
    await runMigrations(db);
    return db;
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  const dataDir = process.env.DATA_DIR?.trim() || "./data/pglite";
  const client = dataDir === ":memory:" ? new PGlite() : new PGlite(dataDir);
  const db = drizzle(client, { schema }) as unknown as Db;
  await runMigrations(db);
  return db;
}

export { schema };
