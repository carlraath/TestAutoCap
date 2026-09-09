/**
 * Engine contracts. Pure types shared by the engine, the database layer, the
 * participant UI and the admin reporting. Keep this file dependency-free.
 */

export type AssessmentId = "ta" | "sql" | "python";
export type SectionId = "fundamentals" | "foundations" | "applied" | "core" | "testing";
export type ItemType = "single" | "multi" | "ordering" | "matching";
export type Difficulty = "standard";

// ---------- Bank (server side, includes keys) ----------

export interface ItemBase {
  id: string;
  assessment: AssessmentId;
  section: SectionId;
  slot: number;
  type: ItemType;
  /** Markdown. Fenced code and pipe tables permitted. */
  stem: string;
  difficulty: Difficulty;
  /** Never shown to participants. */
  rationale: string;
  /** Never shown to participants. */
  sourceAnchor: string;
}

export interface OptionDef {
  id: string;
  text: string;
  correct: boolean;
}

export interface SingleItem extends ItemBase {
  type: "single";
  /** Exactly 4 options, exactly 1 correct. */
  options: OptionDef[];
  fixedOrder?: boolean;
}

export interface MultiItem extends ItemBase {
  type: "multi";
  /** 5 or 6 options, 2 or 3 correct. Rendered with the label "Select all that apply." */
  options: OptionDef[];
  fixedOrder?: boolean;
}

export interface OrderingElement {
  id: string;
  text: string;
}

export interface OrderingItem extends ItemBase {
  type: "ordering";
  /** 3 to 5 elements in authored order. */
  elements: OrderingElement[];
  /** The single canonical sequence of element ids. */
  key: string[];
}

export interface MatchingBucket {
  id: string;
  label: string;
}

export interface MatchingToken {
  id: string;
  text: string;
  /** The bucket id this token belongs to. */
  bucket: string;
}

export interface MatchingItem extends ItemBase {
  type: "matching";
  /** 3 or 4 buckets. */
  buckets: MatchingBucket[];
  /** 4 to 6 tokens. */
  tokens: MatchingToken[];
}

export type BankItem = SingleItem | MultiItem | OrderingItem | MatchingItem;

export interface Bank {
  bankVersion: number;
  items: BankItem[];
}

// ---------- Served items (client safe: no keys, no rationale, no anchor) ----------

export interface ServedOption {
  id: string;
  text: string;
}

export interface ServedSingle {
  id: string;
  type: "single";
  slot: number;
  stem: string;
  /** Already in presentation order. */
  options: ServedOption[];
}

export interface ServedMulti {
  id: string;
  type: "multi";
  slot: number;
  stem: string;
  /** Already in presentation order. */
  options: ServedOption[];
}

export interface ServedOrdering {
  id: string;
  type: "ordering";
  slot: number;
  stem: string;
  /** Authored order, for label lookup. */
  elements: OrderingElement[];
  /** The engine-shuffled starting arrangement. Never equals the key. */
  initialArrangement: string[];
}

export interface ServedMatching {
  id: string;
  type: "matching";
  slot: number;
  stem: string;
  buckets: MatchingBucket[];
  /** Token ids and text only, in tray order. */
  tokens: ServedOption[];
  trayOrder: string[];
}

export type ServedItem = ServedSingle | ServedMulti | ServedOrdering | ServedMatching;

// ---------- Answers (as autosaved) ----------

export interface SingleAnswer {
  type: "single";
  optionId: string;
}

export interface MultiAnswer {
  type: "multi";
  optionIds: string[];
}

export interface OrderingAnswer {
  type: "ordering";
  /** The current arrangement of element ids. Present only once the item has been moved. */
  arrangement: string[];
}

export interface MatchingAnswer {
  type: "matching";
  /** token id -> bucket id, or null when the token is back in the tray. Partial placements are autosaved. */
  placements: Record<string, string | null>;
}

export type Answer = SingleAnswer | MultiAnswer | OrderingAnswer | MatchingAnswer;

/** item id -> answer. Absent entries are unanswered. */
export type Answers = Record<string, Answer>;

// ---------- Paper (what the seed produced, stored on the attempt) ----------

export interface SeedInputs {
  userId: string;
  assessmentId: AssessmentId;
  attemptNumber: number;
  bankVersion: number;
}

export interface ItemPresentation {
  /** single and multi: option ids in presentation order. */
  optionOrder?: string[];
  /** ordering: element ids in the starting arrangement. */
  initialArrangement?: string[];
  /** matching: token ids in tray order. */
  trayOrder?: string[];
}

export interface Paper {
  seed: string;
  seedInputs: SeedInputs;
  /** Item ids in served (presentation) order. */
  servedItemIds: string[];
  /** item id -> presentation details. */
  presentation: Record<string, ItemPresentation>;
}

// ---------- Scoring and prescription ----------

export interface SectionScore {
  section: SectionId;
  served: number;
  score: number;
  threshold: number;
  met: boolean;
}

export type ModuleId = "TA-1" | "SQL-1" | "SQL-2" | "PY-1" | "PY-2a" | "PY-2b" | "GIT-1";

export type ModuleOutcome = "prescribed" | "credited" | "evidence_review" | "not_assessed";

export interface ModulePrescription {
  module: ModuleId;
  outcome: ModuleOutcome;
}

/** Reporting shorthand, derived only, never shown to participants. */
export type Shorthand = "P1" | "P2" | "P3" | "P4" | null;

export interface SectionMet {
  fundamentals: boolean;
  foundations: boolean;
  applied: boolean;
  core: boolean;
  testing: boolean;
}

export interface TrainingPlanModule {
  module: ModuleId;
  title: string;
  hours: number;
  outcome: ModuleOutcome;
  courseName: string;
  courseLinks: string[];
}

export interface TrainingPlan {
  modules: TrainingPlanModule[];
  prescribedHours: number;
}

export type AttemptStatus = "not_started" | "in_progress" | "submitted" | "void";
