import { eq } from "drizzle-orm";
import { beforeAll, describe, expect, it } from "vitest";
import { createMemoryDb, type Db } from "@/db/client";
import { auditLog, settings, users } from "@/db/schema";
import { makeDevBank } from "@/engine/dev-bank";
import { MODULES } from "@/engine/structure";
import { AttemptError, startAttempt } from "@/lib/attempts";
import type { AuditActor } from "@/lib/audit";
import { bootstrapAdmin } from "@/lib/auth";
import { loadBank } from "@/lib/bank-loader";
import {
  archiveJson,
  auditCsv,
  AUDIT_HEADERS,
  buildExport,
  closeAndExport,
  EXPORT_FILE_NAMES,
  itemAnalysisCsv,
  ITEM_ANALYSIS_HEADERS,
  resultsCsv,
  RESULTS_HEADERS,
  type ExportFile,
} from "@/lib/exports";
import { retireItem } from "@/lib/items-admin";
import { findPiiIdentifiers, findPiiInText } from "@/lib/pii-check";
import { generateSampleCohort } from "@/lib/sample-data";
import { EXERCISE_CLOSED_AT_KEY, isExerciseClosed } from "@/lib/settings";

const COUNT = 6;
const UUID_ANYWHERE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

async function adminActor(db: Db): Promise<AuditActor> {
  await bootstrapAdmin(db, "admin", "bootstrap-password-123");
  const row = await db.query.users.findFirst({ where: eq(users.role, "admin") });
  if (!row) throw new Error("admin missing");
  return { userId: row.id, username: row.username, role: "admin" };
}

/** Minimal RFC 4180 reader, enough to read back what src/lib/csv.ts writes. */
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    if (quoted) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 1;
        } else quoted = false;
      } else field += char;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\r") {
      // part of CRLF
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else field += char;
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

