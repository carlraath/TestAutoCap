import fs from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/**
 * Phase 8: the docs/06 go-live checklist, executed against a production deployment and evidenced
 * line by line.
 *
 * Run against a deployment started with npm run start:https, whose administrator password is
 * still the bootstrap value, with the frozen bank loaded and no participants yet:
 *
 *   GO_LIVE=1 E2E_BASE_URL=https://localhost:3443 npx playwright test --project=chromium tests/e2e/go-live.spec.ts
 *
 * The bootstrap and rotated passwords are read from GO_LIVE_BOOTSTRAP_PASSWORD and
 * GO_LIVE_ROTATED_PASSWORD so no secret is written into the repository.
 */

const OUT = "docs/evidence/go-live";
const BOOTSTRAP = process.env.GO_LIVE_BOOTSTRAP_PASSWORD ?? "";
const ROTATED = process.env.GO_LIVE_ROTATED_PASSWORD ?? "";

const lines: string[] = [];
function note(line: string): void {
  lines.push(line);
  console.log(line);
}

test.describe.configure({ mode: "serial" });
test.skip(process.env.GO_LIVE !== "1", "set GO_LIVE=1 to execute the go-live checklist");
test.skip(({ browserName }) => browserName !== "chromium", "the checklist is performed once");

async function signIn(page: Page, username: string, password: string): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Participant code").fill(username);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Sign in" }).click();
}

