import type { AssessmentId, ItemType, ModuleId, SectionId } from "./types";

export interface SectionDef {
  id: SectionId;
  title: string;
  slots: number[];
  /** Score required to meet the section (docs/03 thresholds, confirmed defaults). */
  threshold: number;
}

export interface AssessmentDef {
  id: AssessmentId;
  title: string;
  shortTitle: string;
  durationMinutes: number;
  questionCount: number;
  sections: SectionDef[];
  /** Item type fixed per slot so every paper is structurally identical. */
  slotTypes: Record<number, ItemType>;
}

function range(from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = from; i <= to; i += 1) out.push(i);
  return out;
}

export const ASSESSMENT_IDS: readonly AssessmentId[] = ["ta", "sql", "python"] as const;

export const ASSESSMENTS: Record<AssessmentId, AssessmentDef> = {
  ta: {
    id: "ta",
    title: "Test Automation Fundamentals",
    shortTitle: "Test automation",
    durationMinutes: 10,
    questionCount: 10,
    sections: [{ id: "fundamentals", title: "TA fundamentals", slots: range(1, 10), threshold: 8 }],
    slotTypes: {
      1: "single",
      2: "ordering",
      3: "single",
      4: "single",
      5: "multi",
      6: "single",
      7: "single",
      8: "multi",
      9: "matching",
      10: "single",
    },
  },
  sql: {
    id: "sql",
    title: "SQL",
    shortTitle: "SQL",
    durationMinutes: 10,
    questionCount: 10,
    sections: [
      { id: "foundations", title: "SQL foundations", slots: range(1, 6), threshold: 5 },
      { id: "applied", title: "SQL applied", slots: range(7, 10), threshold: 3 },
    ],
    slotTypes: {
      1: "single",
      2: "single",
      3: "single",
      4: "single",
      5: "single",
      6: "single",
      7: "single",
      8: "single",
      9: "single",
      10: "multi",
    },
  },
  python: {
    id: "python",
    title: "Python",
    shortTitle: "Python",
    durationMinutes: 10,
    questionCount: 10,
    sections: [
      { id: "core", title: "Python core", slots: range(1, 6), threshold: 5 },
      { id: "testing", title: "Python testing", slots: range(7, 10), threshold: 3 },
    ],
    slotTypes: {
      1: "single",
      2: "single",
      3: "single",
      4: "single",
      5: "single",
      6: "single",
      7: "multi",
      8: "single",
      9: "single",
      10: "multi",
    },
  },
};

/** Slots docs/04 marks as contested (3 calibrated items instead of 2). */
export const CONTESTED_SLOTS: Record<AssessmentId, number[]> = {
  ta: [],
  sql: [2, 7, 8],
  python: [6, 7],
};

export const MIN_ITEMS_PER_SLOT = 2;
export const MIN_ITEMS_PER_CONTESTED_SLOT = 3;

export function requiredDepth(assessment: AssessmentId, slot: number): number {
  return CONTESTED_SLOTS[assessment].includes(slot) ? MIN_ITEMS_PER_CONTESTED_SLOT : MIN_ITEMS_PER_SLOT;
}

export function sectionForSlot(assessment: AssessmentId, slot: number): SectionDef {
  const def = ASSESSMENTS[assessment];
  const section = def.sections.find((s) => s.slots.includes(slot));
  if (!section) throw new Error(`No section for ${assessment} slot ${slot}`);
  return section;
}

export function isAssessmentId(value: string): value is AssessmentId {
  return (ASSESSMENT_IDS as readonly string[]).includes(value);
}

export interface ModuleDef {
  id: ModuleId;
  title: string;
  hours: number;
  courseName: string;
  courseLinks: string[];
  assessed: boolean;
}

/** Recommended sequence per docs/02. Hours per docs/01. */
export const MODULES: readonly ModuleDef[] = [
  {
    id: "TA-1",
    title: "Test automation foundations",
    hours: 8,
    courseName: "ISTQB Certified Test Automation Engineer CTAL-TAE V2 (Udemy)",
    courseLinks: ["https://www.udemy.com/course/istqb-certified-tester-test-automation-engineer-ct-ctal-tae-v2/"],
    assessed: true,
  },
  {
    id: "SQL-1",
    title: "SQL foundations",
    hours: 7,
    courseName: "Intermediate SQL then Joining Data in SQL (DataCamp)",
    courseLinks: ["https://www.datacamp.com/courses/intermediate-sql", "https://www.datacamp.com/courses/joining-data-in-sql"],
    assessed: true,
  },
  {
    id: "SQL-2",
    title: "SQL for testing",
    hours: 2,
    courseName: "SQL for Testers (LinkedIn Learning)",
    courseLinks: ["https://www.linkedin.com/learning/sql-for-testers"],
    assessed: true,
  },
  {
    id: "PY-1",
    title: "Python foundations",
    hours: 20,
    courseName: "Programming for Everybody (Coursera)",
    courseLinks: ["https://www.coursera.org/learn/python"],
    assessed: true,
  },
  {
    id: "PY-2a",
    title: "pytest core",
    hours: 9,
    courseName: "Python Automation Testing With Pytest (Udemy)",
    courseLinks: ["https://www.udemy.com/course/python-automation-pytest/"],
    assessed: true,
  },
  {
    id: "PY-2b",
    title: "Testing data with Python",
    hours: 4,
    courseName: "Introduction to Testing in Python (DataCamp)",
    courseLinks: ["https://www.datacamp.com/courses/introduction-to-testing-in-python"],
    assessed: true,
  },
  {
    id: "GIT-1",
    title: "Git essentials",
    hours: 3,
    courseName: "Confirmed separately",
    courseLinks: [],
    assessed: false,
  },
];

export const MODULE_BY_ID: Record<ModuleId, ModuleDef> = Object.fromEntries(MODULES.map((m) => [m.id, m])) as Record<
  ModuleId,
  ModuleDef
>;

export const APP_NAME = "Avec Capability Placement";
export const TITLE_DEVICE = "Avec / Capability Placement";
export const TIMEZONE = "Australia/Melbourne";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;
export const TIMER_AMBER_SECONDS = 120;
