import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
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
/** The development bank holds exactly two items in TA slot 1, so the second retirement must be refused. */
const FIRST_ITEM = "ta-01-a";
const SIBLING_ITEM = "ta-01-b";

async function shot(page: Page, browserName: string, name: string): Promise<void> {
  if (browserName !== "chromium") return;
  await page.screenshot({ path: path.join(EVIDENCE, name), fullPage: true });
}

/** Splits one CSV line, honouring the quoting src/lib/csv.ts writes. */

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
