/**
 * Seeds the administrator account from ADMIN_USERNAME and ADMIN_PASSWORD.
 * Idempotent: a second run reports the existing admin and changes nothing.
 *
 *   npx tsx scripts/seed.ts
 */
import { loadEnvConfig } from "@next/env";
import { bootstrapAdmin } from "@/lib/auth";
import { runDbScript, ScriptError } from "./lib/db-script";

loadEnvConfig(process.cwd());

function credentials(): { username: string; password: string } {
  const username = process.env.ADMIN_USERNAME?.trim() ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!username || !password) {
    throw new ScriptError(
      "ADMIN_USERNAME and ADMIN_PASSWORD must both be set before seeding the administrator. Set them the same way you set DATABASE_URL, then run this command again. See .env.example.",
    );
  }
  return { username, password };
}

void runDbScript(
  async (db) => {
    const { username, password } = credentials();
    const result = await bootstrapAdmin(db, username, password);
    if (result.created) {
      console.log(`Created administrator "${result.username}" and recorded admin.bootstrap in the audit log.`);
    } else {
      console.log(`Administrator "${result.username}" already exists. Nothing changed.`);
    }
  },
  { before: () => void credentials() },
);
