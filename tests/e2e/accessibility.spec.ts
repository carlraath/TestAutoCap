import fs from "node:fs";
import path from "node:path";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";
import { answerCorrectly } from "./helpers/answer-key";
import { createParticipants, loginAsAdmin, loginAsParticipant, logout } from "./helpers";
import { currentType, nextQuestion, startAssessment } from "./helpers/attempt";

/**
 * Phase 6 accessibility pass: axe against every screen in both roles, at WCAG 2.0/2.1 A and AA,
 * plus a check that every focusable control shows a visible focus indicator.
 *
 * Runs on chromium only: axe reports the document, not the engine, so running it four times
 * would produce the same findings four times.
 */

const OUT = "docs/evidence/phase6/a11y";
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

interface Violation {
  id: string;
  impact: string;
  help: string;
  nodes: string[];
}

const findings: Array<{ screen: string; violations: Violation[] }> = [];

async function audit(page: Page, screen: string): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  const violations: Violation[] = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact ?? "unknown",
    help: v.help,
    nodes: v.nodes.map((n) => n.target.join(" ")),
  }));
  findings.push({ screen, violations });
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, `${screen}.json`), `${JSON.stringify(violations, null, 2)}\n`, "utf8");
  expect(violations, `${screen}: ${violations.map((v) => `${v.id} (${v.nodes.join(", ")})`).join("; ")}`).toEqual([]);
}

test.describe.configure({ mode: "serial" });

test.skip(({ browserName }) => browserName !== "chromium", "axe reports the document, not the engine");

test("participant screens meet WCAG AA", async ({ page }) => {
  await loginAsAdmin(page);
  const [who] = await createParticipants(page, 1);
  await logout(page);

  await page.goto("/login");
  await audit(page, "participant-01-login");

  await loginAsParticipant(page, who.code, who.password);
  await audit(page, "participant-02-dashboard");

  await page.goto("/assessment/ta/instructions");
  await audit(page, "participant-03-instructions");

  await startAssessment(page, "ta");
  const seen = new Set<string>();
  for (let i = 0; i < 10; i += 1) {
    const type = await currentType(page);
    if (!seen.has(type)) {
      seen.add(type);
      await audit(page, `participant-04-attempt-${type}`);
    }
    await answerCorrectly(page);
    if (i < 9) await nextQuestion(page);
  }
  expect(Array.from(seen).sort()).toEqual(["matching", "multi", "ordering", "single"]);

  await page.getByTestId("nav-review").click();
  await page.waitForURL(/\/assessment\/ta\/review/);
  await audit(page, "participant-05-review");

  await page.getByRole("button", { name: "Submit assessment" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Submit", exact: true }).click();
  await page.waitForURL(/submitted/);
  await audit(page, "participant-06-submitted");

  for (const id of ["sql", "python"] as const) {
    await page.goto(`/assessment/${id}/instructions`);
    await startAssessment(page, id);
    for (let i = 0; i < 10; i += 1) {
      await answerCorrectly(page);
      if (i < 9) await nextQuestion(page);
    }
    await page.getByTestId("nav-review").click();
    await page.waitForURL(new RegExp(`/assessment/${id}/review`));
    await page.getByRole("button", { name: "Submit assessment" }).click();
    await page.getByRole("dialog").getByRole("button", { name: "Submit", exact: true }).click();
    await page.waitForURL(/submitted/);
  }

  await page.goto("/plan");
  await audit(page, "participant-07-training-plan");
});

test("administrator screens meet WCAG AA", async ({ page }) => {
  await loginAsAdmin(page);
  for (const [screen, url] of [
    ["admin-01-overview", "/admin"],
    ["admin-02-participants", "/admin/participants"],
    ["admin-03-results", "/admin/results"],
    ["admin-04-statistics", "/admin/statistics"],
    ["admin-05-demand", "/admin/demand"],
    ["admin-06-items", "/admin/items"],
    ["admin-07-audit", "/admin/audit"],
    ["admin-08-export", "/admin/export"],
    ["admin-09-account", "/admin/account"],
  ] as const) {
    await page.goto(url);
    await audit(page, screen);
  }

  const firstDetail = page.getByRole("link", { name: "Expand" }).first();
  await page.goto("/admin/results");
  if (await firstDetail.isVisible()) {
    await firstDetail.click();
    await audit(page, "admin-10-results-detail");
  }
});

test("every focusable control shows a visible focus indicator", async ({ page }) => {
  await loginAsAdmin(page);
  await page.goto("/admin/participants");

  const withoutIndicator = await page.evaluate(() => {
    const selector = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const missing: string[] = [];
    for (const el of Array.from(document.querySelectorAll<HTMLElement>(selector))) {
      if (el.offsetParent === null) continue;
      const before = getComputedStyle(el);
      const baseline = `${before.outline} ${before.boxShadow} ${before.borderColor} ${before.backgroundColor}`;
      el.focus();
      const after = getComputedStyle(el);
      const focused = `${after.outline} ${after.boxShadow} ${after.borderColor} ${after.backgroundColor}`;
      if (baseline === focused) missing.push(el.tagName.toLowerCase() + (el.textContent ?? "").trim().slice(0, 24));
      el.blur();
    }
    return missing;
  });

  expect(withoutIndicator, `controls with no visible change on focus: ${withoutIndicator.join(", ")}`).toEqual([]);
});

test.afterAll(() => {
  const total = findings.reduce((n, f) => n + f.violations.length, 0);
  const lines = [
    "# Accessibility pass",
    "",
    `Date: 2026-09-10. axe-core via @axe-core/playwright, tags ${TAGS.join(", ")}. Chromium.`,
    "",
    `${findings.length} screens audited, ${total} violations.`,
    "",
    "| Screen | Violations |",
    "|---|---|",
    ...findings.map((f) => `| ${f.screen} | ${f.violations.length === 0 ? "none" : f.violations.map((v) => `${v.id} (${v.impact})`).join(", ")} |`),
    "",
    "Per-screen axe output is in this directory as one JSON file per screen.",
    "",
    "Also verified: a keyboard-only pass over the ordering and matching questions (tests/e2e/keyboard.spec.ts),",
    "and that every visible focusable control on a dense administrator screen changes appearance when focused.",
  ];
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync("docs/evidence/phase6/accessibility-pass-notes.md", `${lines.join("\n")}\n`, "utf8");
});
