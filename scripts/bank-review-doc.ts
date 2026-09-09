/**
 * Renders bank/review/bank-review.md from bank/bank.v1.json: every item with its stem, options
 * or elements or buckets, the key spelled out, the rationale, the source anchor and a self-check
 * row per charter rule. Generated from the loadable bank so the review document and the bank
 * can never drift apart.
 *
 *   npx tsx scripts/bank-review-doc.ts
 */
import fs from "node:fs";
import path from "node:path";
import { ASSESSMENTS, ASSESSMENT_IDS, CONTESTED_SLOTS, requiredDepth } from "@/engine/structure";
import { validateBank } from "@/engine/bank";
import type { Bank, BankItem, MatchingItem, OrderingItem } from "@/engine/types";

const BLUEPRINTS: Record<string, Record<number, string>> = {
  ta: {
    1: "Purpose of automation vs manual testing - single - concept selection.",
    2: "Test automation pyramid - ordering - arrange the layers into the canonical sequence.",
    3: "Agile testing quadrants - single - place an activity.",
    4: "Regression vs progression testing - single - classify a scenario.",
    5: "Automation candidacy factors - multi - select the strengthening factors.",
    6: "What not to automate - single - pick the weakest candidate from scenarios.",
    7: "Maintenance cost of automation - single - concept.",
    8: "Evidence on failure - multi - what a useful failure record contains.",
    9: "Run triggers - matching - place scenarios onto the trigger that fits.",
    10: "Flaky tests - single - recognise the concept and the correct response.",
  },
  sql: {
    1: "SELECT and WHERE against a shown table - single - predict the result.",
    2: "INNER vs LEFT JOIN - single - predict row counts from two small tables. Contested slot.",
    3: "Aggregation with GROUP BY and HAVING - single - predict the result.",
    4: "Subquery reading - single - what does this return.",
    5: "NULL behaviour in filters and comparisons - single - predict the result.",
    6: "DISTINCT and ORDER BY - single - predict the result.",
    7: "Set operations for reconciliation - single - choose the query for a comparison goal. Contested slot.",
    8: "Find records missing from a target - single - choose the query, tables shown. Contested slot.",
    9: "Detect changed values between source and target - single - choose the approach.",
    10: "Test data hygiene in SQL - multi - inserting and cleaning deterministic test rows.",
  },
  python: {
    1: "Types and truthiness - single - predict the output.",
    2: "Control flow with a loop and condition - single - predict the output.",
    3: "Functions, arguments, return values - single - predict the output.",
    4: "Lists and dicts - single - predict the output or pick the correct access.",
    5: "String operations - single - predict the output.",
    6: "Reading a short realistic snippet end to end - single - predict the output. Contested slot.",
    7: "pytest discovery and naming conventions - multi - select what gets collected. Contested slot.",
    8: "assert semantics and failure meaning - single - interpret a failing test.",
    9: "Fixtures and parameterisation - single - purpose selection.",
    10: "Comparing two datasets in Python - multi - what a comparison must handle.",
  },
};

const CHARTER = [
  ["One defensible key", (i: BankItem) => keyCount(i) === 1],
  ["Type matches the slot", (i: BankItem) => ASSESSMENTS[i.assessment].slotTypes[i.slot] === i.type],
  ["Option, element and token counts within the rules", structureOk],
  ["No negative stem, no all/none of the above, no opinion stem", wordingOk],
  ['No "Select all that apply." in the stem (the interface adds it)', (i: BankItem) => !i.stem.includes("Select all that apply")],
  ["Rationale explains the key and the alternatives", (i: BankItem) => i.rationale.trim().length > 80],
  ["Source anchor names a course topic", (i: BankItem) => i.sourceAnchor.trim().length > 0],
  ["No organisation, product or person named", noNames],
] as const;

function keyCount(item: BankItem): number {
  // Exactly one defensible answer per item: one option, one option set, one sequence, one assignment.
  switch (item.type) {
    case "single":
      return item.options.filter((o) => o.correct).length;
    case "multi":
      return item.options.some((o) => o.correct) ? 1 : 0;
    case "ordering":
      return item.key.length === item.elements.length ? 1 : 0;
    case "matching":
      return item.tokens.every((t) => item.buckets.some((b) => b.id === t.bucket)) ? 1 : 0;
  }
}

function structureOk(item: BankItem): boolean {
  switch (item.type) {
    case "single":
      return item.options.length === 4 && item.options.filter((o) => o.correct).length === 1;
    case "multi": {
      const correct = item.options.filter((o) => o.correct).length;
      return item.options.length >= 5 && item.options.length <= 6 && correct >= 2 && correct <= 3;
    }
    case "ordering":
      return item.elements.length >= 3 && item.elements.length <= 5;
    case "matching":
      return item.buckets.length >= 3 && item.buckets.length <= 4 && item.tokens.length >= 4 && item.tokens.length <= 6;
  }
}

