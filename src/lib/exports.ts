/**
 * The four export files of docs/02: results CSV (one row per participant per
 * assessment), item analysis CSV, audit log CSV and a JSON archive of full
 * attempt detail, plus "Close and export" which stops new attempts and produces
 * all four.
 *
 * Column rules held here, deliberately, in one place:
 *   - Participant codes only. No user id ever reaches a CSV; the JSON archive
 *     may carry the opaque uuids because it is the audit archive.
 *   - Every timestamp appears twice: formatted for Melbourne with its zone
 *     suffix, and as the raw ISO instant in the neighbouring column.
 *   - Section results are flattened to section_1_* and section_2_*.
 *   - One column per module, TA-1 to GIT-1, carrying the outcome when the row's
 *     assessment gates that module and blank when it does not.
 *   - The reporting shorthand appears only once all three assessments are
 *     submitted. It is never shown to participants.
 */
import { asc, eq } from "drizzle-orm";
import type { Db } from "@/db/client";
import { auditLog, attempts, items, settings, users } from "@/db/schema";
import { MODULES } from "@/engine/structure";
import type { Answer, BankItem, ItemPresentation, ModuleOutcome, SectionScore } from "@/engine/types";
import { audit, type AuditActor } from "./audit";
import { getBankVersion } from "./bank-loader";
import { toCsv, type CsvValue } from "./csv";
import { itemAnalysis, loadAuditIdMap, resolveAuditId, resultsTable, type AuditIdMap, type ItemDistribution } from "./reports";
import { EXERCISE_CLOSED_AT_KEY, getSetting, setSetting } from "./settings";
import { formatMelbourneDateTimeWithZone } from "./time";

/** Recorded in the archive header. Set APP_VERSION in the environment at deploy time to override. */
export const APP_VERSION = process.env.APP_VERSION?.trim() || "0.1.0";

export type ExportFileName = "results.csv" | "item-analysis.csv" | "audit-log.csv" | "archive.json";

export const EXPORT_FILE_NAMES: readonly ExportFileName[] = ["results.csv", "item-analysis.csv", "audit-log.csv", "archive.json"] as const;

export interface ExportFile {
  name: ExportFileName;
  mimeType: string;
  content: string;
  /** Data rows in the file: CSV rows excluding the header, attempts in the archive. */
  rowCount: number;
}

const CSV_MIME = "text/csv; charset=utf-8";
const JSON_MIME = "application/json; charset=utf-8";

export function isExportFileName(value: string): value is ExportFileName {
  return (EXPORT_FILE_NAMES as readonly string[]).includes(value);
}

const OUTCOME_LABELS: Record<ModuleOutcome, string> = {
  prescribed: "Prescribed",
  credited: "Credited",
  evidence_review: "Evidence review",
  not_assessed: "Not assessed",
};

/** "07:12" from 432 seconds. Blank when the attempt has no recorded time. */
function mmss(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds)) return "";
  const total = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

/** A timestamp as the Melbourne display string and the raw ISO instant, for two neighbouring columns. */
function timePair(at: Date | null): [string, string] {
  return at ? [formatMelbourneDateTimeWithZone(at), at.toISOString()] : ["", ""];
}

function sectionCells(scores: SectionScore[] | null, index: number): CsvValue[] {
  const score = scores?.[index];
  if (!score) return ["", "", "", "", ""];
  return [score.section, score.score, score.served, score.threshold, score.met ? "Yes" : "No"];
}

// ---------------------------------------------------------------- results.csv

export const RESULTS_HEADERS: readonly string[] = [
  "participant_code",
  "assessment",
  "assessment_title",
  "status",
  "attempt_number",
  "reset_count",
  // The section columns are titled section_N_title rather than section_N_name because
  // src/lib/pii-check.ts treats "name" as a personal-data token in any export header.
  "section_1_title",
  "section_1_score",
  "section_1_served",
  "section_1_threshold",
  "section_1_met",
  "section_2_title",
  "section_2_score",
  "section_2_served",
  "section_2_threshold",
  "section_2_met",
  ...MODULES.map((module) => module.id),
  "shorthand",
  "time_used_seconds",
  "time_used_mmss",
  "seed",
  "bank_version",
  "submit_kind",
  "submitted_at_melbourne",
  "submitted_at_iso",
];

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  submitted: "Submitted",
  void: "Reset",
};

