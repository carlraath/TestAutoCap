/**
 * Writes the development sample bank to bank/dev-sample.json (or the path given).
 *
 *   npx tsx scripts/make-dev-bank.ts [path]
 */
import fs from "node:fs";
import path from "node:path";
import { validateBank } from "@/engine/bank";
import { makeDevBank } from "@/engine/dev-bank";

function main(): void {
  const target = path.resolve(process.cwd(), process.argv[2] ?? "bank/dev-sample.json");
  const bank = makeDevBank();
  const validation = validateBank(bank);
  if (!validation.ok) {
    console.error("The generated development bank failed validation:");
    for (const problem of validation.problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, `${JSON.stringify(bank, null, 2)}\n`, "utf8");
  console.log(`Wrote ${bank.items.length} items (bank version ${bank.bankVersion}) to ${target}`);
}

main();