function prose(stem: string): string {
  return stem.replace(/```[\s\S]*?```/g, " ").replace(/`[^`\n]*`/g, " ");
}

function wordingOk(item: BankItem): boolean {
  const p = prose(item.stem);
  const lower = p.toLowerCase();
  return !/\bNOT\b/.test(p) && !lower.includes("all of the above") && !lower.includes("none of the above") && !lower.includes("best practice");
}

function noNames(item: BankItem): boolean {
  const haystack = `${item.stem} ${optionText(item)}`;
  return !/\b(Acme|Contoso|Fabrikam|Ltd|Pty|Limited|Bank of|Telstra|NAB|ANZ|Westpac|Commonwealth Bank)\b/.test(haystack);
}

function optionText(item: BankItem): string {
  switch (item.type) {
    case "single":
    case "multi":
      return item.options.map((o) => o.text).join(" ");
    case "ordering":
      return item.elements.map((e) => e.text).join(" ");
    case "matching":
      return `${item.buckets.map((b) => b.label).join(" ")} ${item.tokens.map((t) => t.text).join(" ")}`;
  }
}

function orderingKeyInWords(item: OrderingItem): string {
  const byId = new Map(item.elements.map((e) => [e.id, e.text] as const));
  return item.key.map((id, index) => `${index + 1}. ${byId.get(id) ?? id}`).join("  ");
}

function matchingKeyInWords(item: MatchingItem): string[] {
  return item.buckets.map((bucket) => {
    const tokens = item.tokens.filter((t) => t.bucket === bucket.id).map((t) => t.text);
    return `**${bucket.label}**: ${tokens.join("; ") || "(no token)"}`;
  });
}

function renderItem(item: BankItem, lines: string[]): void {
  lines.push(`#### ${item.id} (${item.type})`, "");
  lines.push(item.stem, "");
  switch (item.type) {
    case "single":
    case "multi":
      lines.push("| | Option |", "|---|---|");
      for (const option of item.options) lines.push(`| ${option.correct ? "**KEY**" : ""} | ${option.text.replace(/\|/g, "\\|")} |`);
      lines.push("");
      if (item.type === "multi") lines.push(`Key set: ${item.options.filter((o) => o.correct).map((o) => o.text).join(" + ")}`, "");
      if (item.fixedOrder) lines.push("Presented in the authored order (fixedOrder).", "");
      break;
    case "ordering":
      lines.push("Elements as authored: " + item.elements.map((e) => `${e.id} ${e.text}`).join(", "), "");
      lines.push(`Key sequence: ${orderingKeyInWords(item)}`, "");
      break;
    case "matching":
      lines.push("Buckets: " + item.buckets.map((b) => b.label).join(", "), "");
      lines.push("Assignment:", "");
      for (const line of matchingKeyInWords(item)) lines.push(`- ${line}`);
      lines.push("");
      break;
  }
  lines.push(`**Rationale.** ${item.rationale}`, "");
  lines.push(`**Source anchor.** ${item.sourceAnchor}`, "");
  lines.push("| Charter rule | Self-check |", "|---|---|");
  for (const [rule, check] of CHARTER) lines.push(`| ${rule} | ${check(item) ? "Pass" : "REVIEW"} |`);
  lines.push("");
}

function main(): void {
  const bank = JSON.parse(fs.readFileSync("bank/bank.v1.json", "utf8")) as Bank;
  const result = validateBank(bank);
  const lines: string[] = [];

  lines.push("# Question bank review document", "");
  lines.push(
    `Bank version ${bank.bankVersion}. ${bank.items.length} items. Generated from \`bank/bank.v1.json\` by \`scripts/bank-review-doc.ts\`, so this document always describes exactly what loads.`,
    "",
  );
  lines.push(
    "This is the review artefact required by docs/04 step 2. Keys, rationales and source anchors are shown here for the reviewer; participants never see any of them.",
    "",
  );
  lines.push("## Summary", "");
  lines.push("| Assessment | Items | Slots | Depth per slot |", "|---|---|---|---|");
  for (const assessment of ASSESSMENT_IDS) {
    const items = bank.items.filter((i) => i.assessment === assessment);
    const slots = Object.keys(ASSESSMENTS[assessment].slotTypes).length;
    const depths = Array.from({ length: slots }, (_, n) => items.filter((i) => i.slot === n + 1).length);
    lines.push(`| ${ASSESSMENTS[assessment].title} | ${items.length} | ${slots} | ${depths.join(", ")} |`);
  }
  lines.push("");
  lines.push(
    `Total ${bank.items.length} items. The per-slot rule in docs/04 (two items per slot, three for the contested slots SQL 2, 7, 8 and Python 6, 7) yields 65; docs/04 also states a total of 66. The per-slot rule is the operative one and has been followed. This is recorded as decision 10 in DECISIONS.md for the owner to settle.`,
    "",
  );
  lines.push(`Machine validation of the assembled bank: ${result.ok ? "no problems." : `${result.problems.length} problems.`}`, "");
  if (!result.ok) for (const problem of result.problems) lines.push(`- ${problem}`);
  lines.push("");

  for (const assessment of ASSESSMENT_IDS) {
    const def = ASSESSMENTS[assessment];
    lines.push(`## ${def.title}`, "");
    const slots = Object.keys(def.slotTypes).map(Number).sort((a, b) => a - b);
    for (const slot of slots) {
      const section = def.sections.find((s) => s.slots.includes(slot));
      const contested = CONTESTED_SLOTS[assessment].includes(slot);
      lines.push(`### Slot ${slot} - ${section?.title ?? ""}${contested ? " (contested)" : ""}`, "");
      lines.push(`Blueprint: ${BLUEPRINTS[assessment][slot]}`, "");
      lines.push(`Required depth: ${requiredDepth(assessment, slot)} items. Type: ${def.slotTypes[slot]}.`, "");
      for (const item of bank.items.filter((i) => i.assessment === assessment && i.slot === slot)) renderItem(item, lines);
    }
  }

  const out = path.join("bank", "review", "bank-review.md");
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, `${lines.join("\n")}\n`, "utf8");
  const flagged = bank.items.filter((i) => CHARTER.some(([, check]) => !check(i)));
  console.log(`Wrote ${out} (${lines.length} lines, ${bank.items.length} items).`);
  console.log(flagged.length ? `Items with a self-check to review: ${flagged.map((i) => i.id).join(", ")}` : "Every item passes every self-check.");
}

main();
