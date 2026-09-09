import { expect, type Page } from "@playwright/test";

/**
 * Helpers for driving one attempt: reading which question and item type is on
 * screen, answering it in the plain way a participant would, and waiting for
 * the autosave indicator to settle on "Saved".
 */

export type QuestionType = "single" | "multi" | "ordering" | "matching";

const TYPES: QuestionType[] = ["single", "multi", "ordering", "matching"];

/** The 1-based number of the question on screen. */
export async function currentQuestion(page: Page): Promise<number> {
  const card = page.getByTestId("question-card");
  await expect(card).toBeVisible();
  return Number(await card.getAttribute("data-question"));
}

/** The item type of the question on screen. */
export async function currentType(page: Page): Promise<QuestionType> {
  const card = page.getByTestId("question-card");
  await expect(card).toBeVisible();
  const value = await card.getAttribute("data-item-type");
  const type = TYPES.find((candidate) => candidate === value);
  if (!type) throw new Error(`Unexpected item type on screen: ${String(value)}`);
  return type;
}

/** How many saves the server has acknowledged on this attempt so far. */
export async function saveCount(page: Page): Promise<number> {
  return Number(await page.getByTestId("save-status").getAttribute("data-saves"));
}

/** Waits until at least one more save than `previous` has been acknowledged and the indicator reads "Saved". */
export async function expectSaved(page: Page, previous: number): Promise<number> {
  await expect
    .poll(
      async () => {
        const saves = await saveCount(page);
        const state = await page.getByTestId("saved-indicator").getAttribute("data-state");
        return saves > previous && state === "saved";
      },
      { timeout: 20_000, message: "The autosave indicator did not settle on Saved." },
    )
    .toBe(true);
  await expect(page.getByTestId("saved-indicator")).toContainText("Saved");
  return saveCount(page);
}

/**
 * Answers the question on screen the way a participant would: a tile for a
 * single, two tiles for a multi, one Move down for an ordering, and every token
 * placed through the selectors for a matching.
 */
export async function answerCurrentQuestion(page: Page): Promise<QuestionType> {
  const type = await currentType(page);
  const card = page.getByTestId("question-card");
  switch (type) {
    case "single": {
      await card.locator('[data-testid^="single-option-"]').first().click();
      break;
    }
    case "multi": {
      const options = card.locator('[data-testid^="multi-option-"]');
      await options.nth(0).click();
      await options.nth(1).click();
      break;
    }
    case "ordering": {
      await card.locator('[data-testid^="ordering-move-down-"]').first().click();
      break;
    }
    case "matching": {
      const tokenIds = await card
        .locator('[data-testid^="matching-token-"]')
        .evaluateAll((nodes) => nodes.map((node) => (node.getAttribute("data-testid") ?? "").replace("matching-token-", "")));
      const buckets = await card.locator('[data-testid^="matching-bucket-"]').count();
      for (const [i, tokenId] of tokenIds.entries()) {
        await card.getByTestId(`matching-select-${tokenId}`).selectOption({ index: (i % buckets) + 1 });
      }
      break;
    }
  }
  return type;
}

/**
 * A stable description of the answer currently shown on screen, used to prove a
 * refresh restores exactly what was there before.
 */
export async function answerSignature(page: Page): Promise<string> {
  const card = page.getByTestId("question-card");
  const type = await currentType(page);
  if (type === "single" || type === "multi") {
    return card
      .locator("input:checked")
      .evaluateAll((nodes) =>
        nodes
          .map((node) => (node as HTMLInputElement).value)
          .sort()
          .join(","),
      );
  }
  if (type === "ordering") {
    return card
      .locator('[data-testid^="ordering-item-"]')
      .evaluateAll((nodes) => nodes.map((node) => node.getAttribute("data-testid") ?? "").join(","));
  }
  return card
    .locator('[data-testid^="matching-token-"]')
    .evaluateAll((nodes) =>
      nodes
        .map((node) => `${node.getAttribute("data-testid") ?? ""}=${node.getAttribute("data-location") ?? ""}`)
        .sort()
        .join(","),
    );
}

/** Moves to the next question and waits for it to arrive. */
export async function nextQuestion(page: Page): Promise<void> {
  const current = await currentQuestion(page);
  await page.getByTestId("nav-next").click();
  await expect(page.getByTestId("question-card")).toHaveAttribute("data-question", String(current + 1));
}

/** Moves forward until the given 1-based question is on screen. */
export async function goToQuestion(page: Page, question: number): Promise<void> {
  let current = await currentQuestion(page);
  while (current < question) {
    await nextQuestion(page);
    current = await currentQuestion(page);
  }
}

/** Opens an assessment from the dashboard, reads the instructions and starts the timer. */
export async function startAssessment(page: Page, id: "ta" | "sql" | "python"): Promise<void> {
  await page.goto("/dashboard");
  await page.getByTestId(`start-${id}`).click();
  await page.waitForURL(new RegExp(`/assessment/${id}/instructions`));
  await page.getByTestId("start-assessment").click();
  await page.waitForURL(new RegExp(`/assessment/${id}/attempt`));
  await expect(page.getByTestId("question-card")).toBeVisible();
}

/** Saves an evidence screenshot. Only the chromium project writes them, so the files are one consistent render. */
export async function shot(page: Page, browserName: string, name: string): Promise<void> {
  if (browserName !== "chromium") return;
  await page.screenshot({ path: `docs/evidence/${name}`, fullPage: true });
}
