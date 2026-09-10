/**
 * Shared shell for the one-off database commands (migrate, seed, load-bank, no-PII, sample data).
 *
 * It does four things every one of them needs:
 * - says which database it is about to touch, before it touches it;
 * - refuses to quietly create a throwaway database on this machine when DATABASE_URL looks mistyped;
 * - turns a connection failure into a sentence with something to do about it;
 * - closes the connection pool, so the command returns to the prompt instead of appearing to hang.
 */
import { closeDb, databaseTarget, getDb, type Db } from "@/db/client";
import { DatabaseConfigError, lookalikeEnvNames, type DatabaseTarget } from "@/db/config";
import { formatDatabaseFailure } from "@/db/errors";

/** A mistake in how the command was run, already written for a non-technical reader. */
export class ScriptError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ScriptError";
  }
}

function checkNotAnAccident(target: DatabaseTarget): void {
  if (target.kind !== "embedded") return;
  const lookalikes = lookalikeEnvNames();
  if (lookalikes.length === 0) return;
  throw new ScriptError(
    [
      `DATABASE_URL is not set, but ${lookalikes.join(" and ")} ${lookalikes.length === 1 ? "is" : "are"}.`,
      "",
      `That looks like the variable name was mistyped. Left alone, this command would create a new, empty database in ${target.dataDir} on this machine and report success, while your hosted database stayed untouched.`,
      "",
      `Set the connection string as DATABASE_URL and run the command again. If you really do mean the database on this machine, clear ${lookalikes.join(" and ")} first.`,
    ].join("\n"),
  );
}

/**
 * Runs a database command end to end: announce, open, do the work, close, exit.
 * `work` returns the process exit code, or nothing for success.
 */
export async function runDbScript(
  work: (db: Db, target: DatabaseTarget) => Promise<number | void>,
  options: { before?: () => void } = {},
): Promise<void> {
  let target: DatabaseTarget | null = null;
  let code = 0;
  try {
    options.before?.();
    target = databaseTarget();
    checkNotAnAccident(target);
    console.log(`Using ${target.description}.`);
    const db = await getDb();
    code = (await work(db, target)) ?? 0;
  } catch (err) {
    if (err instanceof ScriptError || err instanceof DatabaseConfigError) {
      console.error(`\n${err.message}\n`);
    } else {
      console.error(formatDatabaseFailure(err, target));
      if (process.env.DEBUG_DB) console.error(err);
    }
    code = 1;
  }
  await closeDb().catch(() => undefined);
  // Closing the pool is what lets the process end on its own. This is the belt and braces:
  // if anything else is still holding the event loop open, do not leave the operator staring
  // at a cursor that never comes back.
  setTimeout(() => process.exit(code), 250).unref();
  process.exitCode = code;
}
