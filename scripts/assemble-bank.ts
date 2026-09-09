/**
 * Assembles bank/bank.v1.json from the per-item drafts under bank/drafts/<assessment>/,
 * ordered by assessment (ta, sql, python), then slot, then letter, and validates the result.
 *
 *   npx tsx scripts/assemble-bank.ts [--version N] [--out PATH]
 *
 * Use --out to assemble and validate to a scratch path without touching the live bank, which
 * matters while a server is serving from it.
 *
 * Writing one file per item keeps authoring and review reviewable per item; this script is the
 * only thing that produces the loadable bank, so the two never drift.
 */
import fs from "node:fs";
import path from "node:path";
import { validateBank } from "@/engine/bank";
import { ASSESSMENT_IDS } from "@/engine/structure";
import type { Bank, BankItem } from "@/engine/types";

const versionArg = process.argv.indexOf("--version");
const bankVersion = versionArg > -1 ? Number(process.argv[versionArg + 1]) : 1;

function letterOf(id: string): string {
  return id.slice(id.lastIndexOf("-") + 1);
}

function main(): void {
  const items: BankItem[] = [];
  for (const assessment of ASSESSMENT_IDS) {
    const dir = path.join("bank", "drafts", assessment);
    if (!fs.existsSync(dir)) {
      console.error(`Missing draft directory ${dir}`);
      process.exit(1);
    }
    const files = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith(".json"))
      .sort();
    const parsed = files.map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as BankItem);
    parsed.sort((a, b) => a.slot - b.slot || letterOf(a.id).localeCompare(letterOf(b.id)));
    items.push(...parsed);
  }

  const bank: Bank = { bankVersion, items };
  const result = validateBank(bank);
  const outArg = process.argv.indexOf("--out");
  const out = outArg > -1 ? process.argv[outArg + 1] : path.join("bank", `bank.v${bankVersion}.json`);
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  fs.writeFileSync(out, `${JSON.stringify(bank, null, 2)}\n`, "utf8");

  const perAssessment = ASSESSMENT_IDS.map((a) => `${a}: ${items.filter((i) => i.assessment === a).length}`).join(", ");
  console.log(`Wrote ${out} with ${items.length} items (${perAssessment}).`);
  if (!result.ok) {
    console.error(`\n${result.problems.length} validation problems:`);
    for (const problem of result.problems) console.error(`  ${problem}`);
    process.exit(1);
  }
  console.log("Validation: no problems.");
}

main();
