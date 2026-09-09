import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import type { Bank, BankItem } from "@/engine/types";
import { currentType, type QuestionType } from "./attempt";

/**
 * Answers the question on screen correctly, whichever bank is loaded.
 *
 * The keys are read from the bank file on disk, which the test process can see
 * because it runs on the same machine as the server. Nothing is read from the
 * page except the item id the attempt screen already publishes for testing, so
 * this does not depend on a key ever reaching the browser: it does not, and
 * tests/integration asserts that separately.
 *
 * It exists so an end-to-end run can produce a participant who meets the
 * thresholds, and therefore a Training Plan showing Credited and Evidence
 * review rows as well as Prescribed ones.
 */

const BANK_PATH = process.env.E2E_BANK ?? "bank/bank.v1.json";

let cache: Map<string, BankItem> | null = null;

function bank(): Map<string, BankItem> {
  if (!cache) {
    const parsed = JSON.parse(readFileSync(BANK_PATH, "utf8")) as Bank;
    cache = new Map(parsed.items.map((item) => [item.id, item] as const));
  }
  return cache;
}

/** The item the attempt screen is currently showing. */
export async function currentItem(page: Page): Promise<BankItem> {
  const id = await page.getByTestId("question-card").getAttribute("data-item-id");
  if (!id) throw new Error("The question card carries no data-item-id.");
  const item = bank().get(id);
  if (!item) throw new Error(`Item ${id} is not in ${BANK_PATH}.`);
  return item;
}

/** Answers the question on screen correctly. Works with any loaded bank. */
export async function answerCorrectly(page: Page): Promise<QuestionType> {
  const item = await currentItem(page);
  const type = await currentType(page);
  const card = page.getByTestId("question-card");

  switch (item.type) {
    case "single": {
      const key = item.options.find((option) => option.correct);
      if (!key) throw new Error(`${item.id} has no correct option.`);
      await card.getByTestId(`single-option-${item.id}-${key.id}`).click();
      break;
    }
    case "multi": {
      for (const option of item.options.filter((o) => o.correct)) {
        await card.getByTestId(`multi-option-${item.id}-${option.id}`).click();
      }
      break;
    }
    case "ordering": {
      // Move each element into its keyed position with the Move up button, from the top down.
      for (let target = 0; target < item.key.length; target += 1) {
        const wanted = item.key[target];
        for (;;) {
          const ids = await card
            .locator('[data-testid^="ordering-item-"]')
            .evaluateAll((nodes) => nodes.map((n) => (n.getAttribute("data-testid") ?? "").replace("ordering-item-", "")));
          const at = ids.indexOf(wanted);
          if (at <= target) break;
          await card.getByTestId(`ordering-move-up-${wanted}`).click();
        }
      }
      break;
    }
    case "matching": {
      for (const token of item.tokens) {
        const bucket = item.buckets.find((b) => b.id === token.bucket);
        if (!bucket) throw new Error(`${item.id} token ${token.id} names an unknown bucket.`);
        await card.getByTestId(`matching-select-${token.id}`).selectOption(bucket.id);
      }
      break;
    }
  }
  return type;
}
