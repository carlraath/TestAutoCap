/**
 * Validates a bank JSON file against the docs/04 rules. Exits 1 on any problem.
 *
 *   npx tsx scripts/validate-bank.ts <path> [--no-depth]
 */
import fs from "node:fs";
import path from "node:path";
import { looksLikeBank, validateBank } from "@/engine/bank";

function main(): void {
  const args = process.argv.slice(2);
  const requireDepth = !args.includes("--no-depth");
  const file = args.find((arg) => !arg.startsWith("--"));
  if (!file) {
    console.error("Usage: npx tsx scripts/validate-bank.ts <path> [--no-depth]");
    process.exit(1);
  }
  const target = path.resolve(process.cwd(), file);
  let parsed: unknown;
  try {
    parsed = JSON.parse(fs.readFileSync(target, "utf8"));
  } catch (err: unknown) {
    console.error(`Could not read ${target}: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
  if (!looksLikeBank(parsed)) {
    console.error(`${target} is not a bank file: expected an object with an items array.`);
    process.exit(1);
  }
  const result = validateBank(parsed, { requireDepth });
  if (result.ok) {
    console.log(`OK: ${parsed.items.length} items, bank version ${parsed.bankVersion}, no problems.`);
    process.exit(0);
  }
  console.error(`FAIL: ${result.problems.length} problem(s) in ${target}`);
  for (const problem of result.problems) console.error(`  ${problem}`);
  process.exit(1);
}

main();