/** One row per participant per assessment, participant codes only. */
export async function resultsCsv(db: Db): Promise<ExportFile> {
  const { rows, participants } = await resultsTable(db);
  const planByUser = new Map(participants.map((participant) => [participant.userId, participant] as const));

  const body: CsvValue[][] = rows.map((row) => {
    const outcomes = new Map((row.prescriptions ?? []).map((prescription) => [prescription.module, prescription.outcome] as const));
    const participant = planByUser.get(row.userId);
    const [submittedMelbourne, submittedIso] = timePair(row.submittedAt);
    return [
      row.code,
      row.assessment,
      row.assessmentTitle,
      STATUS_LABELS[row.status] ?? row.status,
      row.attemptNumber,
      row.resetCount,
      ...sectionCells(row.sectionScores, 0),
      ...sectionCells(row.sectionScores, 1),
      ...MODULES.map((module) => {
        const outcome = outcomes.get(module.id);
        return outcome ? OUTCOME_LABELS[outcome] : "";
      }),
      participant?.allSubmitted ? (participant.shorthand ?? "") : "",
      row.timeUsedSeconds,
      mmss(row.timeUsedSeconds),
      row.seed,
      row.bankVersion,
      row.submitKind ?? "",
      submittedMelbourne,
      submittedIso,
    ];
  });

  return { name: "results.csv", mimeType: CSV_MIME, content: toCsv([...RESULTS_HEADERS], body), rowCount: body.length };
}

// ---------------------------------------------------------------- item-analysis.csv

export const ITEM_ANALYSIS_HEADERS: readonly string[] = [
  "item_id",
  "assessment",
  "section",
  "slot",
  "type",
  "attempts",
  "correct",
  "facility_percent",
  "distribution",
  "outlier",
  "outlier_reason",
  "retired",
  "retired_at_melbourne",
  "retired_at_iso",
];

/** Renders an answer distribution as one compact cell. */
function distributionCell(distribution: ItemDistribution): string {
  if (distribution.kind === "options") {
    const parts = distribution.options.map((option) => `${option.id}${option.isKey ? "*" : ""}: ${option.count}`);
    return `${parts.join("; ")}; unanswered: ${distribution.unanswered}`;
  }
  const top = distribution.topIncorrect.map((entry) => `${entry.label} x${entry.count}`).join("; ");
  return `correct: ${distribution.correct}; incorrect: ${distribution.incorrect}; unanswered: ${distribution.unanswered}${top ? `; commonest wrong: ${top}` : ""}`;
}

/** Per-item attempts, facility and answer distribution, with outliers and their reason. */
export async function itemAnalysisCsv(db: Db): Promise<ExportFile> {
  const analysis = await itemAnalysis(db);
  const body: CsvValue[][] = analysis.rows.map((row) => {
    const [retiredMelbourne, retiredIso] = timePair(row.retiredAt);
    return [
      row.itemId,
      row.assessment,
      row.section,
      row.slot,
      row.type,
      row.attempts,
      row.correct,
      row.facility === null ? "" : Math.round(row.facility * 100),
      distributionCell(row.distribution),
      row.outlier ? "Yes" : "No",
      row.outlierReasons.join(" "),
      row.retired ? "Yes" : "No",
      retiredMelbourne,
      retiredIso,
    ];
  });
  return { name: "item-analysis.csv", mimeType: CSV_MIME, content: toCsv([...ITEM_ANALYSIS_HEADERS], body), rowCount: body.length };
}

// ---------------------------------------------------------------- audit-log.csv

