/**
 * Seeds the administrator account from ADMIN_USERNAME and ADMIN_PASSWORD.
 * Idempotent: a second run reports the existing admin and changes nothing.
 *
 *   npx tsx scripts/seed.ts
 */
import { loadEnvConfig } from "@next/env";
import { getDb } from "@/db/client";
import { bootstrapAdmin } from "@/lib/auth";

loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  const username = process.env.ADMIN_USERNAME?.trim() ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (!username || !password) {
    throw new Error("ADMIN_USERNAME and ADMIN_PASSWORD must both be set in the environment (see .env.example).");
  }
  const db = await getDb();
  const result = await bootstrapAdmin(db, username, password);
  if (result.created) {
    console.log(`Created administrator "${result.username}" and recorded admin.bootstrap in the audit log.`);
  } else {
    console.log(`Administrator "${result.username}" already exists. Nothing changed.`);
  }
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