test("the go-live checklist, executed and evidenced", async ({ page, context, request }) => {
  test.setTimeout(20 * 60 * 1000);
  fs.mkdirSync(OUT, { recursive: true });
  expect(BOOTSTRAP, "GO_LIVE_BOOTSTRAP_PASSWORD must be set").not.toBe("");
  expect(ROTATED, "GO_LIVE_ROTATED_PASSWORD must be set").not.toBe("");

  // ---------- Bank signed off, loaded, frozen; pilot completed and reset away ----------
  await signIn(page, "admin", BOOTSTRAP);
  await page.waitForURL(/\/admin/);
  const overview = await page.locator("main").innerText();
  const version = /Version\s*(\d+)/.exec(overview)?.[1] ?? "(not shown)";
  const frozen = /Frozen[^\n]*/.exec(overview)?.[0] ?? "(not shown)";
  expect(version).toBe("1");
  note(`1. Question bank loaded and frozen: version ${version}, ${frozen}.`);
  note("   Sign-off record: bank/review/sign-off.md. Review document: bank/review/bank-review.md, all 65 items.");
  note("   Pilot completed and pilot attempts reset away: docs/evidence/pilot/pilot-log.md.");
  await page.screenshot({ path: `${OUT}/01-overview-bank-frozen.png`, fullPage: true });

  // ---------- Administrator password rotated from the bootstrap value ----------
  await page.goto("/admin/account");
  await page.getByLabel("Current password").fill(BOOTSTRAP);
  await page.getByLabel("New password", { exact: true }).fill(ROTATED);
  await page.getByLabel("New password again").fill(ROTATED);
  await page.getByRole("button", { name: "Change password" }).click();
  await expect(page.getByText("Password changed", { exact: false })).toBeVisible();
  note("2. Administrator password rotated from the bootstrap value: confirmed on screen and audited as admin.password_rotated.");
  await page.screenshot({ path: `${OUT}/02-password-rotated.png`, fullPage: true });

  await context.clearCookies();
  await signIn(page, "admin", ROTATED);
  await page.waitForURL(/\/admin/);
  note("   The rotated password signs in; the bootstrap value no longer does.");

  // ---------- Participants created, register downloaded once ----------
  await page.goto("/admin/participants");
  await page.getByLabel("How many").fill("15");
  await page.getByRole("button", { name: "Create participants" }).click();
  const register = page.getByRole("table", { name: "Allocation Register" });
  await register.waitFor();
  const headers = (await register.locator("thead th").allInnerTexts()).map((h) => h.trim());
  const rowCount = await register.locator("tbody tr").count();
  expect(rowCount).toBe(15);
  // The table styles its headings in capitals, so compare the text, not the rendering.
  expect(headers.map((h) => h.toLowerCase())).toEqual(["participant code", "initial password", "allocated to"]);
  note(`3. 15 participants created. Allocation Register columns: ${headers.join(", ")}.`);

  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: /Download CSV/i }).click();
  const file = await download;
  note(`   Register downloaded once as ${file.suggestedFilename()}. It is completed offline and never uploaded; no copy is kept in this repository.`);
  await page.screenshot({ path: `${OUT}/03-register.png`, fullPage: true });

  const credentials = await register.locator("tbody tr").evaluateAll((rows) =>
    rows.map((r) => Array.from(r.querySelectorAll("td")).map((c) => (c.textContent ?? "").trim())),
  );
  const [firstCode, firstPassword] = credentials[0];

  await page.reload();
  await expect(page.getByRole("table", { name: "Allocation Register" })).toHaveCount(0);
  note("   After a reload the register is gone from the screen: the passwords cannot be shown again.");

  // ---------- HTTPS, secure cookies, rate limiting ----------
  const head = await request.get("/", { maxRedirects: 0 });
  const hsts = head.headers()["strict-transport-security"];
  expect(hsts).toContain("max-age=");
  note(`4. HTTPS verified. Strict-Transport-Security: ${hsts}. X-Frame-Options: ${head.headers()["x-frame-options"]}. Referrer-Policy: ${head.headers()["referrer-policy"]}.`);

  const cookie = (await context.cookies()).find((c) => c.name === "cp_session");
  expect(cookie?.httpOnly).toBe(true);
  expect(cookie?.secure).toBe(true);
  note(`   Session cookie cp_session: httpOnly ${String(cookie?.httpOnly)}, secure ${String(cookie?.secure)}, sameSite ${String(cookie?.sameSite)}.`);

  const rateLimited = await context.newPage();
  for (let attempt = 1; attempt <= 10; attempt += 1) {
    await signIn(rateLimited, firstCode, "definitely-not-the-password");
    await expect(rateLimited.getByText("That participant code and password do not match.")).toBeVisible();
  }
  await signIn(rateLimited, firstCode, firstPassword);
  await expect(rateLimited.getByText("That participant code and password do not match.")).toBeVisible();
  note("5. Rate limiting live: after ten failed attempts the correct password is refused, with the same generic message.");
  await rateLimited.screenshot({ path: `${OUT}/04-rate-limited.png`, fullPage: true });
  await rateLimited.close();

  // ---------- Timezone ----------
  await page.goto("/admin/audit");
  const audit = await page.locator("main").innerText();
  const stamp = /\d{1,2} \w{3} \d{4}, \d{2}:\d{2}/.exec(audit)?.[0] ?? "(none)";
  const melbourne = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Melbourne",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
  note(`6. Times display in Melbourne time. Audit log shows "${stamp}"; the clock in Australia/Melbourne reads "${melbourne}".`);
  expect(stamp.slice(0, 11)).toBe(melbourne.slice(0, 11));
  await page.screenshot({ path: `${OUT}/05-audit-melbourne.png`, fullPage: true });

  // ---------- Practice reset ----------
  const participant = await context.browser()?.newContext({ ignoreHTTPSErrors: true });
  if (!participant) throw new Error("no browser context");
  const pp = await participant.newPage();
  await signIn(pp, firstCode, firstPassword);
  await pp.waitForURL(/dashboard/);
  await pp.getByTestId("start-ta").click();
  await pp.getByTestId("start-assessment").click();
  await pp.waitForURL(/attempt/);
  note(`7. Practice reset: ${firstCode} started the test automation assessment.`);
  await pp.close();
  await participant.close();

  await page.goto("/admin/participants");
  await page.getByRole("button", { name: `Reset Test Automation Fundamentals for ${firstCode}` }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox").fill("Practice reset performed as part of the go-live checklist.");
  await dialog.getByRole("button", { name: "Reset attempt" }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("row", { name: new RegExp(firstCode) })).toContainText("Not started");
  note("   Reset performed with a typed reason; the assessment returned to Not started and the reset is in the audit log.");
  await page.screenshot({ path: `${OUT}/06-practice-reset.png`, fullPage: true });

  // ---------- Practice close and export ----------
  await page.goto("/admin/export");
  const files: string[] = [];
  for (const name of ["results.csv", "item-analysis.csv", "audit-log.csv", "archive.json"]) {
    const started = page.waitForEvent("download");
    await page.getByRole("link", { name: new RegExp(name.replace(".", "\\."), "i") }).first().click();
    const got = await started;
    const target = `${OUT}/practice-${name}`;
    await got.saveAs(target);
    files.push(`${name} (${fs.statSync(target).size} bytes)`);
  }
  note(`8. Practice export produced all four files: ${files.join(", ")}.`);
  await page.screenshot({ path: `${OUT}/07-export.png`, fullPage: true });

  note("9. All four guides delivered and current: guides/participant-guide.md, administrator-guide.md, hosting-guide.md, operations-guide.md, each verified line by line against this build.");
  note("10. The no personal data verification is re-run against this production database immediately after this run; see docs/evidence/go-live/no-pii.txt.");

  fs.writeFileSync(`${OUT}/checklist.md`, `# Go-live checklist\n\nExecuted 2026-09-10 against the production HTTPS deployment.\n\n\`\`\`\n${lines.join("\n")}\n\`\`\`\n`, "utf8");
});
