import { eq, sql } from "drizzle-orm";
import { describe, expect, it } from "vitest";
import { createMemoryDb } from "@/db/client";
import { items, settings } from "@/db/schema";
import { makeDevBank } from "@/engine/dev-bank";
import type { Bank } from "@/engine/types";
import { BANK_FROZEN_AT_KEY, BANK_VERSION_KEY, getActiveItems, getBankVersion, loadBank } from "@/lib/bank-loader";

async function countItems(db: Awaited<ReturnType<typeof createMemoryDb>>): Promise<number> {
  const [row] = await db.select({ n: sql<number>`count(*)::int` }).from(items);
  return row.n;
}

describe("bank loader", () => {
  it("loads the dev bank: one row per item, nothing frozen", async () => {
    const db = await createMemoryDb();
    const bank = makeDevBank();
    const result = await loadBank(db, bank, { freeze: false });
    expect(result).toEqual({ inserted: 65, updated: 0, bankVersion: 0 });
    expect(await countItems(db)).toBe(65);
    expect(await getBankVersion(db)).toBeNull();
    const row = await db.query.items.findFirst({ where: eq(items.id, "ta-02-a") });
    expect(row?.type).toBe("ordering");
    expect(row?.section).toBe("fundamentals");
    expect(row?.payload).toEqual(bank.items.find((item) => item.id === "ta-02-a"));
  });

  it("freeze writes bank_version and bank_frozen_at settings", async () => {
    const db = await createMemoryDb();
    const before = Date.now();
    await loadBank(db, makeDevBank({ bankVersion: 3 }), { freeze: true });
    expect(await getBankVersion(db)).toBe(3);
    const frozen = await db.query.settings.findFirst({ where: eq(settings.key, BANK_FROZEN_AT_KEY) });
    expect(typeof frozen?.value).toBe("string");
    const at = Date.parse(String(frozen?.value));
    expect(at).toBeGreaterThanOrEqual(before - 1000);
    expect(at).toBeLessThanOrEqual(Date.now() + 1000);
    const version = await db.query.settings.findFirst({ where: eq(settings.key, BANK_VERSION_KEY) });
    expect(version?.value).toBe(3);
  });

  it("a second load updates in place without duplicating rows and keeps retired flags", async () => {
    const db = await createMemoryDb();
    const bank = makeDevBank();
    await loadBank(db, bank, { freeze: true });
    await db.update(items).set({ retiredAt: new Date() }).where(eq(items.id, "sql-02-b"));

    const changed: Bank = {
      bankVersion: 1,
      items: bank.items.map((item) => (item.id === "sql-02-b" ? { ...item, stem: `${item.stem} Revised.` } : item)),
    };
    const result = await loadBank(db, changed, { freeze: true });
    expect(result).toEqual({ inserted: 0, updated: 65, bankVersion: 1 });
    expect(await countItems(db)).toBe(65);
    const row = await db.query.items.findFirst({ where: eq(items.id, "sql-02-b") });
    expect(row?.payload.stem).toMatch(/Revised\.$/);
    expect(row?.bankVersion).toBe(1);
    expect(row?.retiredAt).not.toBeNull();
    expect(await getBankVersion(db)).toBe(1);
  });

  it("getActiveItems returns non-retired payloads for the assessment and bank version, ordered by id", async () => {
    const db = await createMemoryDb();
    await loadBank(db, makeDevBank(), { freeze: true });
    await db.update(items).set({ retiredAt: new Date() }).where(eq(items.id, "sql-02-b"));
    const active = await getActiveItems(db, "sql", 0);
    const ids = active.map((item) => item.id);
    expect(ids).not.toContain("sql-02-b");
    expect(ids).toContain("sql-02-a");
    expect(ids).toContain("sql-02-c");
    expect(active).toHaveLength(22);
    expect(ids).toEqual(ids.slice().sort());
    expect(active.every((item) => item.assessment === "sql")).toBe(true);
    expect(await getActiveItems(db, "sql", 99)).toEqual([]);
  });

  it("refuses an invalid bank and lists the problems", async () => {
    const db = await createMemoryDb();
    const bank = makeDevBank();
    const broken: Bank = { ...bank, items: bank.items.filter((item) => item.id !== "ta-01-a") };
    await expect(loadBank(db, broken, { freeze: true })).rejects.toThrow(/ta slot 1: has 1 item\(s\), needs at least 2/);
    expect(await countItems(db)).toBe(0);
    expect(await getBankVersion(db)).toBeNull();
  });
});