export const AUDIT_HEADERS: readonly string[] = [
  "at_melbourne",
  "at_iso",
  "actor",
  "actor_role",
  "action",
  "target_type",
  "target",
  "reason",
  "details",
];

/** Rewrites every uuid inside an audit details object into its participant code. */
function scrubDetails(value: unknown, map: AuditIdMap): unknown {
  if (typeof value === "string") return resolveAuditId(map, value);
  if (Array.isArray(value)) return value.map((entry) => scrubDetails(entry, map));
  if (value !== null && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) out[key] = scrubDetails(entry, map);
    return out;
  }
  return value;
}

/** The full audit trail, oldest first, with every id resolved to a participant code. */
export async function auditCsv(db: Db): Promise<ExportFile> {
  const map = await loadAuditIdMap(db);
  const rows = await db.select().from(auditLog).orderBy(asc(auditLog.id));
  const body: CsvValue[][] = rows.map((row) => {
    const [melbourne, iso] = timePair(row.at);
    return [
      melbourne,
      iso,
      row.actorUsername,
      row.actorRole,
      row.action,
      row.targetType ?? "",
      row.targetId ? resolveAuditId(map, row.targetId) : "",
      row.reason ?? "",
      row.details ? JSON.stringify(scrubDetails(row.details, map)) : "",
    ];
  });
  return { name: "audit-log.csv", mimeType: CSV_MIME, content: toCsv([...AUDIT_HEADERS], body), rowCount: body.length };
}

// ---------------------------------------------------------------- archive.json

export interface ArchiveItem {
  position: number;
  itemId: string;
  presentation: ItemPresentation;
  answer: Answer | null;
  /** The authored item as served, including its key, rationale and source anchor. */
  payload: BankItem | null;
}

export interface ArchiveAttempt {
  attemptId: string;
  participantCode: string;
  participantNumber: number | null;
  assessment: string;
  attemptNumber: number;
  status: string;
  seed: string;
  seedInputs: unknown;
  bankVersion: number;
  startedAt: string;
  endAt: string;
  submittedAt: string | null;
  submitKind: string | null;
  timeUsedSeconds: number | null;
  sectionScores: SectionScore[] | null;
  prescriptions: unknown;
  voidedAt: string | null;
  voidReason: string | null;
  statusBeforeVoid: string | null;
  items: ArchiveItem[];
}

export interface Archive {
  exportedAt: string;
  bankVersion: number | null;
  appVersion: string;
  participants: { userId: string; code: string; number: number | null; createdAt: string; lastActivityAt: string | null }[];
  settings: { key: string; value: unknown; updatedAt: string }[];
  attempts: ArchiveAttempt[];
}

/**
 * The full attempt archive: every attempt including the void (reset) ones with
 * its served items resolved to their payloads, the participants as codes, the
 * settings, and a header naming the export time, bank version and app version.
 * No password hashes and no personal data: there is none to carry.
 */
