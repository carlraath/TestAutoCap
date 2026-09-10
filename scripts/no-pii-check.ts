/**
 * No-PII verification against the live database schema and, optionally, export files.
 *
 *   npm run verify:no-pii                 checks the schema
 *   npm run verify:no-pii -- exports/*.csv exports/*.json   also scans files
 *
 * Exits 1 if anything personal-looking is found.
 */
import { loadEnvConfig } from "@next/env";
import fs from "node:fs";
import { listColumns } from "@/db/migrate";
import { findPiiIdentifiers, findPiiInText } from "@/lib/pii-check";
import { runDbScript } from "./lib/db-script";

loadEnvConfig(process.cwd());

void runDbScript(async (db) => {
  const cols = await listColumns(db);
  const offenders = findPiiIdentifiers(cols);
  console.log(`Schema: ${cols.length} columns inspected.`);
  for (const c of cols) console.log(`  ${c}`);
  let failed = false;
  if (offenders.length) {
    failed = true;
    console.error(`FAIL personal-data-looking columns: ${offenders.join(", ")}`);
  } else {
    console.log("PASS no personal-data columns in the schema.");
  }

  const files = process.argv.slice(2);
  for (const f of files) {
    const text = fs.readFileSync(f, "utf8");
    const headerLine = text.split(/\r?\n/)[0] ?? "";
    const headers = f.endsWith(".csv") ? headerLine.split(",").map((h) => h.replace(/^"|"$/g, "")) : [];
    const badHeaders = findPiiIdentifiers(headers);
    const badText = findPiiInText(text);
    if (badHeaders.length || badText.length) {
      failed = true;
      console.error(`FAIL ${f}: ${[...badHeaders, ...badText].join("; ")}`);
    } else {
      console.log(`PASS ${f}: ${headers.length ? `${headers.length} columns, ` : ""}${text.length} bytes, nothing personal found.`);
    }
  }
  return failed ? 1 : 0;
});
