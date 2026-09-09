import fs from "node:fs";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { createParticipants, loginAsAdmin, loginAsParticipant, logout } from "./helpers";
import { startAssessment } from "./helpers/attempt";

/**
 * Phase 6 load sanity for the docs/02 capacity line: 20 concurrent users with instant response.
 *
 * Twenty participants are created and started through the real screens, then every one of them
 * autosaves and polls its attempt concurrently over HTTP for the configured duration, then all
 * twenty submit at the same instant. Afterwards every attempt is read back to confirm that each
 * acknowledged answer is stored and that each attempt is submitted exactly once.
 *
 * Chromium only, and skipped unless LOAD_SANITY=1, because it takes a couple of minutes.
 */

const PARTICIPANTS = Number(process.env.LOAD_PARTICIPANTS ?? 20);
const SECONDS = Number(process.env.LOAD_SECONDS ?? 60);

test.describe.configure({ mode: "serial" });
test.skip(process.env.LOAD_SANITY !== "1", "set LOAD_SANITY=1 to run the concurrency check");
test.skip(({ browserName }) => browserName !== "chromium", "one engine is enough for a load check");

interface Driver {
  code: string;
  api: APIRequestContext;
  attemptId: string;
  singleItems: Array<{ id: string; optionIds: string[] }>;
  acknowledged: Map<string, string>;
}

interface Sample {
  op: string;
  ms: number;
  ok: boolean;
}

function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((p / 100) * sorted.length))];
}

test("twenty participants autosave, poll and submit concurrently without loss", async ({ browser, playwright, baseURL }) => {
  test.setTimeout(15 * 60 * 1000);

  const admin = await browser.newPage();
  await loginAsAdmin(admin);
  const credentials = await createParticipants(admin, PARTICIPANTS);
  await logout(admin);
  await admin.close();
  expect(credentials).toHaveLength(PARTICIPANTS);

  // Sign each participant in and start an attempt through the real screens, then keep only the
  // session cookie so the concurrent phase is pure HTTP against the real routes.
  const drivers: Driver[] = [];
  for (const who of credentials) {
    const context = await browser.newContext();
    const page = await context.newPage();
    await loginAsParticipant(page, who.code, who.password);
    await startAssessment(page, "ta");
    const attemptId = await page.getByTestId("attempt-root").getAttribute("data-attempt-id");
    expect(attemptId, `${who.code} has no attempt id on the page`).toBeTruthy();

    const cookies = await context.cookies();
    const session = cookies.find((c) => c.name === "cp_session");
    expect(session, `${who.code} holds no session cookie`).toBeTruthy();
    const api = await playwright.request.newContext({
      baseURL,
      extraHTTPHeaders: { cookie: `cp_session=${session?.value ?? ""}` },
    });

    const view = await (await api.get(`/api/attempts/${attemptId}`)).json();
    const singleItems = (view.items as Array<{ id: string; type: string; options?: Array<{ id: string }> }>)
      .filter((i) => i.type === "single" && i.options)
      .map((i) => ({ id: i.id, optionIds: (i.options ?? []).map((o) => o.id) }));
    expect(singleItems.length).toBeGreaterThan(0);

    drivers.push({ code: who.code, api, attemptId: String(attemptId), singleItems, acknowledged: new Map() });
    await context.close();
  }

  const samples: Sample[] = [];
  async function timed(op: string, run: () => Promise<{ ok: () => boolean }>): Promise<{ ok: () => boolean }> {
    const started = process.hrtime.bigint();
    const res = await run();
    samples.push({ op, ms: Number(process.hrtime.bigint() - started) / 1e6, ok: res.ok() });
    return res;
  }

  const deadline = Date.now() + SECONDS * 1000;
  let round = 0;
  while (Date.now() < deadline) {
    const startedRound = Date.now();
    round += 1;
    await Promise.all(
      drivers.map(async (d) => {
        const item = d.singleItems[round % d.singleItems.length];
        const optionId = item.optionIds[round % item.optionIds.length];
        const save = await timed("autosave", () =>
          d.api.put(`/api/attempts/${d.attemptId}/answers/${item.id}`, { data: { type: "single", optionId } }),
        );
        if (save.ok()) d.acknowledged.set(item.id, optionId);
        await timed("poll", () => d.api.get(`/api/attempts/${d.attemptId}`));
      }),
    );
    // One round per participant per second, as docs/02's debounced autosave would produce.
    const spent = Date.now() - startedRound;
    if (spent < 1000) await new Promise((resolve) => setTimeout(resolve, 1000 - spent));
  }

  await Promise.all(drivers.map((d) => timed("submit", () => d.api.post(`/api/attempts/${d.attemptId}/submit`))));

  const problems: string[] = [];
  for (const d of drivers) {
    const view = await (await d.api.get(`/api/attempts/${d.attemptId}`)).json();
    if (view.status !== "submitted") problems.push(`${d.code}: status ${String(view.status)}`);
    for (const [itemId, optionId] of d.acknowledged) {
      const stored = (view.answers as Record<string, { optionId?: string }>)[itemId]?.optionId;
      if (stored !== optionId) problems.push(`${d.code}: ${itemId} holds ${String(stored)}, acknowledged ${optionId}`);
    }
    await d.api.dispose();
  }

  const ops = Array.from(new Set(samples.map((s) => s.op)));
  const failed = samples.filter((s) => !s.ok);
  const lines = [
    "# Load sanity",
    "",
    `Date: 2026-09-10. ${PARTICIPANTS} concurrent participants for ${SECONDS} seconds against the production build.`,
    "",
    "Every participant was created and started through the real screens, then autosaved an answer and polled",
    "its attempt once a second over HTTP, and all of them submitted at the same instant.",
    "",
    "| Operation | Requests | Failed | p50 ms | p95 ms | p99 ms |",
    "|---|---|---|---|---|---|",
    ...ops.map((op) => {
      const forOp = samples.filter((s) => s.op === op);
      const ms = forOp.map((s) => s.ms);
      return `| ${op} | ${forOp.length} | ${forOp.filter((s) => !s.ok).length} | ${percentile(ms, 50).toFixed(0)} | ${percentile(ms, 95).toFixed(0)} | ${percentile(ms, 99).toFixed(0)} |`;
    }),
    "",
    `Total requests: ${samples.length}. Failed: ${failed.length}.`,
    `Answers acknowledged and stored: ${drivers.reduce((n, d) => n + d.acknowledged.size, 0)}. Mismatches after the run: ${problems.length}.`,
    "",
    problems.length === 0
      ? "Every attempt finished submitted exactly once, and every answer the server acknowledged was still stored afterwards."
      : `Problems:\n${problems.map((p) => `- ${p}`).join("\n")}`,
  ];
  fs.mkdirSync("docs/evidence/phase6", { recursive: true });
  fs.writeFileSync("docs/evidence/phase6/load-sanity.md", `${lines.join("\n")}\n`, "utf8");

  expect(problems).toEqual([]);
  expect(failed.map((f) => f.op)).toEqual([]);
  expect(percentile(samples.filter((s) => s.op === "autosave").map((s) => s.ms), 99)).toBeLessThan(1000);
});