describe("exports", () => {
  let db: Db;
  let admin: AuditActor;

  beforeAll(async () => {
    db = await createMemoryDb();
    admin = await adminActor(db);
    await loadBank(db, makeDevBank({ bankVersion: 0 }), { freeze: true });
    await generateSampleCohort(db, admin, { participants: COUNT, seed: 5 });
    await retireItem(db, admin, "ta-01-a", "Sample retirement, so the export carries a retired item.");
  }, 240_000);

  it("writes one results row per participant per assessment with the documented headers", async () => {
    const file = await resultsCsv(db);
    const rows = parseCsv(file.content);
    expect(rows[0]).toEqual([...RESULTS_HEADERS]);
    expect(rows).toHaveLength(COUNT * 3 + 1);
    expect(file.rowCount).toBe(COUNT * 3);
    const header = rows[0];
    expect(header).toContain("section_1_score");
    expect(header).toContain("section_2_met");
    for (const definition of MODULES) expect(header).toContain(definition.id);

    const body = rows.slice(1);
    for (const row of body) {
      expect(row).toHaveLength(header.length);
      expect(row[0]).toMatch(/^participant-\d{2,}$/);
      // GIT-1 is gated by no assessment, so its column is always blank.
      expect(row[header.indexOf("GIT-1")]).toBe("");
    }
    const submitted = body.filter((row) => row[header.indexOf("status")] === "Submitted");
    expect(submitted.length).toBeGreaterThan(0);
    for (const row of submitted) {
      expect(row[header.indexOf("time_used_mmss")]).toMatch(/^\d{2}:\d{2}$/);
      // Every timestamp appears in Melbourne time with its zone and again as the raw ISO instant.
      expect(row[header.indexOf("submitted_at_melbourne")]).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2} [A-Z]+$/);
      expect(row[header.indexOf("submitted_at_iso")]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
    const taRows = body.filter((row) => row[header.indexOf("assessment")] === "ta" && row[header.indexOf("status")] === "Submitted");
    for (const row of taRows) {
      expect(["Prescribed", "Evidence review"]).toContain(row[header.indexOf("TA-1")]);
      // Only the assessment that gates a module fills that column.
      expect(row[header.indexOf("SQL-1")]).toBe("");
    }
  });

  it("writes one item analysis row per item in the frozen bank", async () => {
    const file = await itemAnalysisCsv(db);
    const rows = parseCsv(file.content);
    expect(rows[0]).toEqual([...ITEM_ANALYSIS_HEADERS]);
    expect(rows).toHaveLength(makeDevBank({ bankVersion: 0 }).items.length + 1);
    const retired = rows.slice(1).find((row) => row[0] === "ta-01-a");
    expect(retired?.[rows[0].indexOf("retired")]).toBe("Yes");
    expect(retired?.[rows[0].indexOf("retired_at_iso")]).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("writes the audit trail with participant codes instead of ids", async () => {
    const file = await auditCsv(db);
    const rows = parseCsv(file.content);
    expect(rows[0]).toEqual([...AUDIT_HEADERS]);
    expect(rows.length).toBeGreaterThan(1);
    const actions = rows.slice(1).map((row) => row[rows[0].indexOf("action")]);
    expect(actions).toContain("participants.bulk_created");
    expect(actions).toContain("attempt.reset");
    expect(actions).toContain("item.retired");
    const reset = rows.slice(1).find((row) => row[rows[0].indexOf("action")] === "attempt.reset");
    expect(reset?.[rows[0].indexOf("target")]).toMatch(/^participant-\d{2,} \w+ attempt \d+$/);
    expect(reset?.[rows[0].indexOf("reason")]).toBeTruthy();
  });

  it("holds no personal data and no user ids in any CSV", async () => {
    const files = [await resultsCsv(db), await itemAnalysisCsv(db), await auditCsv(db)];
    for (const file of files) {
      const [header] = parseCsv(file.content);
      expect(findPiiIdentifiers(header)).toEqual([]);
      expect(findPiiInText(file.content)).toEqual([]);
      expect(UUID_ANYWHERE.test(file.content)).toBe(false);
    }
    const archive = await archiveJson(db);
    expect(findPiiInText(archive.content)).toEqual([]);
  });

  it("archives every attempt, including the reset ones, with the served items resolved", async () => {
    const file = await archiveJson(db);
    const parsed: unknown = JSON.parse(file.content);
    expect(parsed).toBeTypeOf("object");
    const archive = parsed as {
      exportedAt: string;
      bankVersion: number;
      appVersion: string;
      participants: { code: string; userId: string }[];
      settings: { key: string }[];
      attempts: { status: string; participantCode: string; items: { itemId: string; payload: unknown }[] }[];
    };
    expect(Object.keys(archive).sort()).toEqual(["appVersion", "attempts", "bankVersion", "exportedAt", "participants", "settings"]);
    expect(archive.exportedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(archive.bankVersion).toBe(0);
    expect(archive.appVersion).toBeTruthy();
    expect(archive.participants).toHaveLength(COUNT);
    for (const participant of archive.participants) expect(participant.code).toMatch(/^participant-\d{2,}$/);
    expect(archive.settings.map((entry) => entry.key)).toContain("bank_version");
    expect(archive.attempts.length).toBeGreaterThan(0);
    expect(archive.attempts.some((attempt) => attempt.status === "void")).toBe(true);
    expect(file.rowCount).toBe(archive.attempts.length);
    const withItems = archive.attempts.find((attempt) => attempt.items.length > 0);
    expect(withItems).toBeDefined();
    expect(withItems!.items[0].payload).toBeTruthy();
  });

  it("records export.created with the file name and row count for every generated file", async () => {
    const before = (await db.select().from(auditLog).where(eq(auditLog.action, "export.created"))).length;
    const result = await closeAndExport(db, admin);
    expect(result.files.map((file) => file.name)).toEqual([...EXPORT_FILE_NAMES]);
    const after = await db.select().from(auditLog).where(eq(auditLog.action, "export.created"));
    expect(after.length).toBe(before + 4);
    const names = after.slice(-4).map((row) => row.targetId);
    expect(names).toEqual([...EXPORT_FILE_NAMES]);
    for (const row of after.slice(-4)) expect(row.details).toHaveProperty("rowCount");
  });

  it("closes the exercise once, keeping the first closure timestamp", async () => {
    const closed = await db.select().from(settings).where(eq(settings.key, EXERCISE_CLOSED_AT_KEY));
    expect(closed).toHaveLength(1);
    expect(await isExerciseClosed(db)).toBe(true);
    const first = closed[0].value;
    const again = await closeAndExport(db, admin);
    expect(again.closedNow).toBe(false);
    const closedAgain = await db.select().from(settings).where(eq(settings.key, EXERCISE_CLOSED_AT_KEY));
    expect(closedAgain[0].value).toBe(first);
    const closures = await db.select().from(auditLog).where(eq(auditLog.action, "exercise.closed"));
    expect(closures).toHaveLength(1);
  });

  it("refuses to start a new attempt once the exercise is closed", async () => {
    const row = await db.query.users.findFirst({ where: eq(users.username, "participant-06") });
    if (!row) throw new Error("participant-06 missing");
    const participant = { userId: row.id, username: row.username, participantNumber: row.participantNumber };
    await expect(startAttempt(db, participant, "python")).rejects.toBeInstanceOf(AttemptError);
    await expect(startAttempt(db, participant, "python")).rejects.toThrow(/exercise is closed/);
  });

  it("builds every named export file with its mime type", async () => {
    for (const name of EXPORT_FILE_NAMES) {
      const file: ExportFile = await buildExport(db, name);
      expect(file.name).toBe(name);
      expect(file.mimeType).toContain(name.endsWith(".json") ? "application/json" : "text/csv");
      expect(file.content.length).toBeGreaterThan(0);
    }
  });
});
