import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { findPiiIdentifiers, findPiiInText } from "@/lib/pii-check";
import { loginAsAdmin } from "./helpers";

/**
 * Phase 4: the administrator's reports and operations, against the sample
 * cohort seeded by scripts/seed-sample-data.ts. Run in order: the reset, the
 * retirement and the closure change state that the later tests read.
 *
 *   npm run build
 *   E2E_PORT=3102 E2E_DATA_DIR=./data/e2e-admin npm run e2e:server   (or the equivalent env)
 *   npx tsx scripts/seed-sample-data.ts --participants=15 --seed=7 --force
 *   E2E_BASE_URL=http://127.0.0.1:3102 npx playwright test --project=chromium tests/e2e/admin.spec.ts
 */

test.describe.configure({ mode: "serial" });

const EVIDENCE = "docs/evidence";
const EXPORTS = path.join(EVIDENCE, "exports");
const FILES = ["results.csv", "item-analysis.csv", "audit-log.csv", "archive.json"] as const;
/** The development bank holds exactly two items in TA slot 1, so the second retirement must be refused. */
const FIRST_ITEM = "ta-01-a";
const SIBLING_ITEM = "ta-01-b";
const UUID_ANYWHERE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

async function shot(page: Page, browserName: string, name: string): Promise<void> {
  if (browserName !== "chromium") return;
  await page.screenshot({ path: path.join(EVIDENCE, name), fullPage: true });
}

/** Splits one CSV line, honouring the quoting src/lib/csv.ts writes. */
function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"' && line[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') quoted = false;
      else cell += char;
    } else if (char === '"') quoted = true;
    else if (char === ",") {
      cells.push(cell);
      cell = "";
    } else cell += char;
  }
  cells.push(cell);
  return cells;
}

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

test("the overview shows the seeded cohort", async ({ page, browserName }) => {
  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Overview", level: 1 })).toBeVisible();
  await expect(page.getByTestId("stat-participants")).toHaveText("15");
  await expect(page.getByTestId("stat-exercise")).toHaveText("Open");

  const allThree = Number(await page.getByTestId("stat-all-three").innerText());
  expect(allThree).toBeGreaterThan(0);
  for (const assessment of ["ta", "sql", "python"] as const) {
    const submitted = Number(await page.getByTestId(`submitted-${assessment}`).innerText());
    expect(submitted).toBeGreaterThan(0);
    expect(submitted).toBeLessThanOrEqual(15);
  }
  await expect(page.getByText("Frozen", { exact: false })).toBeVisible();
  await shot(page, browserName, "phase4-overview.png");
});

