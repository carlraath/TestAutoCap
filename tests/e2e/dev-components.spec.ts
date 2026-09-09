import { expect, test, type Locator, type Page } from "@playwright/test";
import type { Answer, MatchingAnswer, OrderingAnswer } from "@/engine/types";

/**
 * Exercises the participant interaction components on the development harness
 * at /dev/components. Runs only when E2E_DEV_URL points at a running `next dev`
 * (the harness is a 404 in production), for example:
 *   E2E_DEV_URL=http://localhost:3020 E2E_BASE_URL=http://localhost:3020 npx playwright test tests/e2e/dev-components.spec.ts --project=chromium
 */

const DEV_URL = process.env.E2E_DEV_URL;
const ORD = "dev-ta-02";
const MAT = "dev-ta-09";

test.skip(!DEV_URL, "Set E2E_DEV_URL to a running next dev server to run the component harness tests.");

function moved<T>(list: T[], from: number, to: number): T[] {
  const next = list.slice();
  const [x] = next.splice(from, 1);
  next.splice(to, 0, x);
  return next;
}

async function readAnswer(page: Page, itemId: string): Promise<Answer | null> {
  const text = (await page.getByTestId(`answer-${itemId}`).innerText()).trim();
  return text === "(no answer yet)" ? null : (JSON.parse(text) as Answer);
}

async function arrangement(page: Page): Promise<string[]> {
  const a = (await readAnswer(page, ORD)) as OrderingAnswer | null;
  expect(a?.type).toBe("ordering");
  return a?.arrangement ?? [];
}

async function placements(page: Page): Promise<Record<string, string | null>> {
  const a = (await readAnswer(page, MAT)) as MatchingAnswer | null;
  expect(a?.type).toBe("matching");
  return a?.placements ?? {};
}

async function listIds(page: Page): Promise<string[]> {
  return page.$$eval('[data-testid^="ordering-item-"]', (els) => els.map((e) => (e.getAttribute("data-testid") ?? "").replace("ordering-item-", "")));
}

async function focusedTestId(page: Page): Promise<string> {
  return page.evaluate(() => document.activeElement?.getAttribute("data-testid") ?? "none");
}

async function press(page: Page, key: string, wait = 150): Promise<void> {
  await page.keyboard.press(key);
  await page.waitForTimeout(wait);
}

/** Starts a pointer drag from a locator and moves to a point; the caller releases with page.mouse.up(). */
async function dragByMouse(page: Page, from: Locator, to: { x: number; y: number }): Promise<void> {
  const box = await from.boundingBox();
  if (!box) throw new Error("Drag source has no bounding box");
  const sx = box.x + Math.min(20, box.width / 2);
  const sy = box.y + box.height / 2;
  await page.mouse.move(sx, sy);
  await page.mouse.down();
  await page.mouse.move(sx + 6, sy + 6, { steps: 4 });
  await page.mouse.move(to.x, to.y, { steps: 14 });
  await page.waitForTimeout(150);
}