export async function archiveJson(db: Db): Promise<ExportFile> {
  const people = await db
    .select({ id: users.id, username: users.username, participantNumber: users.participantNumber, createdAt: users.createdAt, lastActivityAt: users.lastActivityAt })
    .from(users)
    .where(eq(users.role, "participant"))
    .orderBy(asc(users.participantNumber));
  const codeById = new Map(people.map((person) => [person.id, person] as const));

  const rows = await db.select().from(attempts).orderBy(asc(attempts.userId), asc(attempts.assessmentId), asc(attempts.attemptNumber));
  const payloadRows = await db.select({ id: items.id, payload: items.payload }).from(items);
  const payloads = new Map(payloadRows.map((row) => [row.id, row.payload] as const));

  const archiveAttempts: ArchiveAttempt[] = rows.map((row) => {
    const person = codeById.get(row.userId);
    return {
      attemptId: row.id,
      participantCode: person?.username ?? "unknown",
      participantNumber: person?.participantNumber ?? null,
      assessment: row.assessmentId,
      attemptNumber: row.attemptNumber,
      status: row.status,
      seed: row.seed,
      seedInputs: row.seedInputs,
      bankVersion: row.bankVersion,
      startedAt: row.startedAt.toISOString(),
      endAt: row.endAt.toISOString(),
      submittedAt: row.submittedAt?.toISOString() ?? null,
      submitKind: row.submitKind,
      timeUsedSeconds: row.timeUsedSeconds,
      sectionScores: row.sectionScores,
      prescriptions: row.prescriptions,
      voidedAt: row.voidedAt?.toISOString() ?? null,
      voidReason: row.voidReason,
      statusBeforeVoid: row.statusBeforeVoid,
      items: row.servedItemIds.map((itemId, index) => ({
        position: index + 1,
        itemId,
        presentation: row.presentation[itemId] ?? {},
        answer: row.answers[itemId] ?? null,
        payload: payloads.get(itemId) ?? null,
      })),
    };
  });

  const settingRows = await db.select().from(settings).orderBy(asc(settings.key));

  const archive: Archive = {
    exportedAt: new Date().toISOString(),
    bankVersion: await getBankVersion(db),
    appVersion: APP_VERSION,
    participants: people.map((person) => ({
      userId: person.id,
      code: person.username,
      number: person.participantNumber,
      createdAt: person.createdAt.toISOString(),
      lastActivityAt: person.lastActivityAt?.toISOString() ?? null,
    })),
    settings: settingRows.map((row) => ({ key: row.key, value: row.value, updatedAt: row.updatedAt.toISOString() })),
    attempts: archiveAttempts,
  };

  return { name: "archive.json", mimeType: JSON_MIME, content: `${JSON.stringify(archive, null, 2)}\n`, rowCount: archiveAttempts.length };
}

// ---------------------------------------------------------------- generation and close

const BUILDERS: Record<ExportFileName, (db: Db) => Promise<ExportFile>> = {
  "results.csv": resultsCsv,
  "item-analysis.csv": itemAnalysisCsv,
  "audit-log.csv": auditCsv,
  "archive.json": archiveJson,
};

/** Builds one export file without recording anything. Used by tests and by generateExport. */
export async function buildExport(db: Db, name: ExportFileName): Promise<ExportFile> {
  return BUILDERS[name](db);
}

/** Builds one export file and records export.created with the file name and its row count. */
export async function generateExport(db: Db, actor: AuditActor, name: ExportFileName): Promise<ExportFile> {
  const file = await buildExport(db, name);
  await audit(db, actor, "export.created", { targetType: "export", targetId: file.name, details: { file: file.name, rowCount: file.rowCount } });
  return file;
}

export interface CloseAndExportResult {
  closedAt: Date;
  /** True when this call recorded the closure; false when the exercise was already closed. */
  closedNow: boolean;
  files: ExportFile[];
}

/**
 * Closes the exercise and produces all four exports. Idempotent: the first
 * closure timestamp stands, a second call re-exports without moving it. Once
 * closed, startAttempt refuses to start anything new (src/lib/attempts.ts reads
 * isExerciseClosed).
 */
export async function closeAndExport(db: Db, admin: AuditActor): Promise<CloseAndExportResult> {
  if (admin.role !== "admin") throw new Error("Only an administrator can close the exercise.");
  const existing = await getSetting(db, EXERCISE_CLOSED_AT_KEY);
  let closedAt: Date;
  let closedNow = false;
  if (typeof existing === "string" && !Number.isNaN(new Date(existing).getTime())) {
    closedAt = new Date(existing);
  } else {
    closedAt = new Date();
    await setSetting(db, EXERCISE_CLOSED_AT_KEY, closedAt.toISOString());
    closedNow = true;
    await audit(db, admin, "exercise.closed", { targetType: "exercise", details: { closedAt: closedAt.toISOString() } });
  }
  const files: ExportFile[] = [];
  for (const name of EXPORT_FILE_NAMES) files.push(await generateExport(db, admin, name));
  return { closedAt, closedNow, files };
}
