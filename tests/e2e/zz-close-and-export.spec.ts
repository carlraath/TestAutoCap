import fs from "node:fs";
import path from "node:path";
import { expect, test, type Page } from "@playwright/test";
import { findPiiIdentifiers, findPiiInText } from "@/lib/pii-check";
import { loginAsAdmin } from "./helpers";

/**
 * Close and export, kept in its own file whose name sorts last so it runs after every other
 * spec. Closing the exercise deliberately stops any new attempt from starting, so running it
 * earlier would (correctly) block the participant specs that follow.
 */

test.describe.configure({ mode: "serial" });

const EVIDENCE = "docs/evidence";
const EXPORTS = path.join(EVIDENCE, "exports");
const FILES = ["results.csv", "item-analysis.csv", "audit-log.csv", "archive.json"] as const;
const UUID_ANYWHERE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

async function shot(page: Page, browserName: string, name: string): Promise<void> {
  if (browserName !== "chromium") return;
  await page.screenshot({ path: path.join(EVIDENCE, name), fullPage: true });
}

test.beforeEach(async ({ page }) => {
  await loginAsAdmin(page);
});

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

test("close and export produces four files that hold participant codes only", async ({ page, browserName }) => {
  fs.mkdirSync(EXPORTS, { recursive: true });
  await page.goto("/admin");
  const participantCount = Number(await page.getByTestId("stat-participants").innerText());
  expect(participantCount).toBeGreaterThanOrEqual(15);
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
  // One row per participant per assessment, plus the header. The count is derived rather than
  // fixed, because earlier specs in the run create participants of their own.
  expect(saved["results.csv"].trim().split("\r\n")).toHaveLength(participantCount * 3 + 1);

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
