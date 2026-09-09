import { expect, test, type Locator, type Page } from "@playwright/test";
import {
  createParticipants,
  currentQuestion,
  currentType,
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
 * The two drag and drop item types, operated entirely by keyboard and then by
 * mouse. Both paths must reorder or place, autosave, and leave the participant
 * where they can see what happened.
 */

function moved<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

async function focusedTestId(page: Page): Promise<string> {
  return page.evaluate(() => document.activeElement?.getAttribute("data-testid") ?? "none");
}

async function press(page: Page, key: string, settle = 200): Promise<void> {
  await page.keyboard.press(key);
  await page.waitForTimeout(settle);
}

async function centre(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  if (!box) throw new Error("The element has no bounding box.");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

/**
 * Presses the pointer on a locator and drags it onto a target, leaving the
 * button down for the caller to release. The target point is resolved after the
 * lift, because lifting an element can move the page underneath it.
 */
async function dragTo(page: Page, from: Locator, to: () => Promise<{ x: number; y: number }>): Promise<void> {
  await from.scrollIntoViewIfNeeded();
  const box = await from.boundingBox();
  if (!box) throw new Error("The drag source has no bounding box.");
  const x = box.x + Math.min(20, box.width / 2);
  const y = box.y + box.height / 2;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 8, y + 8, { steps: 5 });
  await page.waitForTimeout(100);
  const point = await to();
  await page.mouse.move(point.x, point.y, { steps: 16 });
  await page.mouse.move(point.x + 1, point.y + 1, { steps: 2 });
  await page.waitForTimeout(250);
}

/** Nudges the held pointer until the drop zone reports the pointer is over it. */
async function settleOver(page: Page, zone: Locator): Promise<void> {
  for (let i = 0; i < 12; i += 1) {
    if ((await zone.getAttribute("data-over")) === "true") return;
    const point = await centre(zone);
    await page.mouse.move(point.x + (i % 2 === 0 ? 1 : -1), point.y, { steps: 2 });
    await page.waitForTimeout(120);
  }
}

/**
 * Opens the first question of the given type. The paper is shuffled per
 * participant, so this starts at question one and walks forward.
 */
async function goToType(page: Page, type: QuestionType): Promise<void> {
  await page.goto("/assessment/ta/attempt?q=1");
  await expect(page.getByTestId("question-card")).toBeVisible();
  for (let step = 0; step < 10; step += 1) {
    if ((await currentType(page)) === type) return;
    if ((await currentQuestion(page)) >= 10) break;
    await nextQuestion(page);
  }
  throw new Error(`No ${type} question was found on this paper.`);
}

/** The element ids of the ordering list, top to bottom. */
async function orderingIds(page: Page): Promise<string[]> {
  return page
    .getByTestId("question-card")
    .locator('[data-testid^="ordering-item-"]')
    .evaluateAll((nodes) => nodes.map((node) => (node.getAttribute("data-testid") ?? "").replace("ordering-item-", "")));
}

test("ordering and matching by keyboard only", async ({ page, browserName }) => {
  test.setTimeout(300_000);

  await loginAsAdmin(page);
  const [participant] = await createParticipants(page, 1);
  await logout(page);
  await loginAsParticipant(page, participant.code, participant.password);
  await startAssessment(page, "ta");

  const card = page.getByTestId("question-card");

  // ---------- Ordering, by keyboard ----------
  await goToType(page, "ordering");
  let saves = await saveCount(page);
  const startOrder = await orderingIds(page);
  expect(startOrder.length).toBeGreaterThanOrEqual(3);

  const lifted = startOrder[0];
  await page.getByTestId(`ordering-handle-${lifted}`).focus();
  await press(page, "Shift+Tab", 80);
  await press(page, "Tab", 80);
  expect(await focusedTestId(page)).toBe(`ordering-handle-${lifted}`);

  await press(page, "Space");
  await press(page, "ArrowDown");
  await press(page, "Space", 400);

  const afterKeyboard = await orderingIds(page);
  expect(afterKeyboard).toEqual(moved(startOrder, 0, 1));
  expect(await focusedTestId(page)).toBe(`ordering-handle-${lifted}`);
  saves = await expectSaved(page, saves);

  // ---------- Ordering, by the move buttons with Enter ----------
  const mover = afterKeyboard[0];
  await page.getByTestId(`ordering-move-down-${mover}`).focus();
  await press(page, "Enter", 300);
  const afterMoveDown = await orderingIds(page);
  expect(afterMoveDown).toEqual(moved(afterKeyboard, 0, 1));
  saves = await expectSaved(page, saves);

  await page.getByTestId(`ordering-move-up-${mover}`).focus();
  await press(page, "Enter", 300);
  expect(await orderingIds(page)).toEqual(afterKeyboard);
  saves = await expectSaved(page, saves);
  await shot(page, browserName, "phase3-keyboard-ordering.png");

  // ---------- Ordering, by mouse ----------
  const beforeDrag = await orderingIds(page);
  const dropTarget = card.getByTestId(`ordering-item-${beforeDrag[2]}`);
  await dragTo(page, page.getByTestId(`ordering-handle-${beforeDrag[0]}`), async () => {
    const box = await dropTarget.boundingBox();
    if (!box) throw new Error("The ordering drop target has no bounding box.");
    return { x: box.x + 24, y: box.y + box.height * 0.8 };
  });
  if (browserName === "chromium") await page.screenshot({ path: "docs/evidence/phase3-drag-ordering.png" });
  await page.mouse.up();
  await page.waitForTimeout(400);
  const afterDrag = await orderingIds(page);
  expect(afterDrag).not.toEqual(beforeDrag);
  expect(afterDrag[0]).not.toBe(beforeDrag[0]);
  saves = await expectSaved(page, saves);

  // ---------- Matching, by keyboard only ----------
  await goToType(page, "matching");
  saves = await saveCount(page);
  const tokenIds = await card
    .locator('[data-testid^="matching-token-"]')
    .evaluateAll((nodes) => nodes.map((node) => (node.getAttribute("data-testid") ?? "").replace("matching-token-", "")));
  const bucketIds = await card
    .locator('[data-testid^="matching-bucket-"]')
    .evaluateAll((nodes) => nodes.map((node) => (node.getAttribute("data-testid") ?? "").replace("matching-bucket-", "")));
  expect(tokenIds.length).toBeGreaterThanOrEqual(4);
  expect(bucketIds.length).toBeGreaterThanOrEqual(3);

  const count = card.locator('[data-testid^="matching-count-"]');
  await expect(count).toHaveText(`0 of ${tokenIds.length} placed`);

  // Spread the tokens across the buckets: one Arrow press per step down the list.
  for (const [i, tokenId] of tokenIds.entries()) {
    const wanted = i % bucketIds.length;
    const select = card.getByTestId(`matching-select-${tokenId}`);
    await select.scrollIntoViewIfNeeded();
    await select.focus();
    expect(await focusedTestId(page)).toBe(`matching-select-${tokenId}`);
    for (let step = 0; step <= wanted; step += 1) await press(page, "ArrowDown", 120);
    await press(page, "Enter", 120);
    await expect(card.getByTestId(`matching-token-${tokenId}`)).toHaveAttribute("data-location", bucketIds[wanted]);
  }
  await expect(count).toHaveText(`${tokenIds.length} of ${tokenIds.length} placed`);
  saves = await expectSaved(page, saves);
  await shot(page, browserName, "phase3-keyboard-matching.png");

  // ---------- Matching, by mouse ----------
  const targetBucket = bucketIds[1];
  const dragged = tokenIds[0];
  const bucket = card.getByTestId(`matching-bucket-${targetBucket}`);
  await dragTo(page, card.getByTestId(`matching-drag-${dragged}`), () => centre(bucket));
  await settleOver(page, bucket);
  await expect(bucket).toHaveAttribute("data-over", "true");
  if (browserName === "chromium") await page.screenshot({ path: "docs/evidence/phase3-drag-matching.png" });
  await page.mouse.up();
  await page.waitForTimeout(400);
  await expect(card.getByTestId(`matching-token-${dragged}`)).toHaveAttribute("data-location", targetBucket);
  await expect(count).toHaveText(`${tokenIds.length} of ${tokenIds.length} placed`);
  await expectSaved(page, saves);
});
