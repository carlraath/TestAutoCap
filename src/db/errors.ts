/**
 * Turns a database failure into a sentence an operator can act on, without hiding the original error.
 *
 * drizzle-orm wraps failures in DrizzleQueryError and puts the real error on `cause`, so the first
 * job is to dig the real error out. Everything here is pure and unit tested.
 */
import { DatabaseConfigError, type DatabaseTarget } from "./config";

export interface DatabaseFailure {
  /** What went wrong, in one sentence. */
  problem: string;
  /** What to do about it. */
  action: string;
  /** The original error message, kept so nothing is lost. */
  detail: string;
}

interface ErrorLike {
  message?: unknown;
  code?: unknown;
  cause?: unknown;
  errors?: unknown;
  hostname?: unknown;
  severity?: unknown;
}

/** Digs past DrizzleQueryError wrappers and AggregateErrors to the error that actually happened. */
export function rootCause(err: unknown): unknown {
  let current = err;
  for (let hop = 0; hop < 10; hop += 1) {
    const e = current as ErrorLike | null;
    if (!e || typeof e !== "object") return current;
    if (Array.isArray(e.errors) && e.errors.length > 0) {
      current = e.errors[0];
      continue;
    }
    if (e.cause !== undefined && e.cause !== null) {
      current = e.cause;
      continue;
    }
    return current;
  }
  return current;
}

function text(value: unknown): string {
  if (typeof value === "string") return value;
  if (value instanceof Error) return value.message;
  return String(value);
}

/** Describes a database failure in terms of the database we were trying to use. */
export function explainDatabaseError(err: unknown, target: DatabaseTarget | null): DatabaseFailure {
  if (err instanceof DatabaseConfigError) {
    return { problem: err.message, action: "Fix the setting and run the command again.", detail: err.message };
  }

  const cause = rootCause(err) as ErrorLike;
  const code = typeof cause?.code === "string" ? cause.code : "";
  const message = text(cause instanceof Error ? cause.message : (cause?.message ?? cause));
  const detail = message;
  const where = target?.kind === "managed" ? `${target.host}:${target.port}` : "the database";
  const managed = target?.kind === "managed" ? target : null;

  switch (code) {
    case "ENOTFOUND":
    case "EAI_AGAIN":
      return {
        problem: `The database host ${managed ? `"${managed.host}"` : "named in DATABASE_URL"} could not be found on the internet.`,
        action:
          "There is almost certainly a typo in DATABASE_URL, or it was not pasted in full. Copy the connection string again from your database provider's dashboard and set it again, then run the command again. If the host name is right, check this machine's internet connection.",
        detail,
      };
    case "ECONNREFUSED":
      return {
        problem: `Nothing accepted a database connection at ${where}.`,
        action: "Check the host and the port in DATABASE_URL, and that the database is running and not paused by the provider.",
        detail,
      };
    case "ETIMEDOUT":
    case "ECONNRESET":
      return {
        problem: `The connection to ${where} timed out or was cut off.`,
        action: "Check the host and port in DATABASE_URL, this machine's internet connection, and whether a firewall or VPN is blocking outgoing connections on that port.",
        detail,
      };
    case "28P01": {
      const channelBinding = managed && /channel_binding=require/i.test(managed.connectionString);
      return {
        problem: `The database at ${where} refused the user name or password in DATABASE_URL.`,
        action:
          "The password is part of the connection string. Copy the whole connection string again from your database provider's dashboard (Neon shows it in full only when you reveal it), set DATABASE_URL again and run the command again." +
          (channelBinding
            ? " If it still refuses with the same message, remove &channel_binding=require from the end of the connection string and try once more: that setting is for the psql command-line tool, and this application does not use it."
            : ""),
        detail,
      };
    }
    case "28000":
      if (/insecure|ssl|tls/i.test(message)) {
        return {
          problem: `The database at ${where} requires an encrypted connection and this one was not encrypted.`,
          action: "Add ?sslmode=require to the end of DATABASE_URL, or set DATABASE_SSL=require, then run the command again.",
          detail,
        };
      }
      return {
        problem: `The database at ${where} refused the connection for user "${managed?.user ?? "the configured user"}".`,
        action: "Check the user name in DATABASE_URL and that the database allows connections from this machine.",
        detail,
      };
    case "3D000":
      return {
        problem: `The database "${managed?.database ?? ""}" does not exist on ${where}.`,
        action: "Check the database name at the end of DATABASE_URL, before any ? mark. On Neon the default is neondb.",
        detail,
      };
    case "42501":
      return {
        problem: "The database user is not allowed to create tables.",
        action: "Use the owner connection string from your provider's dashboard rather than a read-only one.",
        detail,
      };
    case "53300":
      return {
        problem: "The database refused the connection because it already has too many.",
        action: "Use the pooled connection string from your provider's dashboard, wait a minute and run the command again.",
        detail,
      };
    case "SELF_SIGNED_CERT_IN_CHAIN":
    case "DEPTH_ZERO_SELF_SIGNED_CERT":
    case "UNABLE_TO_VERIFY_LEAF_SIGNATURE":
    case "ERR_TLS_CERT_ALTNAME_INVALID":
      return {
        problem: `The encryption certificate presented by ${where} could not be checked.`,
        action:
          "Neon, Supabase, Railway and Render all present certificates that check out, so first make sure the host in DATABASE_URL is right. If your provider uses its own certificate authority, set DATABASE_SSL=no-verify to keep the connection encrypted without checking the certificate.",
        detail,
      };
    default:
      break;
  }

  if (/self.signed|certificate/i.test(message)) {
    return {
      problem: `The encryption certificate presented by ${where} could not be checked.`,
      action:
        "First make sure the host in DATABASE_URL is right. If your provider uses its own certificate authority, set DATABASE_SSL=no-verify to keep the connection encrypted without checking the certificate.",
      detail,
    };
  }
  if (/does not support SSL/i.test(message)) {
    return {
      problem: `The database at ${where} does not offer encrypted connections, but an encrypted one was asked for.`,
      action: "If this database is on your own machine or private network, set DATABASE_SSL=disable and run the command again.",
      detail,
    };
  }
  if (/timeout expired|connection terminated/i.test(message)) {
    return {
      problem: `The connection to ${where} did not complete in time.`,
      action: "Check the host and port in DATABASE_URL, and that the database is running and reachable from this machine.",
      detail,
    };
  }
  if (target?.kind === "embedded" && /EACCES|EPERM|ENOENT|read-only/i.test(message)) {
    return {
      problem: `The embedded database directory ${target.dataDir} could not be written to.`,
      action: "Create the folder above it, or set DATA_DIR to a folder you can write to, then run the command again.",
      detail,
    };
  }

  return {
    problem: "The database command did not finish.",
    action: "The message below is from the database driver. If it means nothing to you, run the command again with DEBUG_DB=1 set to see the full technical detail.",
    detail,
  };
}

/** The block of text a script prints when it cannot use the database. */
export function formatDatabaseFailure(err: unknown, target: DatabaseTarget | null): string {
  const failure = explainDatabaseError(err, target);
  const lines = [
    "",
    "Could not use the database.",
    "",
    `  Target:  ${target ? target.description : "not decided yet"}`,
    `  Problem: ${failure.problem}`,
    `  Do this: ${failure.action}`,
    "",
    `  Technical detail: ${failure.detail}`,
    "",
  ];
  return lines.join("\n");
}
