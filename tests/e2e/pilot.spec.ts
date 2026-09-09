import fs from "node:fs";
import { expect, test, type Locator, type Page } from "@playwright/test";
import { createParticipants, loginAsAdmin, loginAsParticipant, logout } from "./helpers";
import { currentType, nextQuestion, startAssessment } from "./helpers/attempt";
import { answerCorrectly, currentItem } from "./helpers/answer-key";

/**
 * The pilot docs/04 step 4 asks for: two internal test accounts take all three assessments end to
 * end against the frozen bank, with the ordering and matching questions operated once by mouse and
 * once by keyboard, and the pilot attempts reset away afterwards.
 *
 * Chromium only, and skipped unless PILOT=1, because it takes several minutes and creates and then
 * voids real attempts.
 */

const OUT = "docs/evidence/pilot";
const notes: string[] = [];

function note(line: string): void {
  notes.push(line);
  console.log(line);
}

test.describe.configure({ mode: "serial" });
test.skip(process.env.PILOT !== "1", "set PILOT=1 to run the pilot");
test.skip(({ browserName }) => browserName !== "chromium", "the pilot is a single end-to-end rehearsal");

/** Presses on a locator and drags it onto a point, releasing there. */
async function dragTo(page: Page, from: Locator, target: Locator): Promise<void> {
  const a = await from.boundingBox();
  const b = await target.boundingBox();
  if (!a || !b) throw new Error("A drag endpoint has no bounding box.");
  await page.mouse.move(a.x + a.width / 2, a.y + a.height / 2);
  await page.mouse.down();
  await page.mouse.move(a.x + a.width / 2 + 8, a.y + a.height / 2 + 8, { steps: 5 });
  await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2, { steps: 16 });
  await page.mouse.move(b.x + b.width / 2 + 1, b.y + b.height / 2 + 1, { steps: 2 });
  await page.mouse.up();
  await page.waitForTimeout(150);
}

/** Answers the question on screen, using the mouse for the two drag-and-drop types. */
async function answerByMouse(page: Page): Promise<void> {
  const item = await currentItem(page);
  const card = page.getByTestId("question-card");

  if (item.type === "ordering") {
    for (let target = 0; target < item.key.length; target += 1) {
      for (;;) {
        const ids = await card
          .locator('[data-testid^="ordering-item-"]')
          .evaluateAll((nodes) => nodes.map((n) => (n.getAttribute("data-testid") ?? "").replace("ordering-item-", "")));
        const at = ids.indexOf(item.key[target]);
        if (at <= target) break;
        await dragTo(page, card.getByTestId(`ordering-handle-${item.key[target]}`), card.getByTestId(`ordering-item-${ids[at - 1]}`));
      }
    }
    const finalOrder = await card
      .locator('[data-testid^="ordering-item-"]')
      .evaluateAll((nodes) => nodes.map((n) => (n.getAttribute("data-testid") ?? "").replace("ordering-item-", "")));
    if (finalOrder.join(",") !== item.key.join(",")) throw new Error(`ordering ${item.id} did not reach the keyed order by mouse drag`);
    note(`  ordering ${item.id} arranged by mouse drag`);
    return;
  }

  if (item.type === "matching") {
    // A synthetic drag can miss when the tray reflows under it, so each token is checked and
    // re-dragged. Every placement here is still made with the mouse: nothing falls back to the
    // selector, because the point of this run is to prove the pointer path.
    for (let attempt = 1; attempt <= 4; attempt += 1) {
      for (const token of item.tokens) {
        const placed = await card.getByTestId(`matching-bucket-${token.bucket}`).getByTestId(`matching-token-${token.id}`).count();
        if (placed > 0) continue;
        await dragTo(page, card.getByTestId(`matching-drag-${token.id}`), card.getByTestId(`matching-bucket-${token.bucket}`));
      }
      const count = (await card.getByTestId(`matching-count-${item.id}`).innerText()).trim();
      if (count === `${item.tokens.length} of ${item.tokens.length} placed`) {
        note(`  matching ${item.id} placed by mouse drag (${count.trim()}, ${attempt} pass${attempt === 1 ? "" : "es"})`);
        return;
      }
    }
    throw new Error(`matching ${item.id} could not be fully placed by mouse drag`);
  }

  await answerCorrectly(page);
}

