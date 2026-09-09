/**
 * Seeds a demonstration cohort so the administrator reports have something to
 * show. Development and demonstration only: it creates real participants and
 * real attempts.
 *
 *   npx tsx scripts/seed-sample-data.ts [--participants=15] [--seed=7] [--force]
 *
 * Refuses to run when NODE_ENV is production unless --force is given. The
 * generated passwords are printed once and are never stored in plain text.
 */
import { loadEnvConfig } from "@next/env";
import { eq } from "drizzle-orm";
import { getDb, type Db } from "@/db/client";
import { users } from "@/db/schema";
import type { AuditActor } from "@/lib/audit";
import { bootstrapAdmin } from "@/lib/auth";
import { getBankVersion } from "@/lib/bank-loader";
import { generateSampleCohort } from "@/lib/sample-data";

loadEnvConfig(process.cwd());

function numberArg(name: string, fallback: number): number {
  const raw = process.argv.find((arg) => arg.startsWith(`--${name}=`))?.split("=")[1];
  if (raw === undefined) return fallback;
  const value = Number(raw);
  if (!Number.isInteger(value)) throw new Error(`--${name} must be a whole number.`);
  return value;
}

async function adminActor(db: Db): Promise<AuditActor> {
  const username = process.env.ADMIN_USERNAME?.trim() ?? "";
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (username && password) await bootstrapAdmin(db, username, password);
  const admin = await db.query.users.findFirst({ where: eq(users.role, "admin") });
  if (!admin) throw new Error("No administrator exists. Run scripts/seed.ts first.");
  return { userId: admin.id, username: admin.username, role: "admin" };
}

async function main(): Promise<void> {
  const force = process.argv.includes("--force");
  if (process.env.NODE_ENV === "production" && !force) {
    throw new Error("Refusing to seed sample data with NODE_ENV=production. Pass --force if this really is a demonstration environment.");
  }
  const participants = numberArg("participants", 15);
  const seed = numberArg("seed", 7);

  const db = await getDb();
  if ((await getBankVersion(db)) === null) {
    throw new Error("No question bank is frozen. Run scripts/load-bank.ts <bank file> --freeze first.");
  }
  const admin = await adminActor(db);
  const cohort = await generateSampleCohort(db, admin, { participants, seed });

  console.log(`Created ${cohort.participants.length} sample participants with seed ${cohort.seed}.`);
  console.log("Passwords are shown once. This is sample data, not the Allocation Register.\n");
  console.log(["code", "password", "shape"].join("\t"));
  for (const participant of cohort.participants) {
    console.log([participant.code, participant.password, participant.role].join("\t"));
  }
  console.log("\nNotes:");
  for (const participant of cohort.participants) {
    for (const note of participant.notes) console.log(`  ${participant.code}: ${note}`);
  }
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
