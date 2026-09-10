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
import { looksLikeBank } from "@/engine/bank";
import type { Bank } from "@/engine/types";
import { loadBank } from "@/lib/bank-loader";
import { runDbScript, ScriptError } from "./lib/db-script";

loadEnvConfig(process.cwd());

function defaultPath(): string {
  const frozen = path.resolve(process.cwd(), "bank/bank.v1.json");
  return fs.existsSync(frozen) ? frozen : path.resolve(process.cwd(), "bank/dev-sample.json");
}

const args = process.argv.slice(2);
const freeze = args.includes("--freeze");
const file = args.find((arg) => !arg.startsWith("--"));
const target = file ? path.resolve(process.cwd(), file) : defaultPath();

let cached: Bank | undefined;

function readBankFile(): Bank {
  if (cached !== undefined) return cached;
  if (!fs.existsSync(target)) {
    throw new ScriptError(`There is no question bank file at ${target}. Check the file name you typed after the command.`);
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(target, "utf8"));
  } catch (err) {
    throw new ScriptError(`${target} is not readable as JSON: ${err instanceof Error ? err.message : String(err)}`);
  }
  if (!looksLikeBank(parsed)) {
    throw new ScriptError(`${target} is not a bank file: expected an object with an items array.`);
  }
  cached = parsed;
  return parsed;
}

void runDbScript(
  async (db) => {
    const parsed = readBankFile();
    const result = await loadBank(db, parsed, { freeze });
    console.log(`Loaded ${target}: ${result.inserted} inserted, ${result.updated} updated, bank version ${result.bankVersion}.`);
    console.log(
      freeze
        ? `Bank version ${result.bankVersion} frozen (settings bank_version, bank_frozen_at).`
        : "Not frozen. Pass --freeze to record the bank version for attempts.",
    );
  },
  { before: () => void readBankFile() },
);