test("the results table renders and one participant expands to full detail", async ({ page, browserName }) => {
  await page.goto("/admin/results");
  const table = page.getByRole("table", { name: "Results" });
  await expect(table).toBeVisible();
  // 15 participants times three assessments.
  await expect(table.locator("tbody tr")).toHaveCount(45);
  await expect(page.getByRole("table", { name: "Participants with all three assessments submitted" })).toBeVisible();

  const row = table.locator("tbody tr").filter({ hasText: "participant-01" }).first();
  await row.getByRole("link", { name: /Expand/ }).click();
  await page.waitForURL(/\/admin\/results\/[0-9a-f-]{36}/);
  await expect(page.getByRole("heading", { name: "participant-01", level: 1 })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Attempts" })).toBeVisible();
  await expect(page.getByText("Prescribed learning:")).toBeVisible();

  // Open the first question of the first attempt: stem, options, key, rationale and anchor.
  const firstQuestion = page.locator("details").first();
  await firstQuestion.locator("summary").click();
  await expect(firstQuestion.getByText("Rationale.")).toBeVisible();
  await expect(firstQuestion.getByText("Source anchor.")).toBeVisible();
  await shot(page, browserName, "phase4-results-expanded.png");
});

test("cohort statistics show the distribution per section", async ({ page, browserName }) => {
  await page.goto("/admin/statistics");
  await expect(page.getByRole("heading", { name: "Cohort statistics", level: 1 })).toBeVisible();
  await expect(page.getByText("TA fundamentals", { exact: false }).first()).toBeVisible();
  await expect(page.getByText("Score on the horizontal axis").first()).toBeVisible();
  await expect(page.locator("svg[role='img']").first()).toBeVisible();
  await shot(page, browserName, "phase4-statistics.png");
});

test("module demand totals the prescribed hours", async ({ page, browserName }) => {
  await page.goto("/admin/demand");
  await expect(page.getByRole("heading", { name: "Module demand", level: 1 })).toBeVisible();
  const table = page.getByRole("table", { name: "Module demand" });
  await expect(table).toBeVisible();
  await expect(table.getByText("GIT-1", { exact: false })).toBeVisible();
  await expect(table.getByText("Not assessed").first()).toBeVisible();
  const total = table.locator("tbody tr").last();
  await expect(total).toContainText("Total prescribed hours across the cohort");
  expect(Number((await total.locator("td").last().innerText()).trim())).toBeGreaterThan(0);
  await shot(page, browserName, "phase4-demand.png");
});

test("item analysis flags at least one outlier with its reason", async ({ page, browserName }) => {
  await page.goto("/admin/items");
  await expect(page.getByRole("heading", { name: "Item analysis", level: 1 })).toBeVisible();
  const table = page.getByRole("table", { name: "Item analysis" });
  // Every item in the frozen development bank, including those never served.
  await expect(table.locator("tbody tr")).toHaveCount(65);
  await expect(page.getByRole("status").filter({ hasText: /flagged for attention/ })).toBeVisible();
  const flags = page.getByText("Attention", { exact: true });
  expect(await flags.count()).toBeGreaterThan(0);
  await shot(page, browserName, "phase4-items-outlier.png");
});

test("a submitted attempt is reset with a typed reason", async ({ page }) => {
  await page.goto("/admin/participants");
  const row = page.getByRole("table", { name: "Participants" }).locator("tbody tr").filter({ hasText: "participant-01" }).first();
  await expect(row.getByText("Submitted").first()).toBeVisible();
  await row.getByRole("button", { name: "Reset Test Automation Fundamentals for participant-01" }).click();

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Reason").fill("Participant reported the page freezing. Verified with delivery management.");
  await dialog.getByRole("button", { name: "Reset attempt" }).click();

  await expect(page.getByRole("dialog")).toBeHidden();
  const after = page.getByRole("table", { name: "Participants" }).locator("tbody tr").filter({ hasText: "participant-01" }).first();
  await expect(after.locator("td").nth(1)).toContainText("Not started");
});

test("retiring the last active item in a slot is refused", async ({ page, browserName }) => {
  await page.goto("/admin/items");
  const table = page.getByRole("table", { name: "Item analysis" });

  // The first item in the slot retires cleanly.
  await table.locator("tbody tr").filter({ hasText: FIRST_ITEM }).getByRole("button", { name: `Retire ${FIRST_ITEM}` }).click();
  let dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Removed from future papers only. Past attempts stand");
  await dialog.getByLabel("Reason (optional)").fill("Two participants queried the wording during the pilot.");
  await dialog.getByRole("button", { name: "Retire item" }).click();
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(table.locator("tbody tr").filter({ hasText: FIRST_ITEM })).toContainText("Retired");

  // Its sibling is the last active item in the slot, so the guard refuses.
  await table.locator("tbody tr").filter({ hasText: SIBLING_ITEM }).getByRole("button", { name: `Retire ${SIBLING_ITEM}` }).click();
  dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: "Retire item" }).click();
  await expect(dialog.getByRole("alert")).toContainText("would be left with 0 active items");
  await shot(page, browserName, "phase4-retire-refused.png");

  await dialog.getByRole("button", { name: "Cancel" }).click();
  await page.reload();
  await expect(table.locator("tbody tr").filter({ hasText: SIBLING_ITEM })).toContainText("Active");
});

