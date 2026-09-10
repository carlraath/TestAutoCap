/**
 * Works out which database we are about to use, and says so in plain English.
 *
 * Two targets:
 * - managed: DATABASE_URL is set to a PostgreSQL connection string (Neon, Supabase, Railway, Render, ...).
 * - embedded: DATABASE_URL is empty or unset, so PGlite persists to DATA_DIR.
 *
 * Everything here is pure, so it can be unit tested without a database.
 */
import path from "node:path";

/** A configuration mistake the operator can fix. Its message is written for a non-technical reader. */
export class DatabaseConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DatabaseConfigError";
  }
}

/** Just enough of process.env to read the settings we care about. */
export type EnvLike = Record<string, string | undefined>;

/** false: no TLS. Object: TLS, verifying the certificate or not. undefined: leave it to the connection string. */
export type SslSetting = false | { rejectUnauthorized: boolean } | undefined;

export interface ManagedTarget {
  kind: "managed";
  /** The connection string handed to node-postgres, with the ssl query parameters removed. */
  connectionString: string;
  ssl: SslSetting;
  host: string;
  port: number;
  database: string;
  user: string;
  /** One line, safe to print. Never contains the password. */
  description: string;
}

export interface EmbeddedTarget {
  kind: "embedded";
  dataDir: string;
  description: string;
}

export type DatabaseTarget = ManagedTarget | EmbeddedTarget;

const SSL_QUERY_KEYS = ["sslmode", "ssl", "uselibpqcompat"];
const CERT_QUERY_KEYS = ["sslcert", "sslkey", "sslrootcert"];

/** Environment variable names that people reach for when they mean DATABASE_URL. */
const LOOKALIKE_NAMES = [
  "DATABASEURL",
  "DATABASE_URI",
  "DATABASE_URL_",
  "DB_URL",
  "DBURL",
  "POSTGRES_URL",
  "POSTGRESQL_URL",
  "PGURL",
  "NEON_DATABASE_URL",
  "NEON_URL",
];

/**
 * Cleans up a pasted connection string: whitespace, wrapping quotes, and the `psql ` prefix
 * that database consoles put in front of their copy-and-paste snippet.
 */
export function normaliseConnectionString(raw: string): string {
  let value = raw.trim();
  if (/^psql\s+/i.test(value)) value = value.replace(/^psql\s+/i, "").trim();
  while (value.length >= 2 && ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))) {
    value = value.slice(1, -1).trim();
  }
  return value;
}