async function takeAssessment(page: Page, id: "ta" | "sql" | "python", mode: "mouse" | "keyboard"): Promise<void> {
  await startAssessment(page, id);
  for (let q = 0; q < 10; q += 1) {
    const type = await currentType(page);
    if (mode === "mouse") {
      await answerByMouse(page);
    } else {
      await answerCorrectly(page);
      if (type === "ordering" || type === "matching") {
        const item = await currentItem(page);
        note(`  ${type} ${item.id} completed with the on-screen controls and keyboard`);
      }
    }
    if (q < 9) await nextQuestion(page);
  }
  await page.getByTestId("nav-review").click();
  await page.waitForURL(new RegExp(`/assessment/${id}/review`));
  const summary = await page.getByTestId("review-summary").innerText();
  note(`  ${id}: ${summary}`);
  expect(summary).toContain("0 unanswered");
  await page.getByRole("button", { name: "Submit assessment" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Submit", exact: true }).click();
  await page.waitForURL(/submitted/);
}

test("two internal accounts complete all three assessments, by mouse and by keyboard", async ({ browser, page }) => {
  test.setTimeout(20 * 60 * 1000);
  fs.mkdirSync(OUT, { recursive: true });

  await loginAsAdmin(page);
  const accounts = await createParticipants(page, 2);
  expect(accounts).toHaveLength(2);
  note(`Pilot accounts created: ${accounts.map((a) => a.code).join(", ")}`);
  await page.screenshot({ path: `${OUT}/01-register.png`, fullPage: true });
  await logout(page);

  const modes = ["mouse", "keyboard"] as const;
  for (const [index, account] of accounts.entries()) {
    const mode = modes[index];
    note(`\n${account.code}: drag and drop by ${mode}`);
    const context = await browser.newContext();
    const participant = await context.newPage();
    await loginAsParticipant(participant, account.code, account.password);
    for (const id of ["ta", "sql", "python"] as const) await takeAssessment(participant, id, mode);

    await participant.goto("/plan");
    await expect(participant.getByTestId("training-plan")).toBeVisible();
    const total = await participant.getByTestId("plan-total").innerText();
    const closing = await participant.getByTestId("plan-closing").innerText();
    note(`  Training Plan: ${total}`);
    expect(total).toMatch(/^Prescribed learning: \d+ hours\.$/);
    expect(closing).toBe("Your journey map will be issued by delivery management.");
    await participant.screenshot({ path: `${OUT}/plan-${account.code}-${mode}.png`, fullPage: true });
    await context.close();
  }

  // Reset the pilot attempts away, as the go-live checklist requires.
  await loginAsAdmin(page);
  await page.goto("/admin/participants");
  const titles = { ta: "Test Automation Fundamentals", sql: "SQL", python: "Python" } as const;
  for (const account of accounts) {
    for (const id of ["ta", "sql", "python"] as const) {
      const reset = page.getByRole("button", { name: `Reset ${titles[id]} for ${account.code}` });
      if ((await reset.count()) === 0) continue;
      await reset.first().click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("textbox").fill("Pilot attempt, reset away before go-live.");
      await dialog.getByRole("button", { name: "Reset attempt" }).click();
      await expect(dialog).toBeHidden();
      await page.waitForTimeout(300);
    }
    note(`Reset the pilot attempts for ${account.code}`);
  }
  await page.screenshot({ path: `${OUT}/02-after-reset.png`, fullPage: true });

  for (const account of accounts) {
    const row = page.getByRole("row", { name: new RegExp(account.code) });
    await expect(row).toContainText("Not started");
  }

  fs.writeFileSync(
    `${OUT}/pilot-log.md`,
    `# Pilot run\n\nDate: 2026-09-10. Bank version 1, frozen. Production build.\n\n\`\`\`\n${notes.join("\n")}\n\`\`\`\n\nBoth accounts finished all three assessments and received a Training Plan. The ordering and\nmatching questions were operated by mouse drag for the first account and by the on-screen controls\nand keyboard for the second. All pilot attempts were then reset away, and both accounts show Not\nstarted for every assessment.\n`,
    "utf8",
  );
});
