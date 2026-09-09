import { loadEnvConfig } from "@next/env";
import { getDb } from "@/db/client";

loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  await getDb();
  console.log("Database ready. Migrations applied (see schema_migrations).");
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