/** Removes the password from anything we are about to print. */
export function redactConnectionString(value: string): string {
  return value.replace(/(:\/\/[^:/?#@]*):[^@/?#]*@/, "$1:***@");
}

function splitQuery(connectionString: string): { base: string; params: URLSearchParams } {
  const at = connectionString.indexOf("?");
  if (at === -1) return { base: connectionString, params: new URLSearchParams() };
  return { base: connectionString.slice(0, at), params: new URLSearchParams(connectionString.slice(at + 1)) };
}

function joinQuery(base: string, params: URLSearchParams): string {
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

function sslFromKeyword(keyword: string, source: string): SslSetting {
  switch (keyword.trim().toLowerCase()) {
    case "disable":
    case "off":
    case "false":
    case "0":
      return false;
    case "no-verify":
    case "allow":
      return { rejectUnauthorized: false };
    case "prefer":
    case "require":
    case "verify-ca":
    case "verify-full":
    case "on":
    case "true":
    case "1":
    case "verify":
      return { rejectUnauthorized: true };
    default:
      throw new DatabaseConfigError(
        `${source} is set to "${keyword}", which is not a value I understand. Use require (encrypted, certificate checked), no-verify (encrypted, certificate not checked) or disable (not encrypted).`,
      );
  }
}

/** Hosts we are willing to talk to without TLS, because they cannot leave the machine. */
function isLocalHost(host: string): boolean {
  const h = host.toLowerCase();
  return h === "localhost" || h === "127.0.0.1" || h === "::1" || h === "[::1]" || h.endsWith(".localhost") || h.startsWith("/") || h.startsWith("%2f");
}

interface UrlParts {
  host: string;
  port: number;
  database: string;
  user: string;
}

function readUrlParts(connectionString: string, params: URLSearchParams): UrlParts {
  let url: URL;
  try {
    url = new URL(connectionString);
  } catch {
    throw new DatabaseConfigError(
      `DATABASE_URL is not a connection string I can read: ${redactConnectionString(connectionString)}. Copy it again from your database provider's dashboard, in full and with nothing added.`,
    );
  }
  const scheme = url.protocol.toLowerCase();
  if (scheme !== "postgres:" && scheme !== "postgresql:") {
    throw new DatabaseConfigError(
      `DATABASE_URL must begin with postgresql:// but it begins with ${url.protocol}//. Copy the connection string again from your database provider's dashboard.`,
    );
  }
  // A Unix socket directory can be given as a query parameter instead of a host.
  const host = decodeURIComponent(url.hostname) || (params.get("host") ?? "");
  if (!host) {
    throw new DatabaseConfigError(
      "DATABASE_URL has no database host in it. It should look like postgresql://user:password@host/database?sslmode=require. Copy it again from your database provider's dashboard.",
    );
  }
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  if (!database) {
    throw new DatabaseConfigError(
      `DATABASE_URL names no database. It should end with a database name, for example .../neondb?sslmode=require. What is set is ${redactConnectionString(connectionString)}.`,
    );
  }
  return {
    host,
    port: url.port ? Number(url.port) : 5432,
    database,
    user: decodeURIComponent(url.username) || "(the default user)",
  };
}

function describeSsl(ssl: SslSetting): string {
  if (ssl === undefined) return "TLS as set by the connection string";
  if (ssl === false) return "no TLS";
  return ssl.rejectUnauthorized ? "TLS, certificate checked" : "TLS, certificate not checked";
}

/** Builds the managed target from an already-normalised connection string. */
export function managedTarget(raw: string, sslOverride?: string): ManagedTarget {
  const connectionString = normaliseConnectionString(raw);
  const { base, params } = splitQuery(connectionString);
  const parts = readUrlParts(connectionString, params);

  // A custom certificate authority means files on disk. Leave that entirely to node-postgres.
  if (CERT_QUERY_KEYS.some((k) => params.has(k))) {
    return {
      kind: "managed",
      connectionString,
      ssl: undefined,
      ...parts,
      description: `managed PostgreSQL at ${parts.host}:${parts.port}, database "${parts.database}", user "${parts.user}", TLS as set by the connection string`,
    };
  }

  let ssl: SslSetting;
  if (sslOverride !== undefined && sslOverride.trim() !== "") {
    ssl = sslFromKeyword(sslOverride, "DATABASE_SSL");
  } else {
    const keyword = params.get("sslmode") ?? params.get("ssl");
    ssl = keyword !== null ? sslFromKeyword(keyword, "The sslmode in DATABASE_URL") : isLocalHost(parts.host) ? false : { rejectUnauthorized: true };
  }

  // Strip the ssl parameters. node-postgres then uses the ssl setting we pass it, and its
  // pg-connection-string dependency does not print its "SECURITY WARNING" deprecation notice.
  for (const key of SSL_QUERY_KEYS) params.delete(key);

  return {
    kind: "managed",
    connectionString: joinQuery(base, params),
    ssl,
    ...parts,
    description: `managed PostgreSQL at ${parts.host}:${parts.port}, database "${parts.database}", user "${parts.user}", ${describeSsl(ssl)}`,
  };
}

export function embeddedTarget(dataDir: string): EmbeddedTarget {
  const resolved = dataDir === ":memory:" ? ":memory:" : path.resolve(dataDir);
  return {
    kind: "embedded",
    dataDir: resolved,
    description: resolved === ":memory:" ? "embedded PGlite database, in memory only (nothing is kept)" : `embedded PGlite database in ${resolved} on this machine`,
  };
}

/** Environment variables that look like a mistyped DATABASE_URL. Empty when DATABASE_URL itself is set. */
export function lookalikeEnvNames(env: EnvLike = process.env): string[] {
  if ((env.DATABASE_URL ?? "").trim() !== "") return [];
  return LOOKALIKE_NAMES.filter((name) => (env[name] ?? "").trim() !== "");
}

/** Decides which database the process is about to use. Throws DatabaseConfigError on a mistake worth stopping for. */
export function resolveDatabaseTarget(env: EnvLike = process.env): DatabaseTarget {
  const raw = (env.DATABASE_URL ?? "").trim();
  if (raw !== "") return managedTarget(raw, env.DATABASE_SSL);
  if ((env.VERCEL ?? "") !== "") {
    throw new DatabaseConfigError(
      "DATABASE_URL is not set on this Vercel deployment. Vercel has no disk to keep a database on, so the application cannot start without one. Add DATABASE_URL in the Vercel project settings, for the Production environment, and deploy again.",
    );
  }
  return embeddedTarget((env.DATA_DIR ?? "").trim() || "./data/pglite");
}
