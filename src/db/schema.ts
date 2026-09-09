import { sql } from "drizzle-orm";
import { bigserial, boolean, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import type { Answers, BankItem, ItemPresentation, ModulePrescription, SectionScore, SeedInputs } from "@/engine/types";

/**
 * Privacy by anonymisation: there is deliberately no name, email, phone or
 * free-text profile column anywhere in this schema. Participants are numbered
 * codes. scripts/no-pii-check.ts asserts this against the live database.
 */

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    username: text("username").notNull(),
    role: text("role", { enum: ["admin", "participant"] }).notNull(),
    participantNumber: integer("participant_number"),
    passwordHash: text("password_hash").notNull(),
    passwordRegeneratedAt: timestamp("password_regenerated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastActivityAt: timestamp("last_activity_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("users_username_idx").on(t.username), uniqueIndex("users_participant_number_idx").on(t.participantNumber)],
);

export const items = pgTable(
  "items",
  {
    id: text("id").primaryKey(),
    bankVersion: integer("bank_version").notNull(),
    assessment: text("assessment").notNull(),
    section: text("section").notNull(),
    slot: integer("slot").notNull(),
    type: text("type").notNull(),
    /** The full authored item including keys, rationale and anchor. Server side only. */
    payload: jsonb("payload").$type<BankItem>().notNull(),
    retiredAt: timestamp("retired_at", { withTimezone: true }),
    retiredBy: uuid("retired_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("items_slot_idx").on(t.assessment, t.slot)],
);

export const attempts = pgTable(
  "attempts",
  {
    id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    assessmentId: text("assessment_id").notNull(),
    attemptNumber: integer("attempt_number").notNull(),
    status: text("status", { enum: ["in_progress", "submitted", "void"] }).notNull(),
    seed: text("seed").notNull(),
    seedInputs: jsonb("seed_inputs").$type<SeedInputs>().notNull(),
    bankVersion: integer("bank_version").notNull(),
    servedItemIds: jsonb("served_item_ids").$type<string[]>().notNull(),
    presentation: jsonb("presentation").$type<Record<string, ItemPresentation>>().notNull(),
    answers: jsonb("answers").$type<Answers>().notNull().default(sql`'{}'::jsonb`),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    lastSavedAt: timestamp("last_saved_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    submitKind: text("submit_kind", { enum: ["manual", "expired"] }),
    sectionScores: jsonb("section_scores").$type<SectionScore[]>(),
    prescriptions: jsonb("prescriptions").$type<ModulePrescription[]>(),
    shorthand: text("shorthand"),
    timeUsedSeconds: integer("time_used_seconds"),
    voidedAt: timestamp("voided_at", { withTimezone: true }),
    voidedBy: uuid("voided_by"),
    voidReason: text("void_reason"),
    statusBeforeVoid: text("status_before_void"),
  },
  (t) => [
    uniqueIndex("attempts_user_assessment_number_idx").on(t.userId, t.assessmentId, t.attemptNumber),
    index("attempts_user_idx").on(t.userId, t.assessmentId),
    index("attempts_status_idx").on(t.status, t.endAt),
  ],
);

export const auditLog = pgTable("audit_log", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  actorUserId: uuid("actor_user_id"),
  actorUsername: text("actor_username").notNull(),
  actorRole: text("actor_role").notNull(),
  action: text("action").notNull(),
  targetType: text("target_type"),
  targetId: text("target_id"),
  reason: text("reason"),
  details: jsonb("details").$type<Record<string, unknown>>(),
});

export const loginAttempts = pgTable(
  "login_attempts",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    username: text("username").notNull(),
    ip: text("ip").notNull(),
    at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
    success: boolean("success").notNull(),
  },
  (t) => [index("login_attempts_user_idx").on(t.username, t.at), index("login_attempts_ip_idx").on(t.ip, t.at)],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").$type<unknown>().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export type UserRow = typeof users.$inferSelect;
export type ItemRow = typeof items.$inferSelect;
export type AttemptRow = typeof attempts.$inferSelect;
export type AuditRow = typeof auditLog.$inferSelect;
