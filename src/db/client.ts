import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import * as schema from "./schema";
import { runMigrations } from "./migrate";
import { resolveDatabaseTarget, type DatabaseTarget, type ManagedTarget } from "./config";

export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

/**
 * One schema, two drivers.
 * - DATABASE_URL set: node-postgres against managed Postgres (Neon, Supabase, Railway, Render, ...).
 * - DATABASE_URL unset: PGlite, an embedded Postgres persisted to DATA_DIR (default ./data/pglite).
 *   DATA_DIR=":memory:" gives a throwaway in-memory database (tests).
 *
 * src/db/config.ts decides which of the two we are on and how TLS is configured, so that scripts can
 * print the target before touching it. The instance is cached on globalThis so Next.js dev reloads do
 * not open a second PGlite on the same directory.
 */

type Holder = { db?: Db; ready?: Promise<Db>; target?: DatabaseTarget; close?: () => Promise<void> };
const holder = globalThis as unknown as { __cpDb?: Holder };
if (!holder.__cpDb) holder.__cpDb = {};

export async function getDb(): Promise<Db> {
  const h = holder.__cpDb as Holder;
  if (h.db) return h.db;
  if (!h.ready) {
    h.ready = createDb().then(
      (db) => {
        h.db = db;
        return db;
      },
      (err: unknown) => {
        // Do not cache a failure: a database that was briefly unreachable at start-up would
        // otherwise keep this process failing for ever. The next caller tries again.
        h.ready = undefined;
        throw err;
      },
    );
  }
  return h.ready;
}

/** The database this process is configured to use. Safe to print: it never contains the password. */
export function databaseTarget(): DatabaseTarget {
  const h = holder.__cpDb as Holder;
  if (!h.target) h.target = resolveDatabaseTarget();
  return h.target;
}

/**
 * Closes the connection pool so a command-line script exits instead of sitting at a blank prompt.
 * An open node-postgres pool keeps the Node process alive indefinitely.
 */
export async function closeDb(): Promise<void> {
  const h = holder.__cpDb as Holder;
  const close = h.close;
  h.close = undefined;
  h.db = undefined;
  h.ready = undefined;
  if (close) await close();
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

async function createManagedDb(target: ManagedTarget, h: Holder): Promise<Db> {
  const { drizzle } = await import("drizzle-orm/node-postgres");
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString: target.connectionString,
    // The ssl query parameters were stripped in config.ts, so this is the only thing that decides TLS.
    ...(target.ssl === undefined ? {} : { ssl: target.ssl }),
    max: 5,
    connectionTimeoutMillis: 15_000,
    application_name: "capability-placement",
  });
  h.close = async () => {
    await pool.end();
  };
  const db = drizzle(pool, { schema }) as unknown as Db;
  try {
    // Concurrent cold starts must not race each other into a half-created schema.
    await runMigrations(db, { serialise: true });
  } catch (err) {
    h.close = undefined;
    await pool.end().catch(() => undefined);
    throw err;
  }
  return db;
}

async function createDb(): Promise<Db> {
  const h = holder.__cpDb as Holder;
  const target = databaseTarget();
  if (target.kind === "managed") return createManagedDb(target, h);

  const { PGlite } = await import("@electric-sql/pglite");
  const { drizzle } = await import("drizzle-orm/pglite");
  if (target.dataDir !== ":memory:") {
    // PGlite creates its own directory but not the folder above it.
    const { mkdir } = await import("node:fs/promises");
    await mkdir(target.dataDir, { recursive: true });
  }
  const client = target.dataDir === ":memory:" ? new PGlite() : new PGlite(target.dataDir);
  h.close = async () => {
    await client.close();
  };
  const db = drizzle(client, { schema }) as unknown as Db;
  try {
    await runMigrations(db);
  } catch (err) {
    h.close = undefined;
    await client.close().catch(() => undefined);
    throw err;
  }
  return db;
}

export { schema };
