import { expect, test } from "@playwright/test";
import {
  answerCorrectly,
  answerCurrentQuestion,
  answerSignature,
  createParticipants,
  currentQuestion,
  expectSaved,
  loginAsAdmin,
  loginAsParticipant,
  logout,
  nextQuestion,
  saveCount,
  shot,
  startAssessment,
  type QuestionType,
} from "./helpers";

/**
 * The participant experience end to end: sign in, sit all three assessments,
 * survive a refresh mid-attempt, review a mixed paper and finish on the
 * Training Plan, on screen and printed.
 */

/** The instructions copy, verbatim from docs/05, as the five paragraphs the screen renders. */
const INSTRUCTIONS = [
  "This assessment has 10 questions and a 10 minute timer. You have one attempt.",
  "Your answers save automatically as you go, and you can move between questions and change answers until you submit.",
  "Some questions ask you to drag items into order or onto categories, and every one of these can also be completed with the keyboard or the on-screen controls.",
  "Unanswered questions score zero. When the timer ends, the assessment submits itself with your saved answers.",
  "If anything goes wrong technically, stop and contact the administrator, who can reset your attempt.",
];

/** The same copy as one block, exactly as docs/05 states it. */
const INSTRUCTIONS_VERBATIM =
  "This assessment has 10 questions and a 10 minute timer. You have one attempt. Your answers save automatically as you go, and you can move between questions and change answers until you submit. Some questions ask you to drag items into order or onto categories, and every one of these can also be completed with the keyboard or the on-screen controls. Unanswered questions score zero. When the timer ends, the assessment submits itself with your saved answers. If anything goes wrong technically, stop and contact the administrator, who can reset your attempt.";

const AMBER = "rgb(178, 106, 0)";

