import { expect, type Page } from "@playwright/test";
import { currentType, type QuestionType } from "./attempt";

/**
 * Answers a question correctly.
 *
 * This works only against the development sample bank, whose items state their
 * own key in the stem ("the marked option is Option C", "arrange the steps in
 * ascending order", "place each token onto the bucket its label names"). It
 * exists so an end-to-end run can produce a participant who meets the
 * thresholds, and therefore a Training Plan that shows Credited and Evidence
 * review rows as well as Prescribed ones. It reads only what a participant can
 * see on screen: no key ever reaches the client.
 */

/** Clicks the option tile whose text is exactly `label`. */
async function clickOptionByText(page: Page, prefix: string, label: string): Promise<void> {
  const options = page.getByTestId("question-card").locator(`[data-testid^="${prefix}"]`);
  const count = await options.count();
  for (let i = 0; i < count; i += 1) {
    const text = (await options.nth(i).innerText()).trim();
    if (text === label) {
      await options.nth(i).click();
      return;
    }
  }
  throw new Error(`No option reading "${label}" was found among ${count} options.`);
}

/** The ordering list as [elementId, step number] pairs, top to bottom. */
async function orderingRows(page: Page): Promise<Array<{ id: string; step: number }>> {
  return page
    .getByTestId("question-card")
    .locator('[data-testid^="ordering-item-"]')
    .evaluateAll((nodes) =>
      nodes.map((node) => {
        const match = /Step (\d+)/.exec(node.textContent ?? "");
        return { id: (node.getAttribute("data-testid") ?? "").replace("ordering-item-", ""), step: Number(match?.[1] ?? 0) };
      }),
    );
}

/** Answers the question on screen correctly. Development sample bank only. */
export async function answerCorrectly(page: Page): Promise<QuestionType> {
  const card = page.getByTestId("question-card");
  const type = await currentType(page);
  const stem = (await card.locator(".stem").innerText()).replace(/\s+/g, " ").trim();

  switch (type) {
    case "single": {
      const marked = /the marked option is (Option [A-F])\./.exec(stem);
      if (marked) {
        await clickOptionByText(page, "single-option-", marked[1]);
      } else {
        // The fixed-order variant asks how many rows the table in the stem has.
        const rows = await card.locator(".stem table tbody tr").count();
        await clickOptionByText(page, "single-option-", `${rows} row${rows === 1 ? "" : "s"}`);
      }
      break;
    }
    case "multi": {
      const marked = /the marked options are ([^.]+)\./.exec(stem);
      if (!marked) throw new Error(`The multi stem did not name its options: ${stem}`);
      for (const label of marked[1].split(",").map((part) => part.trim())) {
        await clickOptionByText(page, "multi-option-", label);
      }
      break;
    }
    case "ordering": {
      // Selection sort using the visible Move up control, ascending by step number.
      const target = (await orderingRows(page)).map((row) => row.step).sort((a, b) => a - b);
      for (let position = 0; position < target.length; position += 1) {
        const rows = await orderingRows(page);
        if (rows[position].step === target[position]) continue;
        const from = rows.findIndex((row, i) => i > position && row.step === target[position]);
        for (let hop = from; hop > position; hop -= 1) {
          await card.getByTestId(`ordering-move-up-${rows[from].id}`).click();
        }
      }
      const finished = await orderingRows(page);
      expect(finished.map((row) => row.step)).toEqual(target);
      break;
    }
    case "matching": {
      const tokens = await card
        .locator('[data-testid^="matching-token-"]')
        .evaluateAll((nodes) =>
          nodes.map((node) => {
            const match = /belongs to (Bucket \d+)/.exec(node.textContent ?? "");
            return { id: (node.getAttribute("data-testid") ?? "").replace("matching-token-", ""), bucket: match?.[1] ?? "" };
          }),
        );
      for (const token of tokens) {
        if (!token.bucket) throw new Error(`Token ${token.id} did not name its bucket.`);
        await card.getByTestId(`matching-select-${token.id}`).selectOption({ label: token.bucket });
      }
      break;
    }
  }
  return type;
}
