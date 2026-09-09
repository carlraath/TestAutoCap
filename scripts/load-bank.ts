/**
 * Loads a bank JSON file into the configured database, optionally freezing its version.
 *
 *   npx tsx scripts/load-bank.ts [path] [--freeze]
 *
 * Default path: bank/bank.v1.json when it exists, otherwise bank/dev-sample.json.
 */
import { loadEnvConfig } from "@next/env";
import fs from "node:fs";
import path from "node:path";
import { getDb } from "@/db/client";
import { looksLikeBank } from "@/engine/bank";
import { loadBank } from "@/lib/bank-loader";

loadEnvConfig(process.cwd());

function defaultPath(): string {
  const frozen = path.resolve(process.cwd(), "bank/bank.v1.json");
  return fs.existsSync(frozen) ? frozen : path.resolve(process.cwd(), "bank/dev-sample.json");
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const freeze = args.includes("--freeze");
  const file = args.find((arg) => !arg.startsWith("--"));
  const target = file ? path.resolve(process.cwd(), file) : defaultPath();
  const parsed: unknown = JSON.parse(fs.readFileSync(target, "utf8"));
  if (!looksLikeBank(parsed)) {
    throw new Error(`${target} is not a bank file: expected an object with an items array.`);
  }
  const db = await getDb();
  const result = await loadBank(db, parsed, { freeze });
  console.log(`Loaded ${target}: ${result.inserted} inserted, ${result.updated} updated, bank version ${result.bankVersion}.`);
  console.log(freeze ? `Bank version ${result.bankVersion} frozen (settings bank_version, bank_frozen_at).` : "Not frozen. Pass --freeze to record the bank version for attempts.");
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