async function centre(locator: Locator): Promise<{ x: number; y: number }> {
  const box = await locator.boundingBox();
  if (!box) throw new Error("Element has no bounding box");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

test.describe("participant components harness", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${DEV_URL}/dev/components?timer=100`, { waitUntil: "networkidle" });
  });

  test("ordering: mouse drag reorders and an abandoned drag leaves state unchanged", async ({ page }) => {
    await page.getByTestId(`ordering-${ORD}`).scrollIntoViewIfNeeded();
    expect(await readAnswer(page, ORD)).toBeNull();
    const before = await listIds(page);
    expect(before).toEqual(["e3", "e1", "e4", "e2"]);

    const target = await page.getByTestId(`ordering-item-${before[1]}`).boundingBox();
    if (!target) throw new Error("No target box");
    await dragByMouse(page, page.getByTestId(`ordering-handle-${before[0]}`), { x: target.x + 24, y: target.y + target.height * 0.9 });
    await page.mouse.up();
    await page.waitForTimeout(400);
    expect(await arrangement(page)).toEqual(moved(before, 0, 1));
    expect(await listIds(page)).toEqual(moved(before, 0, 1));

    const current = await arrangement(page);
    const handle = page.getByTestId(`ordering-handle-${current[2]}`);
    const hb = await handle.boundingBox();
    if (!hb) throw new Error("No handle box");
    await dragByMouse(page, handle, { x: hb.x + 24, y: hb.y - 90 });
    await press(page, "Escape");
    await page.mouse.up();
    await page.waitForTimeout(300);
    expect(await arrangement(page)).toEqual(current);
  });

  test("ordering: keyboard only (Tab, Space, ArrowDown, Space) and Escape cancels", async ({ page }) => {
    await page.getByTestId(`ordering-${ORD}`).scrollIntoViewIfNeeded();
    const before = await listIds(page);
    const id = before[1];
    await page.getByTestId(`ordering-handle-${id}`).focus();
    await press(page, "Shift+Tab", 50);
    await press(page, "Tab", 50);
    expect(await focusedTestId(page)).toBe(`ordering-handle-${id}`);

    await press(page, "Space");
    await press(page, "ArrowDown");
    await press(page, "Space", 500);
    const after = await arrangement(page);
    expect(after).toEqual(moved(before, 1, 2));
    await expect(page.getByTestId(`ordering-live-${ORD}`)).toHaveText(/Moved .+ to position 3 of 4/);
    expect(await focusedTestId(page)).toBe(`ordering-handle-${id}`);

    await page.getByTestId(`ordering-handle-${after[0]}`).focus();
    await press(page, "Space");
    await press(page, "ArrowDown");
    await press(page, "Escape", 400);
    expect(await arrangement(page)).toEqual(after);
    const hidden = await page.$$eval('[data-testid^="ordering-item-"] > div', (els) => els.filter((e) => e.className.includes("invisible")).length);
    expect(hidden).toBe(0);
  });

  test("ordering: move buttons reorder, disable at the ends and keep focus", async ({ page }) => {
    await page.getByTestId(`ordering-${ORD}`).scrollIntoViewIfNeeded();
    const before = await listIds(page);
    await expect(page.getByTestId(`ordering-move-up-${before[0]}`)).toBeDisabled();
    await expect(page.getByTestId(`ordering-move-down-${before[3]}`)).toBeDisabled();

    await page.getByTestId(`ordering-move-down-${before[0]}`).click();
    await page.waitForTimeout(200);
    expect(await arrangement(page)).toEqual(moved(before, 0, 1));
    expect(await focusedTestId(page)).toBe(`ordering-move-down-${before[0]}`);

    const last = before[3];
    for (let i = 0; i < 3; i += 1) {
      await page.getByTestId(`ordering-move-up-${last}`).click();
      await page.waitForTimeout(120);
    }
    expect((await arrangement(page))[0]).toBe(last);
    expect(await focusedTestId(page)).toBe(`ordering-move-down-${last}`);

    const positions = await page.$$eval('[data-testid^="ordering-item-"] span[aria-hidden]', (els) =>
      els.map((e) => (e.textContent ?? "").trim()).filter((t) => /^\d$/.test(t)),
    );
    expect(positions).toEqual(["1", "2", "3", "4"]);
  });

  test("matching: drag onto a bucket, between buckets, drop outside, keyboard drag", async ({ page }) => {
    await page.getByTestId(`matching-${MAT}`).scrollIntoViewIfNeeded();
    expect(await readAnswer(page, MAT)).toBeNull();
    await expect(page.getByTestId(`matching-count-${MAT}`)).toHaveText("0 of 5 placed");

    const bucket = page.getByTestId("matching-bucket-b1");
    await dragByMouse(page, page.getByTestId("matching-drag-t1"), await centre(bucket));
    await expect(bucket).toHaveAttribute("data-over", "true");
    await page.mouse.up();
    await page.waitForTimeout(400);
    let p = await placements(page);
    expect(p.t1).toBe("b1");
    expect(Object.keys(p).sort()).toEqual(["t1", "t2", "t3", "t4", "t5"]);
    await expect(page.getByTestId("matching-token-t1")).toHaveAttribute("data-location", "b1");
    await expect(page.getByTestId(`matching-count-${MAT}`)).toHaveText("1 of 5 placed");

    const before = JSON.stringify(p);
    const d2 = await page.getByTestId("matching-drag-t4").boundingBox();
    if (!d2) throw new Error("No token box");
    await dragByMouse(page, page.getByTestId("matching-drag-t4"), { x: 30, y: d2.y + 10 });
    await page.mouse.up();
    await page.waitForTimeout(300);
    expect(JSON.stringify(await placements(page))).toBe(before);

    await page.getByTestId(`matching-${MAT}`).scrollIntoViewIfNeeded();
    await dragByMouse(page, page.getByTestId("matching-drag-t1"), await centre(page.getByTestId("matching-bucket-b2")));
    await page.mouse.up();
    await page.waitForTimeout(300);
    p = await placements(page);
    expect(p.t1).toBe("b2");

    await page.getByTestId("matching-drag-t4").focus();
    await press(page, "Space");
    await press(page, "ArrowDown");
    await press(page, "Space", 400);
    p = await placements(page);
    expect(p.t4).toBe("b1");
  });

  test("matching: selects place every token, return to tray, count and review tile follow", async ({ page }) => {
    await page.getByTestId(`matching-${MAT}`).scrollIntoViewIfNeeded();
    const plan: Record<string, string> = { t1: "b1", t2: "b2", t3: "b3", t4: "b4", t5: "b2" };
    for (const [tokenId, bucketId] of Object.entries(plan)) {
      await page.getByTestId(`matching-select-${tokenId}`).selectOption(bucketId);
      await page.waitForTimeout(150);
    }
    expect(await placements(page)).toEqual(plan);
    await expect(page.getByTestId(`matching-count-${MAT}`)).toHaveText("5 of 5 placed");
    expect(await focusedTestId(page)).toBe("matching-select-t5");
    await expect(page.getByTestId("review-tile-4")).toHaveAttribute("data-answered", "true");

    await page.getByTestId("matching-return-t3").click();
    await page.waitForTimeout(200);
    expect((await placements(page)).t3).toBeNull();
    await expect(page.getByTestId("matching-token-t3")).toHaveAttribute("data-location", "tray");
    await expect(page.getByTestId(`matching-count-${MAT}`)).toHaveText("4 of 5 placed");
    await expect(page.getByTestId(`matching-live-${MAT}`)).toHaveText(/Returned .* to the tray\. 4 of 5 placed\./);
    await expect(page.getByTestId("review-tile-4")).toHaveAttribute("data-answered", "false");

    await page.getByTestId("matching-select-t5").selectOption("");
    await page.waitForTimeout(150);
    expect((await placements(page)).t5).toBeNull();
  });

  test("timer: amber under two minutes, fixed size, expires once at 00:00", async ({ page }) => {
    const chip = page.getByTestId("timer-chip").first();
    await expect(chip).toHaveAttribute("data-state", "attention");
    await expect(chip).toHaveText(/01:[0-3]\d/);
    const colours = await chip.evaluate((el) => [getComputedStyle(el).color, getComputedStyle(el).backgroundColor, getComputedStyle(el).borderColor].join(" / "));
    expect(colours).toBe("rgb(178, 106, 0) / rgb(255, 255, 255) / rgb(178, 106, 0)");
    const box1 = await chip.boundingBox();
    await page.waitForTimeout(1200);
    const box2 = await chip.boundingBox();
    expect(box2?.width).toBe(box1?.width);
    expect(box2?.height).toBe(box1?.height);

    await page.goto(`${DEV_URL}/dev/components?timer=2`, { waitUntil: "networkidle" });
    await expect(page.getByTestId("timer-chip").first()).toHaveText("00:00", { timeout: 6_000 });
    await expect(page.getByTestId("timer-expired")).toHaveText("Expired");
  });

  test("single, multi and stem rendering", async ({ page }) => {
    await page.getByTestId("single-option-dev-sql-02-b").click();
    expect(await readAnswer(page, "dev-sql-02")).toEqual({ type: "single", optionId: "b" });
    await press(page, "ArrowDown", 100);
    expect(await readAnswer(page, "dev-sql-02")).toEqual({ type: "single", optionId: "c" });

    await page.getByTestId("multi-option-dev-ta-05-d").click();
    await page.getByTestId("multi-option-dev-ta-05-b").click();
    await page.getByTestId("multi-option-dev-ta-05-e").click();
    expect(await readAnswer(page, "dev-ta-05")).toEqual({ type: "multi", optionIds: ["b", "d", "e"] });
    await page.getByTestId("multi-option-dev-ta-05-d").click();
    expect(await readAnswer(page, "dev-ta-05")).toEqual({ type: "multi", optionIds: ["b", "e"] });
    await expect(page.locator('[data-testid="multi-dev-ta-05"] > p')).toHaveText("Select all that apply.");

    expect(await page.locator(".stem a").count()).toBe(0);
    expect(await page.locator(".stem b").count()).toBe(0);
    expect(await page.locator(".stem pre > code").count()).toBeGreaterThanOrEqual(1);
    expect(await page.locator(".stem table").count()).toBeGreaterThanOrEqual(2);
    expect(await page.locator(".stem").first().evaluate((el) => el.firstElementChild?.tagName)).toBe("P");
  });

  test("disabled prop switches every control off", async ({ page }) => {
    await page.getByTestId("harness-disabled").check();
    await expect(page.getByTestId("ordering-move-down-e3")).toBeDisabled();
    await expect(page.getByTestId("matching-select-t1")).toBeDisabled();
    await expect(page.getByTestId("nav-next")).toBeDisabled();
  });
});