test.describe("participant experience", () => {
  test("participant happy path", async ({ page, browserName }) => {
    test.setTimeout(420_000);

    await loginAsAdmin(page);
    const [participant] = await createParticipants(page, 1);
    expect(participant.code).toMatch(/^participant-\d{2,}$/);
    expect(participant.password.length).toBeGreaterThanOrEqual(14);
    await logout(page);

    // ---------- Sign in ----------
    await page.goto("/login");
    await shot(page, browserName, "phase3-login.png");
    await loginAsParticipant(page, participant.code, participant.password);

    // ---------- Dashboard ----------
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(/^Welcome, Participant \d+\.$/);
    await expect(page.getByTestId("participant-code")).toHaveText(participant.code);
    const titles = await page.locator('[data-testid^="assessment-card-"] h2').allInnerTexts();
    expect(titles).toEqual(["Test Automation Fundamentals", "SQL", "Python"]);
    for (const id of ["ta", "sql", "python"] as const) {
      const card = page.getByTestId(`assessment-card-${id}`);
      await expect(card).toContainText("10 questions, 10 minutes");
      await expect(card).toContainText("Not started");
      await expect(page.getByTestId(`start-${id}`)).toHaveText("Start");
    }
    await shot(page, browserName, "phase3-dashboard.png");

    // ---------- Instructions ----------
    await page.getByTestId("start-ta").click();
    await page.waitForURL(/\/assessment\/ta\/instructions/);
    const paragraphs = page.getByTestId("instructions").locator("p");
    await expect(paragraphs).toHaveCount(INSTRUCTIONS.length);
    for (const [i, text] of INSTRUCTIONS.entries()) await expect(paragraphs.nth(i)).toHaveText(text);
    expect((await paragraphs.allInnerTexts()).map((t) => t.trim()).join(" ")).toBe(INSTRUCTIONS_VERBATIM);
    await expect(page.getByTestId("start-assessment")).toHaveText("Start assessment. The timer begins now.");
    await shot(page, browserName, "phase3-instructions.png");

    await page.getByTestId("start-assessment").click();
    await page.waitForURL(/\/assessment\/ta\/attempt/);
    await expect(page.getByTestId("question-card")).toBeVisible();

    // ---------- Test Automation Fundamentals: every item type, and a refresh ----------
    let saves = await saveCount(page);
    const seen = new Set<QuestionType>();
    for (let q = 1; q <= 10; q += 1) {
      expect(await currentQuestion(page)).toBe(q);
      const type = await answerCurrentQuestion(page);
      saves = await expectSaved(page, saves);
      if (!seen.has(type)) {
        seen.add(type);
        await shot(page, browserName, `phase3-attempt-${type}.png`);
      }

      if (q === 5) {
        const before = await answerSignature(page);
        await page.reload();
        await expect(page.getByTestId("question-card")).toBeVisible();
        expect(page.url()).toContain("q=5");
        expect(await currentQuestion(page)).toBe(5);
        expect(await answerSignature(page)).toBe(before);
        await expect(page.getByRole("img", { name: "5 of 10 answered" })).toBeVisible();
        saves = await saveCount(page);
      }

      if (q < 10) await nextQuestion(page);
    }
    expect([...seen].sort()).toEqual(["matching", "multi", "ordering", "single"]);

    await page.getByTestId("nav-review").click();
    await page.waitForURL(/\/assessment\/ta\/review/);
    await expect(page.getByTestId("review-summary")).toHaveText("10 answered, 0 unanswered");
    await page.getByTestId("open-submit").click();
    await expect(page.getByTestId("submit-warning")).toHaveText("Unanswered questions score zero. Submit now?");
    await page.getByTestId("confirm-submit").click();
    await page.waitForURL(/\/assessment\/ta\/submitted/);
    await expect(page.getByTestId("submitted")).toContainText("Your Test Automation Fundamentals assessment has been submitted.");
    await expect(page.getByTestId("submitted")).toContainText("Your Training Plan appears once all three assessments are complete.");
    await expect(page.getByTestId("back-to-assessments")).toBeVisible();
    await shot(page, browserName, "phase3-submitted.png");

    // ---------- SQL: answered in full ----------
    await startAssessment(page, "sql");
    saves = await saveCount(page);
    for (let q = 1; q <= 10; q += 1) {
      await answerCurrentQuestion(page);
      saves = await expectSaved(page, saves);
      if (q < 10) await nextQuestion(page);
    }
    await page.getByTestId("nav-review").click();
    await page.waitForURL(/\/assessment\/sql\/review/);
    await expect(page.getByTestId("review-summary")).toHaveText("10 answered, 0 unanswered");
    await page.getByTestId("open-submit").click();
    await page.getByTestId("confirm-submit").click();
    await page.waitForURL(/\/assessment\/sql\/submitted/);

    // ---------- Python: two questions left unanswered ----------
    await startAssessment(page, "python");
    saves = await saveCount(page);
    for (let q = 1; q <= 10; q += 1) {
      if (q <= 8) {
        await answerCurrentQuestion(page);
        saves = await expectSaved(page, saves);
      }
      if (q < 10) await nextQuestion(page);
    }
    await page.getByTestId("nav-review").click();
    await page.waitForURL(/\/assessment\/python\/review/);
    await expect(page.getByTestId("review-summary")).toHaveText("8 answered, 2 unanswered");
    await expect(page.getByTestId("review-tile-9")).toHaveAttribute("data-answered", "false");
    await expect(page.getByTestId("review-tile-10")).toHaveAttribute("data-answered", "false");
    const unansweredBorder = await page.getByTestId("review-tile-10").evaluate((el) => getComputedStyle(el).borderTopColor);
    expect(unansweredBorder).toBe(AMBER);
    await shot(page, browserName, "phase3-review-mixed.png");

    await page.getByTestId("open-submit").click();
    await page.getByTestId("confirm-submit").click();
    await page.waitForURL(/\/assessment\/python\/submitted/);
    await expect(page.getByTestId("submitted")).toContainText("All three assessments are complete.");
    await expect(page.getByTestId("view-plan")).toBeVisible();

    // ---------- The dashboard becomes the Training Plan ----------
    await page.goto("/dashboard");
    await expect(page.getByTestId("training-plan")).toBeVisible();
    await expect(page.getByTestId("plan-total")).toHaveText(/^Prescribed learning: \d+ hours\.$/);
    await expect(page.getByTestId("plan-closing")).toHaveText("Your journey map will be issued by delivery management.");
    await expect(page.locator('[data-testid^="assessment-card-"]')).toHaveCount(0);

    // ---------- The plan on its own page ----------
    await page.goto("/plan");
    await expect(page.getByTestId("training-plan")).toBeVisible();
    const rows = await page
      .locator('[data-testid^="plan-row-"]')
      .evaluateAll((nodes) => nodes.map((node) => (node.getAttribute("data-testid") ?? "").replace("plan-row-", "")));
    expect(rows).toEqual(["TA-1", "SQL-1", "SQL-2", "PY-1", "PY-2a", "PY-2b", "GIT-1"]);
    await expect(page.getByTestId("plan-row-GIT-1")).toContainText("Confirmed at journey map issue");
    await expect(page.getByTestId("training-plan")).not.toContainText("score");

    const courseLinks = page.locator('[data-outcome="prescribed"] a');
    expect(await courseLinks.count()).toBeGreaterThan(0);
    await expect(courseLinks.first()).toHaveAttribute("target", "_blank");
    await expect(courseLinks.first()).toHaveAttribute("rel", /noopener/);
    await shot(page, browserName, "phase3-plan.png");

    // ---------- The printed A4 page ----------
    if (browserName === "chromium") {
      await page.emulateMedia({ media: "print" });
      await expect(page.getByTestId("print-plan")).toBeHidden();
      await expect(page.getByTestId("participant-code")).toBeHidden();
      await page.screenshot({ path: "docs/evidence/phase3-plan-print.png", fullPage: true });
      await page.pdf({ path: "docs/evidence/phase3-plan-a4.pdf", format: "A4", printBackground: true });
      await page.emulateMedia({ media: null });
    }
  });

  test("a participant who meets every threshold sees credited and evidence review rows", async ({ page, browserName }) => {
    test.setTimeout(420_000);

    await loginAsAdmin(page);
    const [participant] = await createParticipants(page, 1);
    await logout(page);
    await loginAsParticipant(page, participant.code, participant.password);

    for (const id of ["ta", "sql", "python"] as const) {
      await startAssessment(page, id);
      let saves = await saveCount(page);
      for (let q = 1; q <= 10; q += 1) {
        await answerCorrectly(page);
        saves = await expectSaved(page, saves);
        if (q < 10) await nextQuestion(page);
      }
      await page.getByTestId("nav-review").click();
      await page.waitForURL(new RegExp(`/assessment/${id}/review`));
      await expect(page.getByTestId("review-summary")).toHaveText("10 answered, 0 unanswered");
      await page.getByTestId("open-submit").click();
      await page.getByTestId("confirm-submit").click();
      await page.waitForURL(new RegExp(`/assessment/${id}/submitted`));
    }

    await page.goto("/plan");
    const outcomes = await page
      .locator('[data-testid^="plan-row-"]')
      .evaluateAll((nodes) => nodes.map((node) => `${(node.getAttribute("data-testid") ?? "").replace("plan-row-", "")}:${node.getAttribute("data-outcome") ?? ""}`));
    expect(outcomes).toEqual([
      "TA-1:evidence_review",
      "SQL-1:credited",
      "SQL-2:credited",
      "PY-1:credited",
      "PY-2a:evidence_review",
      "PY-2b:evidence_review",
      "GIT-1:not_assessed",
    ]);
    await expect(page.getByTestId("plan-row-SQL-1")).toContainText("Credited");
    await expect(page.getByTestId("plan-row-TA-1")).toContainText("Provisional, confirmed at review");
    await expect(page.getByTestId("plan-row-GIT-1")).toContainText("Confirmed at journey map issue");
    await expect(page.getByTestId("plan-total")).toHaveText("Prescribed learning: 0 hours.");
    await shot(page, browserName, "phase3-plan-outcomes.png");
  });

  test("the timer chip turns amber under two minutes", async ({ page, browserName }) => {
    test.setTimeout(180_000);
    test.skip(
      browserName === "webkit",
      "Playwright's clock emulation advances Date in WebKit but does not fire the page's own interval, so the countdown cannot be driven there. The amber state is proven on Chromium and Firefox.",
    );

    await loginAsAdmin(page);
    const [participant] = await createParticipants(page, 1);
    await logout(page);

    await page.clock.install();
    await loginAsParticipant(page, participant.code, participant.password);
    await startAssessment(page, "ta");

    const chip = page.getByTestId("timer-chip");
    await expect(chip).toHaveAttribute("data-state", "normal");

    await page.clock.fastForward(8 * 60 * 1000 + 30 * 1000);
    // fastForward fires each due timer once; runFor then lets the chip's own
    // interval tick and its colour transition finish under the fake clock.
    await page.clock.runFor(1000);

    // TimerChip publishes data-state="attention" for the amber state; see the report.
    await expect(chip).toHaveAttribute("data-state", "attention");
    await expect(chip).toHaveText(/0[01]:\d\d/);
    await expect
      .poll(async () => chip.evaluate((el) => [getComputedStyle(el).color, getComputedStyle(el).borderTopColor].join(" ")))
      .toBe(`${AMBER} ${AMBER}`);

    if (browserName === "chromium") {
      await page.getByTestId("attempt-header").screenshot({ path: "docs/evidence/phase3-timer-amber.png" });
    }
  });
});