test("the audit log records the reset and the successful retirement, and not the refusal", async ({ page, browserName }) => {
  await page.goto("/admin/audit");
  await expect(page.getByRole("heading", { name: "Audit log", level: 1 })).toBeVisible();
  const table = page.getByRole("table", { name: "Audit log" });
  await expect(table.locator("tbody tr").filter({ hasText: "item.retired" }).first()).toBeVisible();
  await expect(table.locator("tbody tr").filter({ hasText: "attempt.reset" }).first()).toBeVisible();
  await shot(page, browserName, "phase4-audit.png");

  // Exactly one retirement was recorded: the refusal changed nothing, so it wrote nothing.
  await page.goto("/admin/audit?action=item.retired");
  await expect(page.getByRole("table", { name: "Audit log" }).locator("tbody tr")).toHaveCount(1);
  await expect(page.getByText("1 record", { exact: false })).toBeVisible();

  // Two resets: the one in the sample cohort and the one performed above.
  await page.goto("/admin/audit?action=attempt.reset");
  await expect(page.getByRole("table", { name: "Audit log" }).locator("tbody tr")).toHaveCount(2);
  await expect(page.getByRole("table", { name: "Audit log" })).toContainText("Participant reported the page freezing");
});

test("close and export produces four files that hold participant codes only", async ({ page, browserName }) => {
  fs.mkdirSync(EXPORTS, { recursive: true });
  await page.goto("/admin/export");
  await page.getByRole("button", { name: "Close and export", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await expect(dialog).toContainText("Closing stops any new attempt from starting");
  await dialog.getByRole("button", { name: "Close and export", exact: true }).click();

  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText("Exercise closed").first()).toBeVisible();
  await expect(page.getByText("No new attempts can start").first()).toBeVisible();

  const saved: Record<string, string> = {};
  for (const name of FILES) {
    const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId(`download-${name}`).click()]);
    expect(download.suggestedFilename()).toBe(name);
    const target = path.join(EXPORTS, name);
    await download.saveAs(target);
    saved[name] = fs.readFileSync(target, "utf8");
  }
  await shot(page, browserName, "phase4-export.png");

  const results = splitCsvLine(saved["results.csv"].split("\r\n")[0]);
  expect(results.slice(0, 6)).toEqual(["participant_code", "assessment", "assessment_title", "status", "attempt_number", "reset_count"]);
  expect(results).toContain("section_1_score");
  expect(results).toContain("TA-1");
  expect(results).toContain("submitted_at_melbourne");
  expect(saved["results.csv"].trim().split("\r\n")).toHaveLength(46);

  const itemAnalysis = splitCsvLine(saved["item-analysis.csv"].split("\r\n")[0]);
  expect(itemAnalysis.slice(0, 5)).toEqual(["item_id", "assessment", "section", "slot", "type"]);
  expect(itemAnalysis).toContain("facility_percent");

  const audit = splitCsvLine(saved["audit-log.csv"].split("\r\n")[0]);
  expect(audit.slice(0, 5)).toEqual(["at_melbourne", "at_iso", "actor", "actor_role", "action"]);

  for (const name of ["results.csv", "item-analysis.csv", "audit-log.csv"] as const) {
    const header = splitCsvLine(saved[name].split("\r\n")[0]);
    expect(findPiiIdentifiers(header)).toEqual([]);
    expect(findPiiInText(saved[name])).toEqual([]);
    expect(UUID_ANYWHERE.test(saved[name])).toBe(false);
  }
  // The two files that carry participants name them by code and by nothing else.
  expect(saved["results.csv"]).toContain("participant-01");
  expect(saved["audit-log.csv"]).toContain("participant-01");
  expect(findPiiInText(saved["archive.json"])).toEqual([]);

  const archive: unknown = JSON.parse(saved["archive.json"]);
  expect(Object.keys(archive as Record<string, unknown>).sort()).toEqual([
    "appVersion",
    "attempts",
    "bankVersion",
    "exportedAt",
    "participants",
    "settings",
  ]);

  // Closing is recorded, and the overview now reports the exercise as closed.
  await page.goto("/admin");
  await expect(page.getByTestId("stat-exercise")).toHaveText("Closed");
});
